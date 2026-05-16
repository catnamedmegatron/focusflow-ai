import React from 'react';
import './InsightSection.css';

const InsightSection = ({ scrollRef }) => {
    return (
        <section className="insight-section fade-in-section" ref={scrollRef}>
            <div className="container insight-content">
                <h2 className="insight-title">Decision is the <span className="text-cyan">Bottleneck</span></h2>

                <div className="insight-graphic glow-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="pulse-circle"></div>
                </div>

                <p className="insight-description">
                    This is not a planning problem. This is a <strong>decision + execution</strong> problem.<br /><br />
                    Every time you think 'what should I do now?', you've already lost momentum.<br />
                    To-do lists don't work because they wait for you to decide what to do while you're already drained.<br />
                    Real productivity happens when the decision is made for you.
                </p>

                <div className="insight-divider"></div>
            </div>
        </section>
    );
};

export default InsightSection;
