import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/schema.js';
import { logger } from './utils/logger.js';

// Run database migrations on boot
runMigrations();

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 ReachCraft Outreach Server running on http://localhost:${env.PORT}`);
  logger.info(`👉 Connected to SQLite Database at: ${env.DATABASE_PATH}`);
});

process.on('SIGINT', () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
