import { FC, useEffect, useMemo, useState } from 'react';
import PCMPlayer from 'pcm-player';
import { Button, Card, CardProps, Col, Container, Form, Row } from 'react-bootstrap';
import Icon from '@reacticons/bootstrap-icons';

const Player: FC<CardProps> = (props) => {
  const [player, setPlayer] = useState<PCMPlayer | undefined>();
  const [volumeGauge, setVolumeGauge] = useState(1);
  const [muted, setMuted] = useState(false);
  const volume = useMemo(() => muted ? 0 : volumeGauge, [muted, volumeGauge]);

  useEffect(() => {
    if (!player) {
      const p = new PCMPlayer({
        inputCodec: 'Int16',
        channels: 1,
        sampleRate: 44100,
        flushTime: 2000,
      });
      setPlayer(p);
      return;
    }
    fetch('/api/socket')
        .then(({ body }) => {
          if (!body) {
            throw new Error();
          }

          const reader = body.getReader();

          const onData = ({ done, value }: ReadableStreamDefaultReadResult<Uint8Array>) => {
            if (done || !value) {
              return;
            }
            player.feed(value.buffer);
            reader.read().then(onData);
          };

          return reader.read().then(onData);
        });
  }, [player]);

  useEffect(() => {
    if (player) {
      player.volume(volume);
    }
  }, [player, volume]);

  return (
      <Card body {...props}>
        <Container>
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
