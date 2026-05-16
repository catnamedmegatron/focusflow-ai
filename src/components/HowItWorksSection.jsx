import React from 'react';
import Card from './Card';
import './HowItWorksSection.css';

const StepCard = ({ number, title, description }) => (
    <Card glow className="step-card">
        <div className="step-number">{number}</div>
        <h3>{title}</h3>
        <p>{description}</p>
    </Card>
);

const HowItWorksSection = ({ scrollRef }) => {
    return (
        <section className="how-it-works-section fade-in-section" ref={scrollRef}>
            <div className="container">
                <h2 className="section-title text-center">The Flow Journey</h2>

                <div className="steps-container">
                    <StepCard
                        number="01"
                        title="Intelligent Input"
                        description="Paste your syllabus or total assignment questions. Gemini Native AI instantly parses hierarchical text arrays and scopes your workload."
                    />
                    <StepCard
                        number="02"
                        title="Precision Time Pacing"
                        description="The engine mathematically divides targets into strict minute caps, ensuring you never over-spend time on one task at the expense of another."
                    />
                    <StepCard
                        number="03"
                        title="Nudged to Start"
                        description="FocusFlow contextually predicts and gets you started exactly when it's time, maintaining deep work."
                    />
                    <StepCard
                        number="04"
                        title="Organic Anchoring"
                        description="Don't break your focus at midnight. The engine mathematically bounds your daily schedule limits strictly to your organic Sleep Cycles natively."
                    />
                    <StepCard
                        number="05"
                        title="Behavioral Auto-Recalibration"
                        description="Skipped a batch today? The AI captures the miss and autonomously mathematically swells tomorrow's load limit to force deadline trajectory."
                    />
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
