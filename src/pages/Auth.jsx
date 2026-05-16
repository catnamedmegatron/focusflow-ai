import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [animateState, setAnimateState] = useState('form-fade-in');
    const navigate = useNavigate();

    const handleToggle = () => {
        setAnimateState('form-fade-out');
        setTimeout(() => {
            setIsLogin(!isLogin);
            setError(null);
            // Reset fields
            setPassword('');
            if (!isLogin) setName('');
            setAnimateState('form-fade-in');
        }, 300);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                navigate('/dashboard');
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;

                // Insert profile
                if (data?.user) {
                    const { error: profileError } = await supabase.from('users_profile').insert({
                        id: data.user.id,
                        name: name || "User"
                    });
                    if (profileError) console.error("Profile creation error:", profileError);
                }
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Animated Background Orbs */}
            <div className="auth-bg-orb orb-1"></div>
            <div className="auth-bg-orb orb-2"></div>
            <div className="auth-bg-orb orb-3"></div>

            {/* Auth Card */}
            <div className="auth-card-glass">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link to="/" style={{ display: 'inline-block', marginBottom: '20px' }}>
                        <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            FocusFlow <span className="text-cyan">AI</span>
                        </div>
                    </Link>
                    <h2 className={`insight-title auth-form-container ${animateState}`} style={{ fontSize: '2rem' }}>
                        {isLogin ? "Welcome Back" : "Start Executing"}
                    </h2>
                    <p className={`auth-form-container ${animateState}`} style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '10px' }}>
                        {isLogin ? "Log in to your agentic dashboard." : "Create your account to regain momentum."}
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255,0,0,0.3)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className={`auth-form-container ${animateState}`}>
                    {!isLogin && (
                        <div className="auth-input-group">
                            <label className="auth-label">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                                className="auth-input"
                                placeholder="What should we call you?"
                            />
                        </div>
                    )}

                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="auth-input"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                    >
                        {loading ? "Processing..." : (isLogin ? "Login" : "Join Early Access")}
                    </button>
                </form>

                <div className={`auth-form-container ${animateState}`} style={{ textAlign: 'center', marginTop: '30px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="auth-toggle-btn"
                    >
                        {isLogin ? "Sign Up" : "Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
