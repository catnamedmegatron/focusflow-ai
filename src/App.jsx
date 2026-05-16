import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Supabase Auth Error:", error);
        setInitError(error.message);
      }
      setSession(session);
      setLoading(false);
    }).catch(err => {
      console.error("Supabase Connection Failed:", err);
      setInitError("Network connection to database failed. Your Supabase project might be paused due to inactivity.");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-main)' }}>Loading...</div>;
  }

  if (initError) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: '#ff6b6b', padding: '20px', textAlign: 'center' }}>
         <h1 style={{ marginBottom: '15px' }}>Database Connection Error</h1>
         <p style={{ color: 'var(--text-main)', maxWidth: '500px', lineHeight: '1.6' }}>{initError}</p>
         <p style={{ color: 'var(--text-muted)', marginTop: '20px', fontSize: '14px' }}>Please log into your Supabase dashboard and wake up your project if it has been paused due to inactivity.</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session}>
              <Dashboard session={session} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
