import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {createServer as createViteServer} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const publicDir = path.resolve(__dirname, 'public');
  const distDir = path.resolve(__dirname, 'dist');
  const vslPath = path.resolve(__dirname, 'src/vsl.html');

  const serveSalesPage = (_req: express.Request, res: express.Response) => {
    const html = fs.readFileSync(vslPath, 'utf-8');
    res
      .status(200)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      .send(html);
  };

  // Serve the imported sales page at "/"
  app.get('/', serveSalesPage);
  app.get('/index.html', serveSalesPage);

  const staticOptions: Parameters<typeof express.static>[1] = {
    index: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    },
  };

  // Serve prebuilt static assets from public/ (and dist/ in production)
  if (isProd && fs.existsSync(distDir)) {
    app.use(express.static(distDir, staticOptions));
  }
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, staticOptions));
  }

  if (!isProd) {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'custom',
    });
    app.use(vite.middlewares);
  }

  // Fallback to the sales page for any unmatched GET route
  app.get('*', serveSalesPage);

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
