import React from 'react';
import Card from './Card';
import './PainSection.css';

const PainSection = ({ scrollRef }) => {
    return (
        <section className="pain-section fade-in-section" ref={scrollRef}>
            <div className="container pain-container">
                <div className="pain-text">
                    <h2 className="section-title">The Infinite Loop<br />of Inaction</h2>
                    <p className="section-subtitle">
                        Planning often feels productive. It isn't. We spend hours color-coding calendars only to feel the exact icy weight of "what now?" when the timer starts counting.
                    </p>
                </div>

                <div className="pain-cards">
                    <Card glow className="pain-card">
                        <div className="icon warning">⚠️</div>
                        <h3>The App Switcher's Trap</h3>
                        <p>Switching between Notion, Google Calendar, and To-Do lists is <em>meta-work</em>. It's not progress.</p>
                    </Card>

                    <Card glow className="pain-card">
                        <div className="icon danger">🛑</div>
                        <h3>The 2 AM Reckoning</h3>
                        <p>The sinking feeling when you realize you had a clear plan, but it's 2 AM and you haven't actually <em>done</em> any of it.</p>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default PainSection;
