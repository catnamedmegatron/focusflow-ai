// src/lib/engines/planningEngine.js
import { generateFreeSlots, filterPastSlots } from './timeSlotEngine';
import { calculateTopicPriority, rankTopics } from './priorityEngine';

/**
 * Converts minutes (from midnight) back to Postgres TIMESTAMP WITH TIME ZONE
 */
const dateFromMins = (mins) => {
  const d = new Date(); // Today
  d.setHours(Math.floor(mins / 60) % 24, mins % 60, 0, 0);
  
  // Handle overnight wrapping
  if (d.getHours() < new Date().getHours() && mins > d.getHours() * 60) {
      d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
};

/**
 * The core Planning Engine loop
 * Analyzes the user's workload, generates available dynamic blocks,
 * and inserts tasks optimized by the Priority Engine into the schedule.
 */
export const generateDailyPlan = (userId, userData) => {
  const { routine, fixedBlocks, topics, goals, sessions, activeTasks } = userData;

  if (!topics || topics.length === 0) return []; // Nothing to plan

  // Filter out topics that are already scheduled today or active so they aren't duplicated
  const activeTopicIds = new Set((activeTasks || []).map(t => t.topic_id));
  const unscheduledTopics = topics.filter(t => !activeTopicIds.has(t.id));

  // 1. Join topics with their parent goals for accurate scoring
  const enrichedTopics = unscheduledTopics.map(t => ({
      ...t,
      goal: goals.find(g => g.id === t.goal_id) || null
  }));

  // 2. Priority Engine: Rank by urgency + difficulty + behavior
  const rankedTopics = rankTopics(enrichedTopics, sessions);

  // Treat existing active tasks as fixed blocks to avoid overlaps
  const existingTaskBlocks = (activeTasks || []).map(t => {
      const s = new Date(t.scheduled_start);
      const e = new Date(t.scheduled_end);
      return {
          start_time: `${String(s.getHours()).padStart(2,'0')}:${String(s.getMinutes()).padStart(2,'0')}`,
          end_time: `${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`
      };
  });

  // 4. Determine Actual Completed Topics
  const completedTopicIds = new Set((sessions || []).filter(s => s.completed).map(s => s.topic_id));
  const trulyUncompletedTopics = enrichedTopics.filter(t => !completedTopicIds.has(t.id));

  // 5. Calculate Scoped Target Load Per Goal
  let dailyTargetTopics = [];
  goals.forEach(goal => {
      const gTopics = trulyUncompletedTopics.filter(t => t.goal_id === goal.id);
      if (gTopics.length === 0) return;
      
      const msLeft = new Date(goal.deadline) - new Date();
      const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      
      const targetCount = Math.ceil(gTopics.length / daysLeft);
      
      // Rank specifically within this goal natively
      const rankedGoalTopics = rankTopics(gTopics, sessions);
      dailyTargetTopics.push(...rankedGoalTopics.slice(0, targetCount));
  });

  // Rank the final aggregated pool of targets globally across all goals
  const finalRankedTargets = rankTopics(dailyTargetTopics, sessions);

  // 6. Time Slicer Engine
  const combinedFixedBlocks = [...(fixedBlocks || []), ...existingTaskBlocks];
  let allSlots = generateFreeSlots(routine, combinedFixedBlocks);
  let liveSlots = filterPastSlots(allSlots, routine);
  const totalFreeMinsToday = liveSlots.reduce((acc, s) => acc + s.duration, 0);

  const userMaxMins = parseInt(localStorage.getItem(`maxHours_${userId}`) || '6', 10) * 60;
  
  // Calculate how much active block time has naturally already been taken up today
  let scheduledMinsToday = 0;
  (activeTasks || []).forEach(t => {
      const s = new Date(t.scheduled_start);
      const e = new Date(t.scheduled_end);
      scheduledMinsToday += (e - s) / 60000;
  });

  const completedMinsToday = (sessions || []).filter(s => {
      if (!s.completed) return false;
      const hoursSinceCompletion = (new Date() - new Date(s.timestamp)) / 3600000;
      return hoursSinceCompletion <= 18; 
  }).length * 60; // Base historical approximation

  let totalMinsAccountedFor = scheduledMinsToday + completedMinsToday;
  
  // The actual absolute available ceiling time we have mathematically left to assign
  const availableMathLimit = userMaxMins - totalMinsAccountedFor;
  
  // End of Day Check: Clamp available limit natively so it doesn't try to crunch 5 hours into 1 remaining hour
  const actualAllocationMins = Math.min(availableMathLimit, totalFreeMinsToday);

  const generatedTasks = [];
  let warningMessage = null;

  if (finalRankedTargets.length > 0 && actualAllocationMins > 0) {
      // Priority-based Time Fractional Slicing
      const baselinePrioritySum = finalRankedTargets.reduce((acc, t) => acc + t.priority_score, 0);
      
      for (const topic of finalRankedTargets) {
          // Weight the base time against the core target topic's calculated AI score (higher score = larger ratio of the pie)
          const fraction = topic.priority_score / baselinePrioritySum;
          let calculatedTaskDuration = Math.round(actualAllocationMins * fraction);
          
          if (calculatedTaskDuration < 20) {
             calculatedTaskDuration = 20; // 20 min lowest barrier of focus execution
             if (!warningMessage) warningMessage = "Aggressive Time Slicing Active: Your generated targets have dropped below optimal threshold lengths. We highly advise extending your max load bounds or reconsidering schedule constraints.";
          }

          const slotIndex = liveSlots.findIndex(s => s.duration >= calculatedTaskDuration);
          
          if (slotIndex !== -1) {
              const targetSlot = liveSlots[slotIndex];
              
              const taskObj = {
                  user_id: userId,
                  topic_id: topic.id,
                  title: topic.name,
                  scheduled_start: dateFromMins(targetSlot.startMins),
                  scheduled_end: dateFromMins(targetSlot.startMins + calculatedTaskDuration),
                  status: 'pending',
                  priority_score: topic.priority_score
              };
              
              generatedTasks.push(taskObj);

              const remainingDuration = targetSlot.duration - calculatedTaskDuration;
              if (remainingDuration >= 5) {
                  liveSlots[slotIndex] = {
                      startMins: targetSlot.startMins + calculatedTaskDuration,
                      endMins: targetSlot.endMins,
                      duration: remainingDuration
                  };
              } else {
                  liveSlots.splice(slotIndex, 1);
              }
          }
      }
  }

  // Support legacy array return structure or the new dynamic object format elegantly
  return { tasks: generatedTasks, warning: warningMessage };
};
