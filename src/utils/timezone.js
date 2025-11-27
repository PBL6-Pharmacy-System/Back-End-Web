/**
 * Timezone helper utilities for Vietnam timezone (UTC+7)
 */

const VN_TIMEZONE_OFFSET = 7 * 60; // UTC+7 in minutes

/**
 * Convert a date string or Date object from Vietnam timezone to UTC
 * @param {string|Date} dateInput - Date in Vietnam timezone (e.g., "2025-11-26 22:30:00")
 * @returns {Date} - Date object in UTC
 */
export function vnToUTC(dateInput) {
  // If input is already a Date object, assume it's in VN time and convert
  if (dateInput instanceof Date) {
    // Get the timestamp and subtract 7 hours to convert to UTC
    return new Date(dateInput.getTime() - VN_TIMEZONE_OFFSET * 60 * 1000);
  }
  
  // If input is a string
  const date = new Date(dateInput);
  
  // Check if the input already has timezone info (contains 'Z' or '+'/'-' with timezone)
  if (typeof dateInput === 'string' && (dateInput.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateInput))) {
    // Already has timezone info, use as is
    return date;
  }
  
  // Assume input is in VN time (no timezone specified), convert to UTC
  // Parse as local time then subtract 7 hours
  return new Date(date.getTime() - VN_TIMEZONE_OFFSET * 60 * 1000);
}

/**
 * Get current time in Vietnam timezone
 * @returns {Date} - Current Date object adjusted for Vietnam time
 */
export function getCurrentVNTime() {
  const now = new Date();
  // Add 7 hours to UTC to get VN time
  return new Date(now.getTime() + VN_TIMEZONE_OFFSET * 60 * 1000);
}

/**
 * Get current time in UTC for database queries
 * @returns {Date} - Current Date object in UTC
 */
export function getCurrentUTC() {
  return new Date();
}

/**
 * Convert UTC date to Vietnam timezone for display
 * @param {Date} utcDate - Date object in UTC
 * @returns {Date} - Date object adjusted to VN time
 */
export function utcToVN(utcDate) {
  if (!utcDate) return null;
  return new Date(utcDate.getTime() + VN_TIMEZONE_OFFSET * 60 * 1000);
}

/**
 * Format date for display in Vietnam timezone
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatVNDate(date) {
  if (!date) return '';
  const vnDate = date instanceof Date ? utcToVN(date) : utcToVN(new Date(date));
  return vnDate.toISOString().replace('T', ' ').substring(0, 19) + ' (VN)';
}

/**
 * Parse date input and ensure it's treated as VN time if no timezone specified
 * This is the main function to use when receiving date from frontend
 * @param {string|Date} dateInput - Date input from user/frontend
 * @returns {Date} - Date object in UTC for database storage
 */
export function parseVNDateInput(dateInput) {
  if (!dateInput) return null;
  
  // If already a Date object, assume it's already correct
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  // If string has timezone info (ISO format with Z or offset), parse directly
  if (typeof dateInput === 'string' && (dateInput.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateInput))) {
    return new Date(dateInput);
  }
  
  // Otherwise, treat as VN local time and convert to UTC
  // Parse the string as if it's in UTC (to avoid local timezone interpretation)
  let dateStr = dateInput;
  
  // Normalize format: "2025-11-26 16:00:00" -> "2025-11-26T16:00:00Z"
  if (dateStr.includes(' ')) {
    dateStr = dateStr.replace(' ', 'T');
  }
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr = dateStr + 'Z';
  }
  
  // Parse as UTC, then subtract 7 hours to get the UTC equivalent of VN time
  const utcDate = new Date(dateStr);
  
  // If input was "16:00 VN time", it's actually "09:00 UTC"
  // We parsed it as "16:00 UTC", so subtract 7 hours
  return new Date(utcDate.getTime() - VN_TIMEZONE_OFFSET * 60 * 1000);
}

/**
 * Log date comparison for debugging
 */
export function logDateComparison(label, vnDate, utcDate) {
  console.log(`[${label}]`);
  console.log(`  VN Time: ${formatVNDate(vnDate)}`);
  console.log(`  UTC Time: ${utcDate.toISOString()}`);
}
