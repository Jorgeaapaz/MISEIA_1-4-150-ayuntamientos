import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/unit/**/*.test.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/db.ts',
    '!lib/mail.ts',
    '!lib/s3.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 40,
    },
  },
};

export default config;
