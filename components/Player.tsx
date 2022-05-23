import { FC, useEffect, useState } from 'react';
import PCMPlayer from 'pcm-player';
import { Form } from 'react-bootstrap';

const Player: FC = (_) => {
  const [player, setPlayer] = useState<PCMPlayer | undefined>();

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

  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (player) {
      player.volume(volume);
    }
  }, [player, volume]);

  return (
      <>
        <Form.Range min={0}
                    max={5}
                    step={0.01}
                    value={volume}
                    onChange={({ target: { value } }) => {
                      setVolume(parseFloat(value));
                    }}
        />
      </>
  );
};

export default Player;
