/**
 * Utility functions for shift management
 */

import { parse, isWithinInterval, areIntervalsOverlapping, parseISO } from "date-fns";

/**
 * Check if two shifts overlap
 * @param {Object} shift1 - First shift with start_time, end_time, and date
 * @param {Object} shift2 - Second shift with start_time, end_time, and date
 * @returns {boolean} - True if shifts overlap
 */
export function doShiftsOverlap(shift1, shift2) {
  // If shifts are on different dates, they don't overlap
  if (shift1.date !== shift2.date) {
    return false;
  }

  try {
    const date1 = parseISO(shift1.date);
    const date2 = parseISO(shift2.date);

    // Parse times on the same day
    const start1 = parse(shift1.start_time, "HH:mm", date1);
    const end1 = parse(shift1.end_time, "HH:mm", date1);
    const start2 = parse(shift2.start_time, "HH:mm", date2);
    const end2 = parse(shift2.end_time, "HH:mm", date2);

    // Handle overnight shifts (end time is before start time)
    let actualEnd1 = end1;
    let actualEnd2 = end2;

    if (end1 < start1) {
      actualEnd1 = new Date(end1);
      actualEnd1.setDate(actualEnd1.getDate() + 1);
    }

    if (end2 < start2) {
      actualEnd2 = new Date(end2);
      actualEnd2.setDate(actualEnd2.getDate() + 1);
    }

    return areIntervalsOverlapping(
      { start: start1, end: actualEnd1 },
      { start: start2, end: actualEnd2 },
      { inclusive: false } // Shifts can touch at endpoints without overlapping
    );
  } catch (error) {
    console.error("Error checking shift overlap:", error);
    return false;
  }
}

/**
 * Find overlapping shifts for a given employee
 * @param {string} employeeId - Employee ID to check
 * @param {Object} newShift - New shift to check against existing shifts
 * @param {Array} allShifts - All existing shifts
 * @param {string|null} currentShiftId - ID of current shift being edited (to exclude from comparison)
 * @returns {Array} - Array of overlapping shifts
 */
export function findOverlappingShifts(employeeId, newShift, allShifts, currentShiftId = null) {
  const overlappingShifts = [];

  for (const shift of allShifts) {
    // Skip the current shift being edited
    if (currentShiftId && shift.id === currentShiftId) {
      continue;
    }

    // Check if this employee is assigned to the shift
    const isAssigned = shift.assigned_employee_ids &&
                      Array.isArray(shift.assigned_employee_ids) &&
                      shift.assigned_employee_ids.includes(employeeId);

    if (isAssigned && doShiftsOverlap(newShift, shift)) {
      overlappingShifts.push(shift);
    }
  }

  return overlappingShifts;
}

/**
 * Calculate shift duration in hours
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @returns {number} - Duration in hours
 */
export function calculateShiftDuration(startTime, endTime) {
  try {
    const baseDate = new Date('2000-01-01');
    const start = parse(startTime, "HH:mm", baseDate);
    const end = parse(endTime, "HH:mm", baseDate);

    let durationMs = end - start;

    // Handle overnight shifts
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000;
    }

    return durationMs / (1000 * 60 * 60); // Convert to hours
  } catch (error) {
    console.error("Error calculating shift duration:", error);
    return 0;
  }
}

/**
 * Validate shift times
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @param {number} maxDuration - Maximum allowed duration in hours (default 24)
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validateShiftTimes(startTime, endTime, maxDuration = 24) {
  if (!startTime || !endTime) {
    return { valid: false, error: "יש למלא את שעות ההתחלה והסיום" };
  }

  const duration = calculateShiftDuration(startTime, endTime);

  if (duration === 0) {
    return { valid: false, error: "משמרת לא יכולה להיות באורך 0 שעות" };
  }

  if (duration > maxDuration) {
    return { valid: false, error: `משמרת לא יכולה להיות יותר מ-${maxDuration} שעות` };
  }

  return { valid: true, error: null };
}

/**
 * Format shift time range for display
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @returns {string} - Formatted time range
 */
export function formatShiftTimeRange(startTime, endTime) {
  const duration = calculateShiftDuration(startTime, endTime);
  const isOvernightShift = endTime < startTime;

  return `${startTime} - ${endTime}${isOvernightShift ? ' (לילה)' : ''} (${duration.toFixed(1)} שעות)`;
}
