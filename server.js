import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const app = express();
const dist = join(__dirname, 'dist', 'pwa');

// proxy al backend: puoi usare http-proxy-middleware se serve
// app.use('/public', createProxyMiddleware({ target: 'https://backend-rough-snow-2736.fly.dev', changeOrigin: true }));

// headers no-cache per html
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use(express.static(dist));

// fallback SPA
app.get('*', (req, res) => {
  res.sendFile(join(dist, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}`));
