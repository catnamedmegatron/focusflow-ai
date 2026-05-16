import React from 'react';
import './Card.css';

const Card = ({ children, className = '', glow = false }) => {
    return (
        <div className={`custom-card ${glow ? 'glow-on-hover' : ''} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
