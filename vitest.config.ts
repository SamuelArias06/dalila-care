import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.test.ts', 'apps/web/test/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@dalila/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname },
  },
});
