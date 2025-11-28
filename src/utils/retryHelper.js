/**
 * Retry Mechanism với Exponential Backoff
 * Dùng cho các operations có thể bị conflict (transaction timeout, race condition)
 * 
 * @module utils/retryHelper
 */

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableErrors: ['P2028', 'P2034'], // Prisma transaction timeout & conflict errors
  retryableMessages: ['race condition', 'timeout', 'deadlock', 'conflict']
};

/**
 * Sleep helper function
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay với exponential backoff và jitter
 * @param {number} attempt - Số lần thử (0-indexed)
 * @param {object} config - Retry configuration
 * @returns {number} - Delay in milliseconds
 */
const calculateDelay = (attempt, config) => {
  const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const delay = Math.min(baseDelay, config.maxDelayMs);
  
  // Add jitter (±25%) to avoid thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
};

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @param {object} config - Retry configuration
 * @returns {boolean}
 */
const isRetryableError = (error, config) => {
  // Check Prisma error codes
  if (error.code && config.retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check error messages
  const errorMessage = (error.message || '').toLowerCase();
  return config.retryableMessages.some(msg => errorMessage.includes(msg.toLowerCase()));
};

/**
 * Execute function với retry mechanism
 * 
 * @param {Function} fn - Async function to execute
 * @param {object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.initialDelayMs - Initial delay in ms (default: 100)
 * @param {number} options.maxDelayMs - Maximum delay in ms (default: 5000)
 * @param {Function} options.onRetry - Callback on each retry (attempt, error, delay)
 * @param {Function} options.shouldRetry - Custom function to determine if should retry
 * @returns {Promise<any>} - Result of the function
 * 
 * @example
 * const result = await withRetry(
 *   () => checkout(data),
 *   { 
 *     maxRetries: 3, 
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * );
 */
export const withRetry = async (fn, options = {}) => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  let lastError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = config.shouldRetry 
        ? config.shouldRetry(error, attempt)
        : isRetryableError(error, config);
      
      // Don't retry if max attempts reached or error is not retryable
      if (attempt >= config.maxRetries || !shouldRetry) {
        throw error;
      }
      
      // Calculate delay
      const delay = calculateDelay(attempt, config);
      
      // Call onRetry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt + 1, error, delay);
      }
      
      console.log(`[RetryHelper] Attempt ${attempt + 1}/${config.maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  throw lastError;
};

/**
 * Wrapper cho checkout với retry
 * @param {Function} checkoutFn - Checkout function
 * @param {object} data - Checkout data
 * @param {object} options - Retry options
 */
export const checkoutWithRetry = async (checkoutFn, data, options = {}) => {
  return withRetry(
    () => checkoutFn(data),
    {
      maxRetries: 3,
      initialDelayMs: 200,
      maxDelayMs: 3000,
      onRetry: (attempt, error, delay) => {
        console.log(`[Checkout] Retry attempt ${attempt} after ${delay}ms. Error: ${error.message}`);
      },
      ...options
    }
  );
};

/**
 * Wrapper cho cancel order với retry
 * @param {Function} cancelFn - Cancel function
 * @param {number} orderId - Order ID
 * @param {number} userId - User ID
 * @param {string} reason - Cancel reason
 * @param {object} options - Retry options
 */
export const cancelOrderWithRetry = async (cancelFn, orderId, userId, reason, options = {}) => {
  return withRetry(
    () => cancelFn(orderId, userId, reason),
    {
      maxRetries: 2,
      initialDelayMs: 300,
      maxDelayMs: 2000,
      onRetry: (attempt, error, delay) => {
        console.log(`[CancelOrder] Retry attempt ${attempt} for order #${orderId}. Error: ${error.message}`);
      },
      ...options
    }
  );
};

/**
 * Wrapper cho inventory operations với retry
 * @param {Function} inventoryFn - Inventory function
 * @param {object} options - Retry options
 */
export const inventoryOperationWithRetry = async (inventoryFn, options = {}) => {
  return withRetry(inventoryFn, {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000,
    onRetry: (attempt, error, delay) => {
      console.log(`[Inventory] Retry attempt ${attempt} after ${delay}ms. Error: ${error.message}`);
    },
    ...options
  });
};

export default {
  withRetry,
  checkoutWithRetry,
  cancelOrderWithRetry,
  inventoryOperationWithRetry
};
