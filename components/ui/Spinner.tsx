
import React from 'react';
import { Loader } from '../Icons';

export const Spinner: React.FC<{ text?: string }> = ({ text }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-2 text-cyan-400">
            <Loader className="w-8 h-8" />
            {text && <p className="text-sm font-medium">{text}</p>}
        </div>
    );
};
