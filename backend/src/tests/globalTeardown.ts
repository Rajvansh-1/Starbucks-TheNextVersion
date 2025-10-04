import { disconnectDatabase } from '../config/database';
import { disconnectRedis } from '../config/redis';

export default async () => {
  // Disconnect from test database
  await disconnectDatabase();
  await disconnectRedis();
};
