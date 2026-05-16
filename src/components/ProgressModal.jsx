import React, { useMemo } from 'react';

const ProgressModal = ({ isOpen, onClose, sessions, routine }) => {
  if (!isOpen) return null;

  // Configuration for boundary math
  const getWakeMins = () => {
    if (!routine || !routine.wake_time) return 7 * 60; // default 7 AM
    const [h, m] = routine.wake_time.split(':').map(Number);
    return h * 60 + m;
  };

  const wakeMins = getWakeMins();

  /**
   * Complex Math Parsing:
   * Maps every raw timestamp into a "Logical Date" key
   * e.g., A session at 1:30 AM physically exists on "Tuesday",
   * but if wakeTime is 7:00 AM, it is mathematically bucketed into "Monday".
   */
  const processData = useMemo(() => {
    const buckets = {};
    const physicalNow = new Date();
    const currentMins = physicalNow.getHours() * 60 + physicalNow.getMinutes();
    
    // Natively adjust the right-most "Today" anchor if we are physically sitting in the overnight rollover gap
    if (currentMins < wakeMins) {
        physicalNow.setDate(physicalNow.getDate() - 1);
    }

    // Pre-fill the last 30 days to ensure continuous charts even with zero data
    for (let i = 29; i >= 0; i--) {
        const d = new Date(physicalNow);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString();
        buckets[key] = { count: 0, ms: 0, date: d, label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }) };
    }

    if (!sessions) return Object.values(buckets);

    sessions.forEach(s => {
        if (!s.completed) return; // Only log successful progress
        const sDate = new Date(s.timestamp);
        const minsFromMidnight = sDate.getHours() * 60 + sDate.getMinutes();
        
        let logicalDate = new Date(sDate);
        if (minsFromMidnight < wakeMins) {
            // It's technically part of yesterday's waking cycle! Roll it back mathematically.
            logicalDate.setDate(logicalDate.getDate() - 1);
        }

        const lKey = logicalDate.toLocaleDateString();
        // If it falls within our tracked recent bucket
        if (buckets[lKey]) {
            buckets[lKey].count += 1;
            // Native block approximations since raw DB timestamp diffs require end-logs. Assume 1 hour default baseline if duration unrecorded.
            buckets[lKey].ms += 60 * 60000; 
        }
    });

    return Object.values(buckets);
  }, [sessions, routine]);

  // Determine scale maximums for the dual-axis chart organically based on the user's highest peak day
  const maxTasks = Math.max(...processData.map(d => d.count), 1);
  const maxHours = Math.max(...processData.map(d => d.ms / 3600000), 1);

  // Overall analytics
  let totalCompletions = 0;
  let totalSkips = 0;
  let difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };

  (sessions || []).forEach(s => {
     if (s.completed) {
         totalCompletions++;
         if (s.difficulty_feedback) {
             difficultyBreakdown[s.difficulty_feedback] = (difficultyBreakdown[s.difficulty_feedback] || 0) + 1;
         }
     } else {
         totalSkips++;
     }
  });

  const completionRate = totalCompletions + totalSkips > 0 
    ? Math.round((totalCompletions / (totalCompletions + totalSkips)) * 100) 
    : 0;

  return (
    <div className="overlay">
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>Analytics Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '14px' }}>
          Your history is dynamically corrected to your specific circadian bounds. Overnight sessions are beautifully attributed to their rightful waking day.
        </p>

        {/* Global Stats Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Focus Consistency</div>
               <div style={{ fontSize: '36px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: '10px 0' }}>
                   {completionRate}%
               </div>
               <div style={{ fontSize: '12px', color: completionRate >= 80 ? 'var(--accent-cyan)' : '#ff6b6b' }}>
                   {completionRate >= 80 ? 'Optimal Performance' : 'Recalibration Recommended'}
               </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Executions</div>
               <div style={{ fontSize: '36px', color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', margin: '10px 0' }}>
                   {totalCompletions}
               </div>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                   Tasks cleared globally
               </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>Difficulty Heatmap</div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '5px' }}>
                   <div style={{ width: '50px', color: 'var(--text-muted)' }}>Hard</div>
                   <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${totalCompletions ? (difficultyBreakdown.hard/totalCompletions)*100 : 0}%`, background: '#ff6b6b', height: '100%' }}></div>
                   </div>
                   <div style={{ width: '20px', textAlign: 'right' }}>{difficultyBreakdown.hard}</div>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '5px' }}>
                   <div style={{ width: '50px', color: 'var(--text-muted)' }}>Medium</div>
                   <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${totalCompletions ? (difficultyBreakdown.medium/totalCompletions)*100 : 0}%`, background: '#FFD700', height: '100%' }}></div>
                   </div>
                   <div style={{ width: '20px', textAlign: 'right' }}>{difficultyBreakdown.medium}</div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                   <div style={{ width: '50px', color: 'var(--text-muted)' }}>Easy</div>
                   <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${totalCompletions ? (difficultyBreakdown.easy/totalCompletions)*100 : 0}%`, background: 'var(--accent-cyan)', height: '100%' }}></div>
                   </div>
                   <div style={{ width: '20px', textAlign: 'right' }}>{difficultyBreakdown.easy}</div>
               </div>
            </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text-main)', margin: 0 }}>30-Day Activity Flow</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'var(--accent-cyan)', borderRadius: '3px' }}></div> Topics</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.2)' }}></div> Hours Spent</span>
            </div>
        </div>

        {/* Dynamic Graph Container */}
        <div style={{ 
            height: '250px', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '12px', 
            padding: '20px 20px 0 20px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px', // Tighter crunch
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            overflowX: 'auto',
            position: 'relative'
        }}>
            {processData.map((day, idx) => {
                const hours = day.ms / 3600000;
                
                // Integrated math scale
                const taskHeight = (day.count / maxTasks) * 100;
                const hoursHeight = (hours / maxHours) * 100;

                return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', group: 'trigger', position: 'relative', height: '100%' }}>
                        
                        {/* Hover Tooltip Overlay natively managed */}
                        <div className="bar-tooltip" style={{
                            position: 'absolute',
                            bottom: '100%',
                            background: '#1a1a2e',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            pointerEvents: 'none',
                            opacity: 0,
                            transition: 'all 0.2s',
                            zIndex: 10,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            transform: 'translateY(10px)'
                        }}>
                           <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{day.label}</div>
                           <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{day.count} Topics</div>
                           <div style={{ fontSize: '12px', color: 'var(--accent-purple)' }}>{hours.toFixed(1)} Hours</div>
                        </div>

                        {/* Bar Rendering Block */}
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', position: 'relative', padding: '0 10%' }}>
                            
                            {/* Hours Shadow Background Metric */}
                            <div style={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                left: 0, 
                                width: '100%', 
                                height: `${hoursHeight}%`, 
                                background: 'rgba(255,255,255,0.05)', 
                                borderTop: '2px solid rgba(255,255,255,0.2)',
                                borderTopLeftRadius: '4px',
                                borderTopRightRadius: '4px',
                                transition: 'height 1s ease-out'
                            }}></div>
                            
                            {/* Topics Vibrant Foreground Metric */}
                            <div style={{ 
                                position: 'relative',
                                width: '100%', 
                                height: `${taskHeight}%`, 
                                background: day.count > 0 ? 'linear-gradient(180deg, var(--accent-cyan) 0%, rgba(20,241,149,0.2) 100%)' : 'transparent',
                                borderTopLeftRadius: '4px',
                                borderTopRightRadius: '4px',
                                transition: 'height 1s ease-out',
                                boxShadow: day.count > 0 ? '0 0 15px rgba(20,241,149,0.2)' : 'none'
                             }}></div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', color: 'var(--text-muted)', fontSize: '11px' }}>
           <span>{processData[0].label}</span>
           <span>Today</span>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose}>Return to Command Center</button>
        </div>
        
        {/* Ad-hoc Tooltip style injection for the hover capability */}
        <style dangerouslySetInnerHTML={{__html: `
            div[style*="group: 'trigger'"]:hover .bar-tooltip {
                opacity: 1 !important;
                transform: translateY(-10px) !important;
            }
        `}} />
      </div>
    </div>
  );
};

export default ProgressModal;
