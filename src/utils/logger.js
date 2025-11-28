/**
 * Logger Utility
 * Centralized logging với levels để tránh log thông tin nhạy cảm trong production
 * 
 * @module utils/logger
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Lấy log level từ environment, mặc định là INFO trong production
const getCurrentLevel = () => {
    const env = process.env.NODE_ENV || 'development';
    const configuredLevel = process.env.LOG_LEVEL?.toUpperCase();

    if (configuredLevel && LOG_LEVELS[configuredLevel] !== undefined) {
        return LOG_LEVELS[configuredLevel];
    }

    // Default levels based on environment
    return env === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
};

/**
 * Mask sensitive data trong objects trước khi log
 */
const maskSensitiveData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
        'password', 'token', 'accessToken', 'refreshToken',
        'secret', 'apiKey', 'api_key', 'authorization',
        'creditCard', 'credit_card', 'cardNumber', 'card_number',
        'cvv', 'ssn', 'phone', 'email'
    ];

    const masked = Array.isArray(data) ? [...data] : { ...data };

    for (const key of Object.keys(masked)) {
        const lowerKey = key.toLowerCase();

        // Mask sensitive fields
        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
            masked[key] = '[REDACTED]';
        }
        // Recursively mask nested objects
        else if (typeof masked[key] === 'object' && masked[key] !== null) {
            masked[key] = maskSensitiveData(masked[key]);
        }
    }

    return masked;
};

/**
 * Format log message với timestamp và context
 */
const formatMessage = (level, context, message, data) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    const contextStr = context ? ` [${context}]` : '';

    return {
        prefix: `${prefix}${contextStr}`,
        message,
        data: data ? maskSensitiveData(data) : undefined
    };
};

/**
 * Logger class với các methods cho từng level
 */
class Logger {
    constructor(context = '') {
        this.context = context;
        this.level = getCurrentLevel();
    }

    /**
     * Tạo child logger với context mới
     */
    child(childContext) {
        const newContext = this.context
            ? `${this.context}:${childContext}`
            : childContext;
        return new Logger(newContext);
    }

    /**
     * Log error - Luôn được log
     */
    error(message, data = null) {
        if (this.level >= LOG_LEVELS.ERROR) {
            const { prefix, data: maskedData } = formatMessage('ERROR', this.context, message, data);
            if (maskedData) {
                console.error(prefix, message, maskedData);
            } else {
                console.error(prefix, message);
            }
        }
    }

    /**
     * Log warning - Production và development
     */
    warn(message, data = null) {
        if (this.level >= LOG_LEVELS.WARN) {
            const { prefix, data: maskedData } = formatMessage('WARN', this.context, message, data);
            if (maskedData) {
                console.warn(prefix, message, maskedData);
            } else {
                console.warn(prefix, message);
            }
        }
    }

    /**
     * Log info - Development only by default
     */
    info(message, data = null) {
        if (this.level >= LOG_LEVELS.INFO) {
            const { prefix, data: maskedData } = formatMessage('INFO', this.context, message, data);
            if (maskedData) {
                console.info(prefix, message, maskedData);
            } else {
                console.info(prefix, message);
            }
        }
    }

    /**
     * Log debug - Development only
     * ⚠️ NEVER use in production - may contain sensitive data
     */
    debug(message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            const { prefix, data: maskedData } = formatMessage('DEBUG', this.context, message, data);
            if (maskedData) {
                console.log(prefix, message, maskedData);
            } else {
                console.log(prefix, message);
            }
        }
    }

    /**
     * Log request info (sanitized)
     */
    request(req, additionalInfo = {}) {
        this.info('Incoming request', {
            method: req.method,
            path: req.path,
            query: req.query,
            userId: req.user?.userId,
            role: req.user?.role_name,
            ...additionalInfo
        });
    }

    /**
     * Log response info
     */
    response(statusCode, message, duration = null) {
        const info = { statusCode, message };
        if (duration) info.duration = `${duration}ms`;

        if (statusCode >= 500) {
            this.error('Response error', info);
        } else if (statusCode >= 400) {
            this.warn('Response warning', info);
        } else {
            this.info('Response success', info);
        }
    }
}

// Default logger instance
const logger = new Logger();

// Named exports for specific modules
export const createLogger = (context) => new Logger(context);

// Pre-configured loggers for common modules
export const orderLogger = new Logger('Order');
export const inventoryLogger = new Logger('Inventory');
export const checkoutLogger = new Logger('Checkout');
export const shippingLogger = new Logger('Shipping');
export const authLogger = new Logger('Auth');
export const paymentLogger = new Logger('Payment');

export default logger;
