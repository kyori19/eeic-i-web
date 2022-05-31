import type { NextPage } from 'next';
import { useCallback, useEffect, useState } from 'react';
import Player from '../components/Player';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card } from 'react-bootstrap';

const Home: NextPage = () => {
  const [speakers, setSpeakers] = useState<string[]>([]);

  const fetchSpeakers = useCallback(() => {
    fetch('/speakers')
        .then((res) => res.text())
        .then((text) => {
          setSpeakers(JSON.parse(text));
        });
  }, [setSpeakers]);

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
          <Card.Title>Speakers List</Card.Title>

          {speakers.length > 0 ?
           speakers.map((id) => (
               <Player key={id}
                       id={id}
                       style={{
                         width: '50%',
                         alignContent: 'center',
                         margin: '16px',
                       }}
                       requestReset={() => {
                         fetch('/speakers')
                             .then((res) => res.text())
                             .then((text) => {
                               setSpeakers(JSON.parse(text));
                             });
                       }}
               />
           )) :
           (<span className="text-muted">No speakers available now!</span>)}
        </Card>
      </>
  );
};

// noinspection JSUnusedGlobalSymbols
export default Home;
