class RecordingProcessor extends AudioWorkletProcessor implements AudioWorkletProcessorImpl {
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const src = inputs[0][0];
    const buf = new Int16Array(src.length);
    for (let i = 0; i < src.length; i++) {
      buf[i] = src[i] * 32768;
    }
    this.port.postMessage(buf);
    return true;
  }
}

registerProcessor('RecordingProcessor', RecordingProcessor);
