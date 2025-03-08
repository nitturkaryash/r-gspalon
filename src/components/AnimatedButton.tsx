import { Button, ButtonProps } from '@mui/material';
import * as React from 'react';
import * as FramerMotion from 'framer-motion';
import { styled } from '@mui/material/styles';

// Create a motion component with the Button component
const MotionButton = styled(FramerMotion.motion.button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  border: 'none',
  background: 'none',
  padding: 0,
  cursor: 'pointer',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'scaleX(0)',
    transformOrigin: 'right',
    transition: 'transform 0.3s ease',
  },
  '&:hover::after': {
    transform: 'scaleX(1)',
    transformOrigin: 'left',
  },
}));

const buttonVariants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

export interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, ...props }) => {
  return (
    <MotionButton
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      <Button {...props}>
        {children}
      </Button>
    </MotionButton>
  );
}; 