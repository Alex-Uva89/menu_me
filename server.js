// server.js (ESM, Express 5)
import express from 'express';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const dist = join(__dirname, 'dist', 'pwa');

// --- gzip ---
app.use(compression());

// --- PROXY API ---
// /api -> backend
app.use('/api', createProxyMiddleware({
  target: 'https://backend-rough-snow-2736.fly.dev',
  changeOrigin: true,
}));

// /public -> backend (come su Netlify)
app.use('/public', createProxyMiddleware({
  target: 'https://backend-rough-snow-2736.fly.dev',
  changeOrigin: true,
  pathRewrite: { '^/public': '/public' },
  onProxyRes(proxyRes) { proxyRes.headers['Cache-Control'] = 'no-store'; }
}));

// --- Headers specifici per SW/manifest ---
app.get('/service-worker.js', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res, next) => {
  res.type('application/manifest+json; charset=utf-8');
  next();
});

// --- Statici fingerprinted: cache lunga ---
app.use('/assets', express.static(join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
app.use('/icons',  express.static(join(dist, 'icons'),  { immutable: true, maxAge: '1y' }));
// Il PWA potrebbe richiedere /img/icons/*: mappalo a /icons/*
app.use('/img/icons', express.static(join(dist, 'icons'), { immutable: true, maxAge: '1y' }));

// --- Statici generali; no-cache sugli HTML ---
app.use(express.static(dist, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// --- SPA fallback (Express 5: niente '*' o '/*') ---
// Variante che esclude /api e /public dal fallback
app.get('/:path((?!api|public).*)', (req, res) => {
  res.sendFile(join(dist, 'index.html'));
});

// (opzionale) healthcheck
app.get('/healthz', (req, res) => res.status(200).send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on :${PORT}`));
