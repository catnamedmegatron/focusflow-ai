// src/lib/api.js
import { supabase } from './supabase';

export const API = {
  async getUserData(userId) {
    if (!userId) throw new Error("User ID required");

    // Fetch in parallel
    const [
      routineRes,
      fixedBlocksRes,
      goalsRes,
      topicsRes,
      sessionsRes,
      tasksRes
    ] = await Promise.all([
      supabase.from('routine').select('*').eq('user_id', userId).single(),
      supabase.from('fixed_blocks').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('topics').select('*').eq('user_id', userId),
      supabase.from('sessions').select('*').eq('user_id', userId),
      // Only fetch pending/in-progress tasks for today's active schedule that are not purely in the past
      supabase.from('tasks')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress'])
        .gte('scheduled_end', new Date().toISOString())
    ]);

    return {
      routine: routineRes.data || { wake_time: "07:00", sleep_time: "23:00" }, // Fallback mock routine
      fixedBlocks: fixedBlocksRes.data || [],
      goals: goalsRes.data || [],
      topics: topicsRes.data || [],
      sessions: sessionsRes.data || [],
      activeTasks: tasksRes.data || [],
    };
  },

  async saveTasks(tasks) {
    if (!tasks || tasks.length === 0) return { data: [], error: null };
    const { data, error } = await supabase.from('tasks').insert(tasks).select();
    return { data, error };
  },

  async executeTask(taskId, status) {
    const { data, error } = await supabase.from('tasks').update({ status }).eq('id', taskId).select();
    return { data, error };
  },

  async logSession(sessionData) {
    const { data, error } = await supabase.from('sessions').insert([sessionData]);
    return { data, error };
  },
  
  async saveGoal(goalData) {
     const { data, error } = await supabase.from('goals').insert([goalData]).select();
     return { data, error };
  },

  async saveTopic(topicData) {
     const { data, error } = await supabase.from('topics').insert([topicData]).select();
     return { data, error };
  },
  
  async saveRoutine(routineData) {
     // UPSERT pattern for singular user routine
     const { data, error } = await supabase.from('routine')
        .upsert(routineData, { onConflict: 'user_id' })
        .select();
     return { data, error };
  },

  async saveFixedBlock(blockData) {
     const { data, error } = await supabase.from('fixed_blocks').insert([blockData]).select();
     return { data, error };
  },

  async deleteFixedBlock(blockId) {
     const { error } = await supabase.from('fixed_blocks').delete().eq('id', blockId);
     return { error };
  },

  async deleteGoal(goalId) {
     const { error } = await supabase.from('goals').delete().eq('id', goalId);
     return { error };
  },

  async deleteTopic(topicId) {
     const { error } = await supabase.from('topics').delete().eq('id', topicId);
     return { error };
  },

  async deleteTask(taskId) {
     const { error } = await supabase.from('tasks').delete().eq('id', taskId);
     return { error };
  },

  async clearPendingTasks(userId) {
     const { error } = await supabase.from('tasks')
       .delete()
       .eq('user_id', userId)
       .eq('status', 'pending');
     return { error };
  },

  async pruneExpiredTasks(userId) {
     // Marks any scheduled task that has passed its end time as skipped
     const now = new Date().toISOString();
     const { data, error } = await supabase
       .from('tasks')
       .update({ status: 'skipped' })
       .eq('user_id', userId)
       .eq('status', 'pending')
       .lt('scheduled_end', now)
       .select();
     return { data, error };
  }
};
