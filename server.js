// server.js (ESM)
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

// === PROXY API (se la tua SPA chiama /api/*) ===
// Cambia target se necessario
app.use('/api', createProxyMiddleware({
  target: 'https://backend-rough-snow-2736.fly.dev',
  changeOrigin: true
}));

// (Se usi /public/* come su Netlify, tieni anche questo)
app.use('/public', createProxyMiddleware({
  target: 'https://backend-rough-snow-2736.fly.dev',
  changeOrigin: true,
  pathRewrite: { '^/public': '/public' },
  onProxyRes(proxyRes) { proxyRes.headers['Cache-Control'] = 'no-store'; }
}));

// NO-CACHE per HTML e SW
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
// Il tuo PWA chiede anche /img/icons/* → mappa a /icons/*
app.use('/img/icons', express.static(join(dist, 'icons'), { immutable: true, maxAge: '1y' }));

// Altri statici, no-cache sugli HTML
app.use(express.static(dist, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(dist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on :${PORT}`));
