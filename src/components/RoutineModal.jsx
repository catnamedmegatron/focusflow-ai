import React, { useState } from 'react';
import { API } from '../lib/api';

const RoutineModal = ({ isOpen, onClose, userId, initialRoutine, fixedBlocks = [], onComplete }) => {
  // Global Routine State
  const [wakeTime, setWakeTime] = useState(initialRoutine?.wake_time || '07:00');
  const [sleepTime, setSleepTime] = useState(initialRoutine?.sleep_time || '23:00');
  const [maxHours, setMaxHours] = useState(localStorage.getItem(`maxHours_${userId}`) || '6');
  
  // New Block Form State
  const [blockTitle, setBlockTitle] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSaveGlobalRoutine = async () => {
    setLoading(true);
    setError(null);
    try {
        await API.saveRoutine({
            user_id: userId,
            wake_time: wakeTime + (wakeTime.length === 5 ? ":00" : ""),
            sleep_time: sleepTime + (sleepTime.length === 5 ? ":00" : "")
        });
        localStorage.setItem(`maxHours_${userId}`, maxHours);
        if (onComplete) onComplete();
    } catch(err) {
        setError("Failed to update wake/sleep boundaries.");
    } finally {
        setLoading(false);
    }
  };

  const handleAddFixedBlock = async (e) => {
    e.preventDefault();
    if (!blockTitle || !blockStart || !blockEnd) return;

    setLoading(true);
    setError(null);

    try {
        await API.saveFixedBlock({
            user_id: userId,
            title: blockTitle,
            start_time: blockStart + ":00",
            end_time: blockEnd + ":00"
        });
        
        // Reset form
        setBlockTitle('');
        setBlockStart('');
        setBlockEnd('');
        
        if (onComplete) onComplete();
    } catch(err) {
        setError(err.message || "Failed to add routine block.");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteFixedBlock = async (id) => {
    setLoading(true);
    try {
        await API.deleteFixedBlock(id);
        if (onComplete) onComplete();
    } catch(err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '15px', fontFamily: 'var(--font-heading)' }}>Daily Habits</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          Define your sleep schedule and daily habits (e.g. Gym, Lectures). The AI planner will construct your tasks around these locked routines.
        </p>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

         {/* Unified Blocks List */}
        <div style={{ marginBottom: '25px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Fixed Global Defaults Block */}
                <li style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: 'rgba(182, 235, 255, 0.05)', border: '1px solid rgba(182, 235, 255, 0.2)', borderRadius: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: '600', color: 'var(--accent-cyan)', display: 'block', marginBottom: '8px' }}>Sleep (Default)</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From</span>
                                    <input 
                                        type="time" 
                                        className="modal-input" 
                                        style={{ margin: 0, padding: '4px 8px', fontSize: '13px', width: 'auto' }}
                                        value={sleepTime}
                                        onChange={e => setSleepTime(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>To</span>
                                    <input 
                                        type="time" 
                                        className="modal-input" 
                                        style={{ margin: 0, padding: '4px 8px', fontSize: '13px', width: 'auto' }}
                                        value={wakeTime}
                                        onChange={e => setWakeTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleSaveGlobalRoutine}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '4px' }}
                            disabled={loading}
                        >
                            Save
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>Daily Max Study Load</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                                type="number" 
                                min="1" max="14"
                                className="modal-input" 
                                style={{ margin: 0, padding: '4px 8px', fontSize: '13px', width: '60px', textAlign: 'center' }}
                                value={maxHours}
                                onChange={e => setMaxHours(e.target.value)}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hours/Tasks</span>
                        </div>
                    </div>
                </li>

                {/* Custom Fixed Blocks */}
                {fixedBlocks.map(block => {
                    const start = block.start_time.substring(0,5);
                    const end = block.end_time.substring(0,5);
                    return (
                        <li key={block.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: '500' }}>{block.title}</span>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From</span>
                                        <span style={{ fontSize: '13px', padding: '2px 4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px' }}>{start}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>To</span>
                                        <span style={{ fontSize: '13px', padding: '2px 4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px' }}>{end}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteFixedBlock(block.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px', padding: '5px' }}
                                disabled={loading}
                            >✕</button>
                        </li>
                    );
                })}
            </ul>
        </div>

        {/* Add New Block Form */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '15px', margin: '0 0 15px 0' }}>Add Habit</h3>
            <form onSubmit={handleAddFixedBlock}>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        className="modal-input" 
                        placeholder="e.g. Gym, Commute, Dinner" 
                        value={blockTitle}
                        onChange={e => setBlockTitle(e.target.value)}
                        required
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>From</label>
                        <input 
                            type="time" 
                            className="modal-input" 
                            value={blockStart}
                            onChange={e => setBlockStart(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>To</label>
                        <input 
                            type="time" 
                            className="modal-input" 
                            value={blockEnd}
                            onChange={e => setBlockEnd(e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                    + Add Block
                </button>
            </form>
        </div>
        
        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}>
            <button className="btn-secondary" style={{ border: 'none' }} onClick={onClose}>Close panel</button>
        </div>

      </div>
    </div>
  );
};

export default RoutineModal;
