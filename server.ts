import next from 'next';
import { createServer as createTCPServer } from 'net';
import { createServer as createHTTPServer} from 'http';
import { parse } from 'url';
import SocketHolder from './lib/SocketHolder.js';
import { ParsedUrlQuery } from 'querystring';
import * as Buffer from 'buffer';
import { createWebSocketStream, WebSocketServer } from 'ws';

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
  const socketHolder = new SocketHolder();

  const speakPort = port + 1;
  createTCPServer((socket) => {
    socket.write('Connection accepted.\n');
    const key = socketHolder.addSpeaker(socket);
    socket.write(`Connection successful! Your Speaker ID is ${key}.\n`);
  }).listen(speakPort, () => {
    console.log(`Ready on tcp://localhost:${speakPort}`);
  });

  const listenPort = speakPort + 1;
  createTCPServer((sock) => {
    sock.on('data', (data) => {
      const id = data.toString().trim();
      if (!socketHolder.speakers.has(id)) {
        sock.end();
        return;
      }

      const socket = socketHolder.speakers.get(id)!!;
      const pipeData = (data: Buffer) => {
        sock.write(data);
      };
      const disconnect = () => {
        sock.end();
        socket.removeListener('data', pipeData);
        socket.removeListener('end', disconnect);
        socket.removeListener('error', disconnect);
      };
      socket.on('data', pipeData);
      socket.on('end', disconnect);
      socket.on('error', disconnect);
    })
  }).listen(listenPort, () => {
    console.log(`Ready on tcp://localhost:${listenPort}`);
  });

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
        break;
      }
      case '/speak': {
        ws.emit('Connection accepted.');
        const stream = createWebSocketStream(ws);
        const key = socketHolder.addSpeaker(stream);
        ws.on('close', () => {
          stream.emit('close');
        });
        ws.emit(`Connection successful! Your Speaker ID is ${key}.\n`);
        break;
      }
    }
  });

  const server = createHTTPServer(async (req, res) => {
    try {
      // noinspection JSDeprecatedSymbols
      const parsedUrl = parse(req.url || '', true);

      switch (parsedUrl.pathname) {
        case '/speakers': {
          res.statusCode = 200;
          res.end(JSON.stringify(Array.from(socketHolder.speakers.keys())));
          break;
        }
        case '/listen':
        case '/speak': {
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
      case '/listen':
      case '/speak': {
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
