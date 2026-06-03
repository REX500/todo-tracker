/** @type {import('jest').Config} */
const tsTransform = {
  "^.+\\.(ts|tsx)$": [
    "ts-jest",
    {
      tsconfig: {
        jsx: "react",
        esModuleInterop: true,
        module: "commonjs",
        moduleResolution: "node",
        strict: true,
        target: "ES2020",
        baseUrl: ".",
        paths: { "@/*": ["./*"] }
      }
    }
  ]
};

module.exports = {
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      transform: tsTransform,
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"]
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
      transform: tsTransform,
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/integration/jest.setup.ts"]
    }
  ]
};
