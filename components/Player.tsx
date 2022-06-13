import { FC, useEffect, useMemo, useState } from 'react';
import { Card, CardProps, Col, Container, Form, Row } from 'react-bootstrap';
import IconButton from './IconButton';
import BufferPlayer from '../lib/BufferPlayer';

export type PlayerProps = CardProps & {
  id: string,
  requestReset: () => void,
  audioCtx: AudioContext,
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
    const sock = new WebSocket(`ws://${location.host}/listen?id=${id}`);
    const player = new BufferPlayer(audioCtx, gainNode);
    sock.addEventListener('message', ({ data: value }: MessageEvent<Blob>) => {
      value.arrayBuffer()
          .then((buf) => {
            player.feed(new Uint8Array(buf));
          });
    });
    sock.addEventListener('close', requestReset);
    return () => {
      sock.close();
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
