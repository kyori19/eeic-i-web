import { FC, useCallback, useState } from 'react';
import IconButton from './IconButton';
import { Col, Container, Navbar, Row } from 'react-bootstrap';

export type RecorderProps = {
  audioCtx: AudioContext,
}

const Recorder: FC<RecorderProps> = ({ audioCtx }) => {
  const [rec, setRec] = useState<{ ws: WebSocket, mic: MediaStream } | undefined>(undefined);

  const startRecord = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((mic) => {
          const source = audioCtx.createMediaStreamSource(mic);
          const ws = new WebSocket(`ws://${location.host}/speak`);

          audioCtx.audioWorklet.addModule('/recording.js')
              .then(() => {
                class RecordingNode extends AudioWorkletNode {
                  constructor(context: BaseAudioContext) {
                    super(context, 'RecordingProcessor', {
                      numberOfInputs: 1,
                      numberOfOutputs: 0,
                      channelCount: 1,
                    });
                    this.port.onmessage = ({ data }: MessageEvent<Int16Array>) => {
                      if (ws.readyState === WebSocket.OPEN) {
                        ws.send(data.buffer);
                      }
                    };
                  }
                }

                const node = new RecordingNode(audioCtx);
                source.connect(node);
                setRec({ ws, mic });
              });
        });
  }, [audioCtx]);

  const stopRecord = useCallback(() => {
    if (!rec) {
      return;
    }
    rec.mic.getTracks().forEach((track) => {
      track.stop();
    });
    rec.ws.close();
    setRec(undefined);
  }, [rec]);

  return (
      <Navbar fixed="bottom" variant="dark" bg="dark">
        <Container>
          <Row className="justify-content-center w-100">
            <Col xs="3">
              <Container className="h-100">
                <Row className="align-items-center h-100">
                  <Col className={rec ? 'text-danger' : 'text-muted'}>
                    {rec ? 'connected' : 'not connected'}
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col xs="1">
              <IconButton name="mic"
                          variant={rec ? 'danger' : 'outline-danger'}
                          onClick={rec ? stopRecord : startRecord}
              />
            </Col>
          </Row>
        </Container>
      </Navbar>
  );
};

export default Recorder;
