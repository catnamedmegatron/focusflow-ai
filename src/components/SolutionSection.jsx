import React from 'react';
import Card from './Card';
import './SolutionSection.css';

const SolutionSection = ({ scrollRef }) => {
    return (
        <section className="solution-section fade-in-section" ref={scrollRef}>
            <div className="container">
                <h2 className="solution-title">Not an App. <span className="text-cyan">An Agent.</span></h2>

                <div className="solution-grid">
                    <Card glow className="solution-card">
                        <div className="icon">🧠</div>
                        <h3>Intelligent Scoping</h3>
                        <p>Upload a 40-page brief or full syllabus. FocusFlow parses hierarchical arrays and autonomously breaks it into manageable chunks based on your deadline limits.</p>
                    </Card>

                    <Card glow className="solution-card">
                        <div className="icon">⚡</div>
                        <h3>Proactive Nudges</h3>
                        <p>It doesn't just wait. It detects when you're drifting and calls you back to your workspace with context-aware micro-interventions natively triggered by gaps.</p>
                    </Card>

                    <Card glow className="solution-card">
                        <div className="icon">⏳</div>
                        <h3>Time-Blindness Defense</h3>
                        <p>Stop sinking hours into one assignment. FocusFlow natively calculates the exact minute-limit you should spend per task relative to your remaining workload, preventing you from neglecting other priorities.</p>
                    </Card>

                    <Card glow className="solution-card">
                        <div className="icon">🌙</div>
                        <h3>Circadian Dual-Axis Scope</h3>
                        <p>The 30-Day graphical progress system binds mathematically to your exact sleep time natively, rendering overlapping difficulty heatmaps without midnight disruption.</p>
                    </Card>

                    <Card glow className="solution-card">
                        <div className="icon">🔄</div>
                        <h3>Self-Healing Ceilings</h3>
                        <p>Missed a session? FocusFlow instantly inflates your task volume the next day. If constraints drop beneath a 20-minute floor limit, the UI triggers aggressive visual overload warnings.</p>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default SolutionSection;
