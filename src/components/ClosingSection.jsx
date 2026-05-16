import React from 'react';
import Button from './Button';
import './ClosingSection.css';

const ClosingSection = ({ scrollRef }) => {
    return (
        <section className="closing-section fade-in-section" ref={scrollRef}>
            <div className="container text-center">
                <h2 className="closing-title">
                    Planning doesn't change your life.<br />
                    <span className="text-gradient">Execution does.</span>
                </h2>

                <p style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-muted)' }}>
                    The system that decides for you.
                </p>

                <p className="closing-subtitle">
                    Be among the first to experience the agentic shift. Secure your spot in the early access program today.
                </p>

                <Button variant="primary" className="cta-button">Join Early Access</Button>
            </div>

            <footer className="footer">
                <div className="container footer-content">
                    <div className="logo">FocusFlow AI</div>
                    <div className="footer-links">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <a href="#">Twitter</a>
                        <a href="#">Github</a>
                    </div>
                    <div className="copyright">© {new Date().getFullYear()} FocusFlow Inc. The Agentic Era.</div>
                </div>
            </footer>
        </section>
    );
};

export default ClosingSection;
