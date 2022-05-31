import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({
  dev,
  hostname,
  port,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // noinspection JSDeprecatedSymbols
      const parsedUrl = parse(req.url || '', true);

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, () => {
    // noinspection HttpUrlsUsage
    console.log(`Ready on http://${hostname}:${port}`);
  });
});
