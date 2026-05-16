import React, { useState } from 'react';
import { API } from '../lib/api';

const TopicsManagerModal = ({ isOpen, onClose, goals, topics, onUpdate }) => {
  const [loadingId, setLoadingId] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState({});

  if (!isOpen) return null;

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Delete this goal and all associated topics?")) return;
    setLoadingId(goalId);
    await API.deleteGoal(goalId);
    setLoadingId(null);
    if (onUpdate) onUpdate();
  };

  const handleDeleteTopic = async (topicId) => {
    setLoadingId(topicId);
    await API.deleteTopic(topicId);
    setLoadingId(null);
    if (onUpdate) onUpdate();
  };

  const toggleExpansion = (goalId) => {
      setExpandedGoals(prev => ({
          ...prev,
          [goalId]: !prev[goalId]
      }));
  };

  // Group topics by goal
  const groupedTopics = goals.map(goal => ({
      ...goal,
      topics: topics.filter(t => t.goal_id === goal.id)
  }));
  
  // Standalone topics
  const standaloneTopics = topics.filter(t => !t.goal_id);

  return (
    <div className="overlay">
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '15px', fontFamily: 'var(--font-heading)' }}>Manage Goals & Topics</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
          Review, organize, and prune the topics extracted by FocusFlow AI. 
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupedTopics.map(goal => {
             const isExpanded = expandedGoals[goal.id];
             return (
                 <div key={goal.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                            onClick={() => toggleExpansion(goal.id)}
                        >
                            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                {isExpanded ? '▼' : '▶'}
                            </span>
                            <h3 style={{ fontSize: '16px', color: 'var(--text-main)', margin: 0 }}>📍 {goal.title} <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>({goal.type} - Due: {goal.deadline})</span></h3>
                        </div>
                        <button 
                           onClick={() => handleDeleteGoal(goal.id)}
                           style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px', marginLeft: '15px' }}
                           disabled={loadingId === goal.id}
                        >
                           Delete Goal
                        </button>
                    </div>
                    
                    {isExpanded && goal.topics.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>No topics under this goal.</span>}
                    
                    {isExpanded && goal.topics.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {goal.topics.map(topic => (
                                <li key={topic.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '14px' }}>
                                    <span>
                                      {topic.name} 
                                      <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginLeft: '8px' }}>• {topic.difficulty}</span>
                                    </span>
                                    <button 
                                       onClick={() => handleDeleteTopic(topic.id)}
                                       style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                                       disabled={loadingId === topic.id}
                                    >
                                       ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                 </div>
             );
          })}

          {standaloneTopics.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-main)', margin: '0 0 10px 0' }}>Standalone Topics</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {standaloneTopics.map(topic => (
                          <li key={topic.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '14px' }}>
                              <span>{topic.name} <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginLeft: '8px' }}>• {topic.difficulty}</span></span>
                              <button 
                                 onClick={() => handleDeleteTopic(topic.id)}
                                 style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                                 disabled={loadingId === topic.id}
                              >
                                 ✕
                              </button>
                          </li>
                      ))}
                  </ul>
              </div>
          )}

          {goals.length === 0 && standaloneTopics.length === 0 && (
             <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>No goals or topics found. Try adding a goal or uploading a syllabus.</p>
          )}
        </div>

        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={onClose}>Close panel</button>
        </div>
      </div>
    </div>
  );
};

export default TopicsManagerModal;
