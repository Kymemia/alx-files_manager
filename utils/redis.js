import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor () {
    this.client = redis.createClient();

    this.isReady = false;

    this.client.on('error', (err) => {
      console.error('Error:', err);
    });

    this.client.on('ready', () => {
      this.isReady = true;
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive () {
    return this.isReady;
  }

  async waitForReady () {
    if (this.isRead) return;
    await new Promise((resolve) => this.client.once('ready', resolve));
  }

  async get (key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (err) {
      console.error(`Error getting alue for key "${key}":`, err);
      return null;
    }
  }

  async set (key, value, duration) {
    try {
      await this.setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.error(`Error setting value for key "${key}":`, err);
    }
  }

  async del (key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error(`Error deleting key "${key}":`, err);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
