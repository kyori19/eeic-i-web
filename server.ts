import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import SocketHolder from './lib/SocketHolder.js';
import { ParsedUrlQuery } from 'querystring';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({
  dev,
  hostname,
  port,
});
const handle = app.getRequestHandler();

const parseQuery = (data: Exclude<ParsedUrlQuery[string], undefined>): string => {
  if (typeof data === 'string') {
    return data;
  }
  return data[0];
};

app.prepare().then(() => {
  const socketHolder = new SocketHolder(port + 1);

  createServer(async (req, res) => {
    try {
      // noinspection JSDeprecatedSymbols
      const parsedUrl = parse(req.url || '', true);
      const { pathname, query } = parsedUrl;

      switch (pathname) {
        case '/speakers': {
          res.statusCode = 200;
          res.end(JSON.stringify(Array.from(socketHolder.speakers.keys())));
          break;
        }
        case '/listen': {
          if (!query.id) {
            res.statusCode = 422;
            res.end('Speaker ID not defined');
            break;
          }

          const id = parseQuery(query.id);
          if (!socketHolder.speakers.has(id)) {
            res.statusCode = 422;
            res.end('Speaker not found');
            break;
          }

          res.statusCode = 200;
          const socket = socketHolder.speakers.get(id)!!;
          socket.on('data', (data) => {
            res.write(data);
          });
          socket.on('end', () => {
            res.end();
          });
          socket.on('error', () => {
            res.end();
          });
          break;
        }
        default: {
          await handle(req, res, parsedUrl);
          break;
        }
      }
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
