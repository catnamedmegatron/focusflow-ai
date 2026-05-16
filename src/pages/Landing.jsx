import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import PainSection from '../components/PainSection';
import InsightSection from '../components/InsightSection';
import SolutionSection from '../components/SolutionSection';
import ComparisonSection from '../components/ComparisonSection';
import HowItWorksSection from '../components/HowItWorksSection';
import ScopeSection from '../components/ScopeSection';
import ClosingSection from '../components/ClosingSection';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

import '../App.css';

function Landing() {
    const { addToRefs } = useScrollAnimation();

    useEffect(() => {
        // Force a tiny scroll to trigger observer on load for elements already in view
        window.dispatchEvent(new Event('scroll'));
    }, []);

    return (
        <div className="app-container">
            {/* Navigation */}
            <nav className="navbar">
                <div className="container nav-content">
                    <div className="logo">FocusFlow <span className="text-cyan">AI</span></div>
                    <div className="nav-links">
                        <a href="#how">How it Works</a>
                        <a href="#comparison">Why Us</a>
                    </div>
                    <div className="nav-actions" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <Link to="/auth" style={{ color: 'var(--text-main)', fontWeight: '500' }}>Login</Link>
                        <Link to="/auth"><button className="nav-cta">Sign Up</button></Link>
                    </div>
                </div>
            </nav>

            {/* Main Content Sections */}
            <main>
                <HeroSection scrollRef={addToRefs} />
                <PainSection scrollRef={addToRefs} />
                <InsightSection scrollRef={addToRefs} />
                <SolutionSection scrollRef={addToRefs} />
                <div id="comparison">
                    <ComparisonSection scrollRef={addToRefs} />
                </div>
                <div id="how">
                    <HowItWorksSection scrollRef={addToRefs} />
                </div>
                <ScopeSection scrollRef={addToRefs} />
                <ClosingSection scrollRef={addToRefs} />
            </main>
        </div>
    );
}

export default Landing;
