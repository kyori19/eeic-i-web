import type { NextPage } from 'next';
import { useCallback, useEffect, useState } from 'react';
import Player from '../components/Player';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Col, Container, Row } from 'react-bootstrap';
import IconButton from '../components/IconButton';
import SpeakerInstruction from '../components/SpeakerInstruction';

const Home: NextPage = () => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | undefined>(undefined);

  useEffect(() => {
    if (!audioCtx) {
      setAudioCtx(new window.AudioContext());
    }
    // eslint-disable-next-line
  }, []);

  const [speakers, setSpeakers] = useState<string[]>([]);
  const [showInstruction, setShowInstruction] = useState(false);

  const fetchSpeakers = useCallback(() => {
    fetch('/speakers')
        .then((res) => res.text())
        .then((text) => {
          setSpeakers(JSON.parse(text));
        });
  }, []);

  useEffect(() => {
    fetchSpeakers();
    const timer = setInterval(fetchSpeakers, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [fetchSpeakers]);

  return (
      <>
        <Card body
              style={{
                margin: '16px',
              }}
        >
          <Card.Title>
            <Container>
              <Row className="align-items-center">
                <Col style={{
                  flexGrow: 1,
                }}
                >
                  Speakers List
                </Col>
                <Col style={{
                  width: 'initial',
                  flexGrow: 0,
                }}
                >
                  <IconButton variant="outline-primary"
                              name="question"
                              onClick={() => {
                                setShowInstruction((prev) => !prev);
                              }}
                  />
                  <SpeakerInstruction show={showInstruction}
                                      onHide={() => {
                                        setShowInstruction(false);
                                      }}
                  />
                </Col>
              </Row>
            </Container>
          </Card.Title>

          {audioCtx && speakers.length > 0 ?
           speakers.map((id) => (
               <Player key={id}
                       id={id}
                       style={{
                         width: '50%',
                         alignContent: 'center',
                         margin: '16px',
                       }}
                       requestReset={fetchSpeakers}
                       audioCtx={audioCtx}
               />
           )) :
           (<span className="text-muted">No speakers available now!</span>)}
        </Card>
      </>
  );
};

// noinspection JSUnusedGlobalSymbols
export default Home;
