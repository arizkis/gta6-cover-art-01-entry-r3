import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { homedir } from 'node:os';
import { createServer } from 'node:http';

export async function launchBrowser(puppeteer) {
  const root = join(homedir(), '.cache/puppeteer/chrome');
  const version = readdirSync(root).sort().at(-1);
  const executablePath = join(root, version, 'chrome-linux64/chrome');

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox']
  });
}

export async function serveStudio() {
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.ttf': 'font/ttf',
    '.jpg': 'image/jpeg'
  };

  const server = createServer((request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      if (path.includes('..')) throw new Error('Invalid asset path');

      const relativePath = path === '/' ? 'index.html' : path;
      const file = join(process.cwd(), 'app', relativePath);

      response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      response.end(readFileSync(file));
    } catch {
      response.statusCode = 404;
      response.end();
    }
  });

  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  return {
    server,
    url: `http://127.0.0.1:${server.address().port}`
  };
}
