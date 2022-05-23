import type { NextApiRequest, NextApiResponse } from 'next';
import * as net from 'net';

// noinspection JSUnusedGlobalSymbols
export default function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
  const client = net.connect(9050, 'localhost', () => {
    console.log('Connection established to the server');
  });
  client.on('data', (data) => {
    res.write(data);
  });
  client.on('close', () => {
    res.end();
  });
  client.on('error', () => {
    res.end();
  });
  res.on('close', () => {
    client.end();
  });
  res.on('error', () => {
    client.end();
  });
};
