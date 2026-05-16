// src/lib/engines/timeSlotEngine.js

/**
 * Converts HH:MM string to total minutes from midnight for easy math
 */
const timeToMins = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Converts minutes back to HH:MM format
 */
const minsToTime = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Parses fixed blocks and routine into available free time slots
 * @param {Object} routine - { wake_time: "06:00", sleep_time: "22:00" }
 * @param {Array} fixedBlocks - [{ start_time: "09:00", end_time: "17:00" }]
 * @returns {Array} Array of free slots [{ startMins: 360, endMins: 540 }, ...]
 */
export const generateFreeSlots = (routine, fixedBlocks = []) => {
  if (!routine || !routine.wake_time || !routine.sleep_time) return [];

  const wakeMins = timeToMins(routine.wake_time);
  let sleepMins = timeToMins(routine.sleep_time);
  
  // Handle overnight schedules (e.g. sleep at 02:00 AM next day)
  if (sleepMins < wakeMins) {
    sleepMins += 24 * 60;
  }

  // Convert fixed blocks to minutes and sort by start time
  const sortedBlocks = fixedBlocks
    .map(block => ({
      startMins: timeToMins(block.start_time),
      endMins: timeToMins(block.end_time)
    }))
    .map(block => {
      // If a block occurs strictly past midnight (e.g. 01:00 AM matches to 60 mins),
      // BUT the user's wake cycle doesn't end until much later (e.g. sleep at 02:00 AM -> 1560 mins),
      // we must shift the entire block's integer boundaries by +24 hours so mathematically it's treated as the tail end of today's workload.
      if (block.startMins < wakeMins && sleepMins > 24 * 60) {
          block.startMins += 24 * 60;
          block.endMins += 24 * 60;
      } else if (block.endMins < block.startMins) {
          block.endMins += 24 * 60; // Standard overnight gap bridge
      }
      return block;
    })
    .sort((a, b) => a.startMins - b.startMins);

  const freeSlots = [];
  let currentMins = wakeMins;

  // Find gaps between blocks
  for (const block of sortedBlocks) {
    // If the fixed block starts after our current available time marker
    if (block.startMins > currentMins) {
      // Ensure the gap is within waking hours
      const gapEnd = Math.min(block.startMins, sleepMins);
      if (gapEnd > currentMins) {
        freeSlots.push({
          startMins: currentMins,
          endMins: gapEnd,
          duration: gapEnd - currentMins
        });
      }
    }
    // Advance the marker to the end of the current fixed block
    currentMins = Math.max(currentMins, block.endMins);
  }

  // Add the final gap between the last fixed block (or wake time) and sleep time
  if (currentMins < sleepMins) {
    freeSlots.push({
      startMins: currentMins,
      endMins: sleepMins,
      duration: sleepMins - currentMins
    });
  }

  return freeSlots;
};

/**
 * Filter slots that are already in the past for today's dynamic rescheduling,
 * natively correcting for overnight timezone crossover limits.
 */
export const filterPastSlots = (slots, routine) => {
  if (!slots || slots.length === 0) return [];
  
  const now = new Date();
  let currentMins = now.getHours() * 60 + now.getMinutes();
  
  // If we have crossed midnight but haven't slept yet, shift our relative time up integer bounds
  if (routine && routine.wake_time) {
      const wakeMins = timeToMins(routine.wake_time);
      if (currentMins < wakeMins) {
          currentMins += 24 * 60;
      }
  }

  return slots.map(slot => {
    // If the whole slot is in the past natively, return null
    if (slot.endMins <= currentMins) return null;
    
    // If we're currently in the middle of a slot, cleanly truncate the start bounds
    if (slot.startMins < currentMins) {
      return {
        ...slot,
        startMins: currentMins,
        duration: slot.endMins - currentMins
      };
    }
    
    return slot;
  }).filter(Boolean); // Remove nulls
};
