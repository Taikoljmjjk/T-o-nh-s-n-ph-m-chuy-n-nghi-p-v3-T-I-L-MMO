import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
    return (
        <button
            {...props}
            className={`
                inline-flex items-center justify-center px-6 py-3 border border-transparent 
                text-base font-semibold rounded-lg shadow-sm text-white 
                bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200
                disabled:bg-slate-300 disabled:cursor-not-allowed transform active:scale-95
                ${className}
            `}
        >
            {children}
        </button>
    );
};