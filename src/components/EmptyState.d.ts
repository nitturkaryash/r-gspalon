import React, { ReactNode } from 'react';
interface EmptyStateProps {
    title: string;
    description: string;
    buttonText?: string;
    buttonAction?: () => void;
    icon?: ReactNode;
}
declare const EmptyState: React.FC<EmptyStateProps>;
export default EmptyState;
