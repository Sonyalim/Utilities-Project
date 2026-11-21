import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import 'dotenv/config';

const bdd = defineBddConfig({
  features: 'features/*.feature',
  steps: 'steps/*.ts',
});

export default defineConfig({
  webServer: {
    command: 'node app/server.js',
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: !process.env.CI,
  },
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  projects: [
    {
      name: 'ui',
      testDir: 'tests/ui',
      use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4173' },
    },
    {
      name: 'bdd',
      testDir: bdd,
      use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4173' },
    },
    {
      name: 'api',
      testDir: 'tests/api',
      use: { baseURL: process.env.API_URL ?? 'http://127.0.0.1:4173' },
    },
  ],
});