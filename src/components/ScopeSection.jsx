import React from 'react';
import Card from './Card';
import './ScopeSection.css';

const ScopeSection = ({ scrollRef }) => {
    return (
        <section className="scope-section fade-in-section" ref={scrollRef}>
            <div className="container">
                <div className="scope-content">
                    <div className="scope-text">
                        <h2>Ready for every challenge.</h2>
                        <ul className="scope-list">
                            <li>Exams & mid-term prep</li>
                            <li>Assignments from draft to submission</li>
                            <li>Personal projects & non-academic targets</li>
                        </ul>
                    </div>

                    <div className="scope-visuals">
                        <div className="visual-card image-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span>Dynamic Scheduling</span>
                            <div className="pulse-circle" style={{ marginTop: '20px' }}></div>
                        </div>
                        <div className="visual-card graphic-placeholder">
                            <div className="pulse-circle"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ScopeSection;
