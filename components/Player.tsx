import { FC, useEffect, useMemo, useState } from 'react';
import PCMPlayer from 'pcm-player';
import { Button, Card, CardProps, Col, Container, Form, Row } from 'react-bootstrap';
import Icon from '@reacticons/bootstrap-icons';

export type PlayerProps = CardProps & {
  id: string,
  requestReset: () => void,
};

const concatArray = (a: Uint8Array, b: Uint8Array) => {
  const c = new Uint8Array(a.byteLength + b.byteLength);
  c.set(a, 0);
  c.set(b, a.byteLength);
  return c;
};

const Player: FC<PlayerProps> = ({ id, requestReset, ...props }) => {
  const [player, setPlayer] = useState<PCMPlayer | undefined>();
  const [volumeGauge, setVolumeGauge] = useState(1);
  const [muted, setMuted] = useState(false);
  const volume = useMemo(() => muted ? 0 : volumeGauge, [muted, volumeGauge]);

  useEffect(() => {
    let p = player;
    if (!p) {
      p = new PCMPlayer({
        inputCodec: 'Int16',
        channels: 1,
        sampleRate: 44100,
        flushTime: 2000,
      });
      setPlayer(p);
    }

    let cache: Uint8Array = new Uint8Array();
    const abort = new AbortController();
    fetch(`/listen?id=${id}`, { signal: abort.signal })
        .then(({ body }) => {
          if (!body) {
            return;
          }

          const reader = body.getReader();

          const onData = ({ done, value }: ReadableStreamDefaultReadResult<Uint8Array>): undefined | Promise<undefined | ReadableStreamDefaultReadValueResult<Uint8Array> | ReadableStreamDefaultReadDoneResult> => {
            if (done || !value) {
              requestReset();
              return;
            }
            let data = concatArray(cache, value);
            if (data.byteLength % 2 != 0) {
              cache = data.slice(-1);
              data = data.slice(0, -1);
            } else {
              cache = new Uint8Array();
            }
            p!!.feed(data);
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
    if (player) {
      player.volume(volume);
    }
  }, [player, volume]);

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
              <Button variant={muted ? 'outline-danger' : 'outline-dark'}
                      onClick={() => setMuted(!muted)}
              >
                <Icon name={muted ? 'volume-mute' : 'volume-up'}/>
              </Button>
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
