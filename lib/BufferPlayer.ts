export default class BufferPlayer {

  audioCtx: AudioContext;
  targetNode: AudioNode;
  buffer: Uint8Array;

  constructor(audioCtx: AudioContext, targetNode: AudioNode) {
    this.audioCtx = audioCtx;
    this.targetNode = targetNode;
    this.buffer = new Uint8Array();
    setInterval(this.play.bind(this), 1000);
  }

  feed(data: Uint8Array) {
    const c = new Uint8Array(this.buffer.length + data.length);
    c.set(this.buffer);
    c.set(data, this.buffer.length);
    this.buffer = c;
  }

  private play() {
    const length = Math.floor(this.buffer.length / 2);
    if (length < 44100) {
      return;
    }
    const [data, keep] = ((): [Int16Array, Uint8Array] => {
      if (length != this.buffer.length) {
        const p = new Int16Array(this.buffer.slice(0, length * 2).buffer);
        const k = this.buffer.slice(length * 2);
        return [p, k];
      }
      return [new Int16Array(this.buffer.buffer), new Uint8Array()];
    })();
    this.buffer = keep;

    const playable = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      playable[i] = data[i] / 32768 * (i < 50 ? (i / 50) : i + 50 > data.length ? ((i + 50 - data.length) / 50) : 1);
    }

    const audioBuffer = this.audioCtx.createBuffer(1, playable.length, 44100);
    audioBuffer.getChannelData(0).set(playable);
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.targetNode);
    source.start();
  }
}
