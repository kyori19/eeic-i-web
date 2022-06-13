import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import SocketHolder from './lib/SocketHolder.js';
import { ParsedUrlQuery } from 'querystring';
import * as Buffer from 'buffer';
import { WebSocketServer } from 'ws';

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

  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws, req) => {
    const { pathname, query } = parse(req.url || '', true);
    switch (pathname) {
      case '/listen': {
        if (!query.id) {
          break;
        }

        const id = parseQuery(query.id);
        if (!socketHolder.speakers.has(id)) {
          ws.close(1100, 'Speaker not found');
          break;
        }

        const socket = socketHolder.speakers.get(id)!!;
        const pipeData = (data: Buffer) => {
          ws.send(data);
        };
        const disconnect = () => {
          ws.close();
          socket.removeListener('data', pipeData);
          socket.removeListener('end', disconnect);
          socket.removeListener('error', disconnect);
        };
        socket.on('data', pipeData);
        socket.on('end', disconnect);
        socket.on('error', disconnect);
      }
    }
  });

  const server = createServer(async (req, res) => {
    try {
      // noinspection JSDeprecatedSymbols
      const parsedUrl = parse(req.url || '', true);

      switch (parsedUrl.pathname) {
        case '/speakers': {
          res.statusCode = 200;
          res.end(JSON.stringify(Array.from(socketHolder.speakers.keys())));
          break;
        }
        case '/listen': {
          res.statusCode = 400;
          res.end('Requires WebSocket request.');
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
  });
  server.maxConnections = 2000;
  server.on('upgrade', (req, sock, head) => {
    const { pathname } = parse(req.url || '', true);
    switch (pathname) {
      case '/listen': {
        wss.handleUpgrade(req, sock, head, (ws) => {
          wss.emit('connection', ws, req);
        });
        break;
      }
    }
  });
  server.listen(port, () => {
    // noinspection HttpUrlsUsage
    console.log(`Ready on http://${hostname}:${port}`);
  });
});
