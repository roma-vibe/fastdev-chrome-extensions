import { defineConfig } from 'vitest/config';

// `npm test` runs the scripts' tests and every extension's own Vitest project in one run.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'scripts',
          environment: 'node',
          include: ['scripts/**/*.test.ts'],
        },
      },
      '*/vitest.config.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['scripts/**/*.ts', '*/src/**/*.{ts,vue}', '*/*.config.ts'],
    },
  },
});
