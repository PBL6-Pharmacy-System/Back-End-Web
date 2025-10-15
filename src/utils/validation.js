/**
 * Validate required fields in an object
 * @param {Object} data - Object to validate
 * @param {Array<string>} fields - Array of required field names
 * @returns {Array<string>} Array of missing field names
 */
export const validateRequiredFields = (data, fields) => {
  return fields.filter(field => !data[field]);
};

/**
 * Validate numeric fields in an object
 * @param {Object} data - Object to validate
 * @param {Array<string>} fields - Array of field names that should be numeric
 * @returns {Array<string>} Array of invalid field names
 */
export const validateNumericFields = (data, fields) => {
  return fields.filter(field => {
    if (data[field] === undefined) return false;
    return isNaN(Number(data[field])) || Number(data[field]) < 0;
  });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone number is valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate birthdate (not in future and age <= 120)
 * @param {string|Date} birthdate - Birthdate to validate
 * @returns {boolean} True if birthdate is valid
 */
export const isValidBirthdate = (birthdate) => {
  const birthdateObj = new Date(birthdate);
  const now = new Date();
  
  if (birthdateObj > now) {
    return false;
  }
  
  // Calculate age
  const age = Math.floor((now - birthdateObj) / (365.25 * 24 * 60 * 60 * 1000));
  return age <= 120;
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date to validate
 * @param {string|Date} endDate - End date to validate
 * @returns {boolean} True if date range is valid
 */
export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};