import { defineConfig } from 'vitest/config';

// Security-rules tests. They need the Firestore + Storage emulators, so they are
// run through `npm run test:rules` (firebase emulators:exec) and are NOT part of
// the main `npm test` (files are named *.rules.ts so the default test glob of vite.config.ts does not match them).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.rules.ts'],
    globals: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    // Emulator state is shared: one worker, files run one after another.
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1,
  },
});
