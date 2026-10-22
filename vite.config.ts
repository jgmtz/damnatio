import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative paths so the dist/ folder works when zipped and uploaded to itch.io.
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
