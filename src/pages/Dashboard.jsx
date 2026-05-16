import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { API } from '../lib/api';
import { generateDailyPlan } from '../lib/engines/planningEngine';
import { parseSyllabusWithAI } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';
import RoutineModal from '../components/RoutineModal';
import TopicsManagerModal from '../components/TopicsManagerModal';
import ProgressModal from '../components/ProgressModal';
import './Dashboard.css';

const Dashboard = ({ session }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modals / Overlays
  const [activeSessionTask, setActiveSessionTask] = useState(null);
  const [feedbackTask, setFeedbackTask] = useState(null);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showTopicsManagerModal, setShowTopicsManagerModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  const [engineError, setEngineError] = useState(null);
  
  // Quick Goal Forms
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState('assignment');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newSyllabusText, setNewSyllabusText] = useState('');
  const [newAssignmentQuestions, setNewAssignmentQuestions] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  
  const navigate = useNavigate();

  const fetchAllData = async (uid) => {
    setLoading(true);
    try {
      // Step 1: Auto-prune any tasks assigned to past slots before fetching to keep schedule completely clean and live
      await API.pruneExpiredTasks(uid);

      const data = await API.getUserData(uid);
      setUserData(data);
      setTasks(data.activeTasks || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchAllData(user.id);
      }
    };
    if (session) init();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const triggerError = (msg) => {
    setEngineError(msg);
    setTimeout(() => setEngineError(null), 4500);
  };

  const executeEngine = async () => {
    if (!userData || !user) return;
    setIsGenerating(true);
    setEngineError(null);
    
    try {
      // 1. Run the AI Planning Engine
      const engineResult = generateDailyPlan(user.id, userData);
      
      // Destructure resiliently in case it returns an array (old behavior) or object (new dynamic behavior)
      const newPlanTasks = Array.isArray(engineResult) ? engineResult : engineResult.tasks || [];
      const engineWarning = engineResult.warning || null;
      
      if (engineWarning) {
          triggerError(`Warning: ${engineWarning}`);
      }
      
      if (newPlanTasks.length > 0) {
        // 2. Save new tasks to DB
        const { data } = await API.saveTasks(newPlanTasks);
        if (data) {
          setTasks(prev => [...prev, ...data]);
          // 3. Critically refresh entire state to ensure the engine detects these new active tasks
          await fetchAllData(user.id);
        }
      } else if (!engineWarning) {
        triggerError("Zero tasks generated. Ensure you have uncompleted 'Topics' easily available, or adjust Max Load!");
      }
    } catch(err) {
      console.error("Planning engine failed:", err);
      triggerError("Core Engine Exception: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const startSession = async (task) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'in_progress' } : t));
    setActiveSessionTask(task);
    // Write to DB
    await API.executeTask(task.id, 'in_progress');
  };

  const endSession = () => {
    setFeedbackTask(activeSessionTask);
    setActiveSessionTask(null);
  };

  const submitFeedback = async (completed) => {
    const finalStatus = completed ? 'completed' : 'skipped';
    
    // Optimistic update
    setTasks(tasks.filter(t => t.id !== feedbackTask.id));

    // 1. Update Task status
    await API.executeTask(feedbackTask.id, finalStatus);
    
    // 2. Log Session for Adaptation Engine
    await API.logSession({
      user_id: user.id,
      task_id: feedbackTask.id,
      completed: completed,
      difficulty_feedback: difficulty || 'medium'
    });

    setFeedbackTask(null);
    setDifficulty('');
    
    // Re-fetch data behind the scenes to update total tracking
    fetchAllData(user.id);
  };

  const removeTaskCompletely = async (id) => {
    // Manually delete a task (e.g., duplicated or unwanted)
    setTasks(tasks.filter(t => t.id !== id));
    await API.deleteTask(id);
  };

  const clearLiveSchedule = async () => {
    if (!window.confirm("Are you sure you want to wipe your current pending schedule?")) return;
    setTasks([]);
    await API.clearPendingTasks(user.id);
    
    // Critically force a state recalculation so the AI engine memory is purged
    await fetchAllData(user.id);
  };

  const skipTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    await API.executeTask(id, 'skipped');
    
    await API.logSession({
      user_id: user.id,
      task_id: id,
      completed: false,
      difficulty_feedback: null
    });
  };

  const addNewGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalDeadline || !user) return;
    
    setIsSavingGoal(true);
    setEngineError(null);

    try {
      const gData = {
        user_id: user.id,
        title: newGoalTitle,
        type: newGoalType,
        deadline: newGoalDeadline
      };
      // 1. Insert Base Goal
      const { data: savedGoals, error: saveErr } = await API.saveGoal(gData);
      
      if (saveErr) throw new Error(saveErr.message);
      
      const newGoalId = savedGoals && savedGoals.length > 0 ? savedGoals[0].id : null;

      // 2a. Conditionally Extract & Map Topics if it's an Exam and Text is provided
      if (newGoalType === 'exam' && newSyllabusText.trim() && newGoalId) {
          const extractedTopics = await parseSyllabusWithAI(newSyllabusText);
          
          const formattedTopics = extractedTopics.map(t => ({
              user_id: user.id,
              goal_id: newGoalId, 
              name: t.name,
              difficulty: t.difficulty,
              estimated_hours: t.estimated_hours || 1
          }));

          for (const topic of formattedTopics) {
              await API.saveTopic(topic);
          }
      }

      // 2b. Insert unbatched question nodes for Assignments
      if (newGoalType === 'assignment' && newAssignmentQuestions && parseInt(newAssignmentQuestions) > 0 && newGoalId) {
          const totalQ = parseInt(newAssignmentQuestions);
          const formattedTopics = [];
          
          for (let q = 1; q <= totalQ; q++) {
              formattedTopics.push({
                  user_id: user.id,
                  goal_id: newGoalId,
                  name: `Question ${q}`,
                  difficulty: 'medium',
                  estimated_hours: 1 // Baseline weight
              });
          }
          
          for (const topic of formattedTopics) {
              await API.saveTopic(topic);
          }
      }
      
      setNewGoalTitle('');
      setNewSyllabusText('');
      setNewAssignmentQuestions('');
      setShowAddGoalModal(false);
      fetchAllData(user.id);

    } catch (err) {
      console.error(err);
      triggerError("Goal Creation Failed: " + (err.message || 'Unknown syntax error during AI processing'));
    } finally {
      setIsSavingGoal(false);
    }
  };

  if (loading && !userData) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-main)'}}>Initializing Agentic Core...</div>;
  }

  // Formatting helpers
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const sortedPending = [...pendingTasks].sort((a,b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
  const nextTask = sortedPending.length > 0 ? sortedPending[0] : null;

  // Stats
  const completedToday = userData?.sessions?.filter(s => {
    const d = new Date(s.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString() && s.completed;
  }).length || 0;

  const totalTasksAssigned = completedToday + pendingTasks.length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">FocusFlow <span className="text-cyan">AI</span></div>
        <nav className="sidebar-nav">
          <div className="sidebar-item active">
            <span>⊞</span> Dashboard
          </div>
          <div className="sidebar-item" onClick={() => setShowAddGoalModal(true)}>
            <span>🎯</span> Add Goal
          </div>
          <div className="sidebar-item" onClick={() => setShowTopicsManagerModal(true)}>
            <span>📂</span> Manage Topics
          </div>
          <div className="sidebar-item" onClick={() => setShowRoutineModal(true)}>
            <span>⏰</span> Daily Routine
          </div>
          <div className="sidebar-item" style={{ marginTop: 'auto' }} onClick={() => setShowProgressModal(true)}>
            <span>📊</span> Progress
          </div>
          <div className="sidebar-item" onClick={handleLogout} style={{ color: '#ff6b6b' }}>
            <span>🚪</span> Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)' }}>
              Good morning{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}.
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>The system is ready. Here is your optimal path for today.</p>
          </div>
          <button className={`generate-btn ${isGenerating ? 'spinning' : ''}`} onClick={executeEngine}>
            <span className="icon">🔄</span> {isGenerating ? 'Recalibrating...' : 'Generate Today\'s Plan'}
          </button>
        </div>
        
        {engineError && (
          <div style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-color)',
            border: '1px solid #ff6b6b',
            color: '#ff6b6b',
            padding: '15px 30px',
            borderRadius: '12px',
            fontSize: '14px',
            zIndex: 9999,
            boxShadow: '0 8px 30px rgba(255,107,107,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideDownFade 4.5s ease-in-out forwards'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{engineError}</span>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Priority Action Area */}
          <div>
            {nextTask ? (
              <div className="next-action-card">
                <div className="card-label">
                  <div className="pulsing-dot"></div>
                  Your Next Action
                </div>
                <h2 className="action-title">{nextTask.title}</h2>
                <div className="action-meta">
                  <span>🕒 {new Date(nextTask.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(nextTask.scheduled_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>• AI Score: {Math.round(nextTask.priority_score)}</span>
                </div>
                <div className="action-buttons">
                  <button className="btn-primary" onClick={() => startSession(nextTask)}>
                    {nextTask.status === 'in_progress' ? 'Resume Session' : 'Start Session'}
                  </button>
                  <button className="btn-secondary" onClick={() => skipTask(nextTask.id)}>Skip</button>
                </div>
              </div>
            ) : (
              <div className="next-action-card" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <h2 className="action-title" style={{ color: 'var(--accent-cyan)' }}>Day Complete</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No pending tasks in queue.</p>
                <div style={{ display:'flex', gap:'10px'}}>
                    <button className="btn-primary" onClick={() => setShowAddGoalModal(true)}>Add New Goal</button>
                    <button className="btn-secondary" onClick={executeEngine}>Run AI Engine</button>
                </div>
              </div>
            )}
          </div>

          {/* Progress Snapshot */}
          <div className="snapshot-card">
            <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Progress Snapshot</h3>
            
            <div className="snapshot-stat">
              <div>
                <div className="stat-label">Tasks Completed Today</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${totalTasksAssigned > 0 ? (completedToday / totalTasksAssigned) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="stat-value">{completedToday}/{totalTasksAssigned}</div>
            </div>

            <div className="snapshot-stat">
              <div className="stat-label">Total Assigned Goals</div>
              <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{userData?.goals?.length || 0}</div>
            </div>

            <div className="snapshot-stat">
              <div className="stat-label">AI Analyzed Topics</div>
              <div className="stat-value" style={{ color: '#FFD700' }}>{userData?.topics?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Enhanced Task List */}
        <section>
          <div className="task-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Live Schedule</h2>
            {sortedPending.length > 0 && (
              <button 
                onClick={clearLiveSchedule}
                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                 <span>✕</span> Clear Schedule
              </button>
            )}
          </div>
          
          <div>
            {sortedPending.length === 0 && <p style={{color: 'var(--text-muted)'}}>Nothing scheduled right now. Hit Generate Plan or process a Syllabus.</p>}
            
            {sortedPending.map(task => (
              <div key={task.id} className={`task-item ${task.id === nextTask?.id ? 'active-task' : ''}`}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>
                    <span className="task-title-text">{task.title}</span>
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
                    <span>{new Date(task.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(task.scheduled_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span>AI Priority: {Math.round(task.priority_score)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {task.status === 'pending' && task.id !== nextTask?.id && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px' }}>In Queue</span>
                  )}
                  <button 
                    onClick={() => removeTaskCompletely(task.id)}
                    style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', color: '#ff6b6b', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}
                    title="Remove task permanently"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      <RoutineModal 
        isOpen={showRoutineModal} 
        onClose={() => setShowRoutineModal(false)}
        userId={user?.id}
        initialRoutine={userData?.routine}
        fixedBlocks={userData?.fixedBlocks || []}
        onComplete={() => fetchAllData(user.id)}
      />

      <TopicsManagerModal 
        isOpen={showTopicsManagerModal}
        onClose={() => setShowTopicsManagerModal(false)}
        goals={userData?.goals || []}
        topics={userData?.topics || []}
        onUpdate={() => fetchAllData(user.id)}
      />

      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        sessions={userData?.sessions || []}
        routine={userData?.routine}
      />

      {/* Session Focus Overlay */}
      {activeSessionTask && (
        <div className="overlay">
          <div className="session-modal">
            <div className="card-label" style={{ justifyContent: 'center' }}>
              <div className="pulsing-dot"></div> AI Engine Monitoring
            </div>
            <h2 style={{ fontSize: '2rem', marginTop: '10px' }}>{activeSessionTask.title}</h2>
            <div className="timer-display">Focus Mode</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Stay focused. Complete the objective before the scheduled end time.</div>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setActiveSessionTask(null)}>Minimize</button>
              <button className="btn-primary" onClick={endSession}>Complete Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Session Feedback Modal */}
      {feedbackTask && (
        <div className="overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>Session Review</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '25px' }}>
              Did you complete the objectives for <strong>{feedbackTask.title}</strong>?
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Difficulty Level:</label>
              <div className="feedback-options">
                <button type="button" className={`feedback-btn ${difficulty === 'easy' ? 'selected' : ''}`} onClick={() => setDifficulty('easy')}>Easy</button>
                <button type="button" className={`feedback-btn ${difficulty === 'medium' ? 'selected' : ''}`} onClick={() => setDifficulty('medium')}>Medium</button>
                <button type="button" className={`feedback-btn ${difficulty === 'hard' ? 'selected' : ''}`} onClick={() => setDifficulty('hard')}>Hard</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-secondary" style={{ flex: 1, color: '#ff6b6b' }} onClick={() => submitFeedback(false)}>No, Skipped</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => submitFeedback(true)}>Yes, Completed</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Quick Goal Input</h2>
            <form onSubmit={addNewGoal}>
              <div style={{marginBottom: '15px'}}>
                  <label style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Goal Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    className="modal-input" 
                    placeholder="e.g. Pass Data Structures Exam"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    required
                  />
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                  <div style={{flex: 1}}>
                      <label style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Type</label>
                      <select className="modal-input" value={newGoalType} onChange={(e) => setNewGoalType(e.target.value)}>
                          <option value="exam">Exam</option>
                          <option value="assignment">Assignment</option>
                          <option value="project">Project</option>
                      </select>
                  </div>
                  <div style={{flex: 1}}>
                      <label style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Deadline</label>
                      <input 
                        type="date" 
                        className="modal-input" 
                        value={newGoalDeadline}
                        onChange={(e) => setNewGoalDeadline(e.target.value)}
                        required
                      />
                  </div>
              </div>

              {newGoalType === 'exam' && (
                <div style={{marginBottom: '25px'}}>
                   <label style={{ fontSize: '14px', color: 'var(--accent-cyan)', display: 'block', marginBottom: '8px' }}>Syllabus Content (Optional)</label>
                   <textarea 
                      className="modal-input"
                      rows="5" 
                      placeholder="Paste topics or syllabus here. AI will instantly map sub-topics connected to this exam."
                      value={newSyllabusText}
                      onChange={(e) => setNewSyllabusText(e.target.value)}
                      style={{ resize: 'vertical', minHeight: '100px', fontSize: '13px' }}
                    ></textarea>
                </div>
              )}

              {newGoalType === 'assignment' && (
                <div style={{marginBottom: '25px'}}>
                   <label style={{ fontSize: '14px', color: 'var(--accent-cyan)', display: 'block', marginBottom: '8px' }}>Total Questions (Optional)</label>
                   <input 
                      type="number"
                      min="1"
                      className="modal-input" 
                      placeholder="e.g. 14"
                      value={newAssignmentQuestions}
                      onChange={(e) => setNewAssignmentQuestions(e.target.value)}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                        We will evenly slice your workload day-by-day leading up to the deadline.
                    </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddGoalModal(false)} disabled={isSavingGoal}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSavingGoal}>
                  {isSavingGoal ? (
                    <span><span className="icon" style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>↻</span> Working...</span>
                  ) : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
