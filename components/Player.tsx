import { FC, useEffect, useMemo, useState } from 'react';
import { Card, CardProps, Col, Container, Form, Row } from 'react-bootstrap';
import IconButton from './IconButton';

export type PlayerProps = CardProps & {
  id: string,
  requestReset: () => void,
  audioCtx: AudioContext,
};

const concatData = (a: Int8Array, b: Uint8Array): [Int16Array, Int8Array] => {
  if (a.length == 0) {
    if (b.length % 2 == 0) {
      return [new Int16Array(b.buffer), new Int8Array()];
    }
    return [new Int16Array(b.slice(0, -1).buffer), new Int8Array(b.slice(-1).buffer)];
  }

  if (b.length % 2 == 0) {
    const c = new Int8Array(a.length + b.length - 1);
    c.set(a);
    c.set(b, a.length);
    return [new Int16Array(c.buffer), new Int8Array(b.slice(-1).buffer)];
  }
  const c = new Int8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return [new Int16Array(c.buffer), new Int8Array()];
};

const Player: FC<PlayerProps> = ({ id, requestReset, audioCtx, ...props }) => {
  const gainNode = useMemo(() => {
    const node = audioCtx.createGain();
    node.connect(audioCtx.destination);
    return node;
  }, [audioCtx]);
  const [volumeGauge, setVolumeGauge] = useState(1);
  const [muted, setMuted] = useState(false);
  const volume = useMemo(() => muted ? 0 : volumeGauge, [muted, volumeGauge]);

  useEffect(() => {
    let cache = new Int8Array();
    const abort = new AbortController();
    fetch(`/listen?id=${id}`, { signal: abort.signal })
        .then(({ body }) => {
          if (!body) {
            return;
          }

          const reader = body.getReader();

          const onData = (
              {
                done,
                value,
              }: ReadableStreamDefaultReadResult<Uint8Array>,
          ): undefined | Promise<undefined | ReadableStreamDefaultReadValueResult<Uint8Array> | ReadableStreamDefaultReadDoneResult> => {
            if (done || !value) {
              requestReset();
              return;
            }
            let data: Int16Array;
            [data, cache] = concatData(cache, value);
            const buffer = audioCtx.createBuffer(1, data.length, 44100);
            const floatArray = new Float32Array(data.length);
            for (let i = 0; i < data.length; i++) {
              floatArray[i] = data[i] / 32768;
            }
            buffer.getChannelData(0).set(floatArray);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(gainNode);
            source.start();
            return reader.read().then(onData).catch();
          };

          return reader.read().then(onData).catch();
        })
        .catch((e) => {
          if (e.name != 'AbortError') {
            console.log(e);
          }
        });
    return () => {
      abort.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, requestReset]);

  useEffect(() => {
    gainNode.gain.value = volume;
  }, [gainNode, volume]);

  return (
      <Card body {...props}>
        <Container>
          <Row>
            <Col xs="auto">
              Speaker ID: {id}
            </Col>
          </Row>
          <Row className="align-items-center">
            <Col xs="auto">
              <IconButton variant={muted ? 'outline-danger' : 'outline-dark'}
                          onClick={() => setMuted(!muted)}
                          name={muted ? 'volume-mute' : 'volume-up'}
              />
            </Col>

            <Col style={{
              marginTop: 'auto',
            }}
            >
              <Form.Range min={0}
                          max={5}
                          step={0.01}
                          disabled={muted}
                          value={volumeGauge}
                          onChange={({ target: { value } }) => {
                            setVolumeGauge(parseFloat(value));
                          }}
              />
            </Col>
          </Row>
        </Container>
      </Card>
  );
};

export default Player;
