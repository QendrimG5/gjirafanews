import type { Config } from "jest";

const config: Config = {
  // Use ts-jest to compile TypeScript test files on the fly
  preset: "ts-jest",

  // Use jsdom so tests have access to DOM APIs (document, window, etc.)
  testEnvironment: "jsdom",

  // Where Jest should look for test files
  roots: ["<rootDir>/__tests__"],

  // Map the @/* path alias (from tsconfig) so imports like @/lib/data resolve
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",

    // Stub CSS/image imports — they aren't needed in unit tests
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },

  // Auto-import @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // ts-jest transform config — use the same tsconfig but override jsx to react-jsx
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          module: "commonjs",
        },
      },
    ],
  },

  // Don't transform node_modules (except specific ESM packages if needed)
  transformIgnorePatterns: ["/node_modules/"],
};

export default config;
