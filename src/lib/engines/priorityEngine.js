// src/lib/engines/priorityEngine.js

/**
 * priorityEngine.js
 * Analyzes topics and historical sessions to assign dynamic priority scores.
 */

// Weights and baselines
const SCORING = {
  urgency: {
     d_1: 100,
     d_3: 80,
     d_7: 60,
     d_else: 30
  },
  importance: {
      exam: 100,
      assignment: 70,
      project: 50
  },
  difficulty: {
      hard: 60,
      medium: 40,
      easy: 20
  },
  behavior: {
      skip_penalty: 30, // applied per skip
      easy_reward: -10  // applied per easy completion
  }
};

/**
 * Calculates priority score for a single topic/goal intersection
 * @param {Object} topic - { id, name, difficulty, goal: { type, deadline } }
 * @param {Array} history - Array of previous tasks/sessions linked to this topic to apply behavior adjustments
 */
export const calculateTopicPriority = (topic, history = []) => {
  let score = 0;

  // 1. Urgency (Gap between deadline and today)
  if (topic.goal && topic.goal.deadline) {
      const deadlineDate = new Date(topic.goal.deadline);
      const today = new Date();
      // Reset hours to strictly compare dates
      deadlineDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      
      const diffTime = deadlineDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) score += SCORING.urgency.d_1;
      else if (diffDays <= 3) score += SCORING.urgency.d_3;
      else if (diffDays <= 7) score += SCORING.urgency.d_7;
      else score += SCORING.urgency.d_else;
  } else {
      score += SCORING.urgency.d_else; // Fallback
  }

  // 2. Importance (Goal Type)
  if (topic.goal && topic.goal.type) {
      const gType = topic.goal.type.toLowerCase();
      score += SCORING.importance[gType] || 0;
  }

  // 3. Difficulty
  if (topic.difficulty) {
      const diff = topic.difficulty.toLowerCase();
      score += SCORING.difficulty[diff] || SCORING.difficulty.medium; // default to medium
  }

  // 4. Behavior Adjustment (from past sessions)
  // For simplicity, we assume `history` contains task logs like: { status, difficulty_feedback }
  const topicHistory = history.filter(log => log.topic_id === topic.id);
  
  let skipCount = 0;
  let easyCompletionCount = 0;

  topicHistory.forEach(log => {
      if (log.status === 'skipped') skipCount++;
      if (log.status === 'completed' && log.difficulty_feedback === 'easy') easyCompletionCount++;
  });

  score += (skipCount * SCORING.behavior.skip_penalty);
  score += (easyCompletionCount * SCORING.behavior.easy_reward);

  // Prevent negative scores from breaking the ranking deeply
  return Math.max(score, 0);
};

/**
 * Evaluates an array of topics and returns them sorted by priority score
 */
export const rankTopics = (topics, history = []) => {
  const ranked = topics.map(topic => {
      const pScore = calculateTopicPriority(topic, history);
      return { ...topic, priority_score: pScore };
  });

  // Sort descending (highest score first)
  return ranked.sort((a, b) => b.priority_score - a.priority_score);
};
