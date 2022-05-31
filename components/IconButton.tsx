import { Button, ButtonProps } from 'react-bootstrap';
import IconList from '@reacticons/bootstrap-icons/lib/components/iconList.json';
import { FC } from 'react';
import Icon from '@reacticons/bootstrap-icons';

type IconButtonProps = ButtonProps & {
  name: keyof typeof IconList,
};

const IconButton: FC<IconButtonProps> = ({ name, ...props }) => (
    <Button {...props}>
      <Icon name={name}/>
    </Button>
);

export default IconButton;
