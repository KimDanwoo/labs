import { defineConfig } from 'vitest/config';
import { FIRESTORE_RULES_TEST } from './vitest.config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [FIRESTORE_RULES_TEST],
  },
});
