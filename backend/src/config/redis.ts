import { RedisOptions } from 'ioredis';
import { config } from './env.js';

export const redisConnectionOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    console.log(`[Redis] Retrying connection in ${delay}ms... (attempt ${times})`);
    return delay;
  },
};
