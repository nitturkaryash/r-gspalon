import { ButtonProps } from '@mui/material';
import * as React from 'react';
export interface AnimatedButtonProps extends ButtonProps {
    children: React.ReactNode;
}
export declare const AnimatedButton: React.FC<AnimatedButtonProps>;
