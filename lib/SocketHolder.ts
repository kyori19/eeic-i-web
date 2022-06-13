import { v4 as uuidV4 } from 'uuid';
import { Readable } from 'stream';

type Speaker = Readable;

class SocketHolder {
  speakers: Map<string, Speaker> = new Map<string, Speaker>();

  addSpeaker(socket: Readable): string {
    let key = uuidV4();
    while (this.speakers.has(key)) {
      key = uuidV4();
    }
    this.speakers.set(key, socket);
    socket.setMaxListeners(2000);
    socket.on('close', () => {
      this.speakers.delete(key);
    });
    return key;
  }
}

export default SocketHolder;
