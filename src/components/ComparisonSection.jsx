import React from 'react';
import './ComparisonSection.css';

const ComparisonSection = ({ scrollRef }) => {
    return (
        <section className="comparison-section fade-in-section" ref={scrollRef}>
            <div className="container">
                <h2 className="comparison-title">Passive vs Agentic</h2>

                <div className="comparison-table">
                    <div className="comparison-column passive">
                        <div className="column-header">
                            <span className="badge">PASSIVE TOOLS</span>
                            <h3>Notion / Calendar</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>You decide everything</p>
                        </div>
                        <ul className="comparison-list">
                            <li>Waits for you to manually calculate exact time blocks per task.</li>
                            <li>Waits for you to manually schedule tasks into kalendar boxes.</li>
                            <li>Mindlessly rolls over unfinished work into a massive backlog.</li>
                            <li>Silent when you fail to initiate a scheduled session gap.</li>
                            <li>Crashes tracking graphs at 12:00 AM regardless of your sleep cycle.</li>
                        </ul>
                    </div>

                    <div className="comparison-column agentic">
                        <div className="column-header">
                            <span className="badge agentic-badge">AGENTIC AI</span>
                            <h3>FocusFlow Native System</h3>
                            <p style={{ fontSize: '14px', color: 'var(--accent-cyan)', marginTop: '8px' }}>Mathematics run your day</p>
                        </div>
                        <ul className="comparison-list">
                            <li>Automatically caps individual task durations based on your total daily workload so you never lose track of time.</li>
                            <li>Acts without waiting. Autonomously hierarchical-unpacks subjects and schedules dynamic fractional intervals.</li>
                            <li>Self-heals skipped items, natively re-calculating batch volumes to force deadline execution trajectory limits.</li>
                            <li>Intervenes with context-aware nudges to pull you back into flow.</li>
                            <li>Organically offsets the mathematical iteration of a "Day" to match exactly when your physical body sleeps.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ComparisonSection;
