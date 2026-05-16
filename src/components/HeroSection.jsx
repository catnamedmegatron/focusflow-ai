import React from 'react';
import Button from './Button';
import './HeroSection.css';

const HeroSection = ({ scrollRef }) => {
    return (
        <section className="hero-section fade-in-section" ref={scrollRef}>
            <div className="container hero-content">
                <h1 className="hero-title">
                    Stop planning.<br />
                    <span className="text-gradient">Start executing.</span>
                </h1>
                <p className="hero-subtitle">
                    Most students don't fail because they lack knowledge.<br />
                    The gap between knowing and doing is where most students lose.
                </p>
                <div className="hero-actions">
                    <Button variant="primary" className="cta-button">See How It Works</Button>
                    <Button variant="secondary" className="video-link">Watch the video</Button>
                </div>
                <p style={{ marginTop: '30px', fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Built for students who struggle with consistency—not intelligence.
                </p>
            </div>
        </section>
    );
};

export default HeroSection;
