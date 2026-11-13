import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    environment: 'node',
    env: {
      DATABASE_PATH: './data/test.db',
    },
  },
});
