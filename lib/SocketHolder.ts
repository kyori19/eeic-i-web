import { createServer, Socket } from 'net';
import { v4 as uuidV4 } from 'uuid';

type Speaker = Socket;

class SocketHolder {
  speakers: Map<string, Speaker> = new Map<string, Speaker>();

  constructor(port: number) {
    createServer((socket) => {
      socket.write('Connection accepted.\n');
      let key = uuidV4();
      while (this.speakers.has(key)) {
        key = uuidV4();
      }
      this.speakers.set(key, socket);
      socket.on('close', () => {
        this.speakers.delete(key);
      });
      socket.write(`Connection successful! Your Speaker ID is ${key}.\n`);
    }).listen(port, () => {
      console.log(`Ready on tcp://localhost:${port}`);
    });
  }
}

export default SocketHolder;
