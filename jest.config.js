/** @type {import('jest').Config} */
const config = {
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
    '!lib/download.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 40,
    },
  },
};

module.exports = config;
