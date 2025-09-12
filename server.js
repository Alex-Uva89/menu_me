// server.js (ESM, Express 5 — semplice e solido)
import express from 'express';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const dist = join(__dirname, 'dist', 'pwa');

// GZIP
app.use(compression());

// ---- PROXY API ----
app.use('/api', createProxyMiddleware({
  target: 'https://backend-rough-snow-2736.fly.dev',
  changeOrigin: true,
}));

// (opzionale) proxy /public come su Netlify
app.use('/public', createProxyMiddleware({
  target: 'https://backend-rough-snow-2736.fly.dev',
  changeOrigin: true,
  pathRewrite: { '^/public': '/public' },
  onProxyRes(res) { res.headers['Cache-Control'] = 'no-store'; }
}));

// Headers per SW/manifest
app.get('/service-worker.js', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res, next) => {
  res.type('application/manifest+json; charset=utf-8');
  next();
});

// Statici fingerprinted: cache lunga
app.use('/assets', express.static(join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
app.use('/icons',  express.static(join(dist, 'icons'),  { immutable: true, maxAge: '1y' }));
// Alcuni PWA usano /img/icons/* → mappa a /icons/*
app.use('/img/icons', express.static(join(dist, 'icons'), { immutable: true, maxAge: '1y' }));

// Statici generali; no-cache sugli HTML
app.use(express.static(dist, {
  setHeaders: (res, p) => {
    if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// ---- CATCH-ALL SPA FALLBACK (nessun pattern) ----
// Entra solo per GET "normali" che chiedono HTML e non iniziano con /api o /public
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/public')) return next();
  if (!req.headers.accept || !req.headers.accept.includes('text/html')) return next();
  res.sendFile(join(dist, 'index.html'));
});

// Healthcheck (opzionale)
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on :${PORT}`));
