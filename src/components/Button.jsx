import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, className = '' }) => {
    return (
        <button
            className={`custom-button ${variant} ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
