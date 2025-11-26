import Redis from 'ioredis';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

// Create Redis instance
const redis = new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('ready', () => {
  console.log('✅ Redis is ready to accept commands');
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

// Cache utility methods
export const cache = {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached data or null
   */
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache GET error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set cache data with TTL
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in seconds (default: 5 minutes)
   */
  async set(key, value, ttl = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache SET error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Delete single cache key
   * @param {string} key - Cache key
   */
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache DEL error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Pattern to match keys (e.g., "products:*")
   */
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Deleted ${keys.length} cache keys matching "${pattern}"`);
      }
      return true;
    } catch (error) {
      console.error(`Cache DEL PATTERN error for "${pattern}":`, error);
      return false;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Cache key
   */
  async exists(key) {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error(`Cache EXISTS error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Set expiration time for existing key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   */
  async expire(key, ttl) {
    try {
      await redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache EXPIRE error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Increment value (useful for counters)
   * @param {string} key - Cache key
   */
  async incr(key) {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error(`Cache INCR error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Clear all cache (use with caution!)
   */
  async flushAll() {
    try {
      await redis.flushall();
      console.log('🗑️ All cache cleared');
      return true;
    } catch (error) {
      console.error('Cache FLUSH error:', error);
      return false;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  console.log('👋 Redis connection closed gracefully');
  process.exit(0);
});

export default redis;
