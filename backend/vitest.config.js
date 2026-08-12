import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/erp_test?schema=public',
      NODE_ENV: 'test',
      JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_key_12345'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
