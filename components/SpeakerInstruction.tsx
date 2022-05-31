import { FC, useEffect, useState } from 'react';
import { Modal, ModalProps, Table } from 'react-bootstrap';

const SpeakerInstruction: FC<ModalProps> = (props) => {
  const [loc, setLoc] = useState<typeof location | undefined>(undefined);

  useEffect(() => {
    setLoc(location);
  }, []);

  return (
      <Modal {...props}>
        <Modal.Header>How to Join as a Speaker?</Modal.Header>

        <Modal.Body>
          <p>
            In order to join this session as a speaker,
            you have to connect to <code>tcp://{loc?.hostname}:{loc && parseInt(loc.port) + 1}</code> and
            send raw audio data in specific format.
          </p>
          <p>
            Support audio format is PCM.
            <Table bordered={true}>
              <tbody>
              <tr>
                <td>Channels</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Sample Rate</td>
                <td>44100</td>
              </tr>
              <tr>
                <td>Encoding</td>
                <td>16-bit Signed Integer PCM</td>
              </tr>
              </tbody>
            </Table>
          </p>
          <p>
            For example, in order to join using SoX and <code>nc</code> try this: <br/>
            <code>rec -t s16 -r 44100 -c 1 - | nc {loc?.hostname} {loc && parseInt(loc.port) + 1}</code>
          </p>
        </Modal.Body>
      </Modal>
  );
};

export default SpeakerInstruction;
