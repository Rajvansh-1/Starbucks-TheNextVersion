import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';

export default async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/starbucks_test_db';

  // Connect to test database
  await connectDatabase();
  await connectRedis();
};
