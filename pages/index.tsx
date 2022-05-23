import type { NextPage } from 'next';
import Player from '../components/Player';

import 'bootstrap/dist/css/bootstrap.min.css';

const Home: NextPage = () => {
  return (
      <Player style={{
        width: '50%',
        alignContent: 'center',
        margin: '16px'
      }}
      />
  );
};

// noinspection JSUnusedGlobalSymbols
export default Home;
