/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@gjirafanews/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@gjirafanews/utils$": "<rootDir>/../../packages/utils/src/index.ts",
    "^@gjirafanews/ui$": "<rootDir>/../../packages/ui/src/index.tsx",
    "^@gjirafanews/api-client$":
      "<rootDir>/../../packages/api-client/src/index.ts",
    "^@gjirafanews/auth$": "<rootDir>/../../packages/auth/src/index.ts",
    "^@gjirafanews/auth/(.*)$": "<rootDir>/../../packages/auth/src/$1.ts",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  setupFilesAfterEach: undefined,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
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
  transformIgnorePatterns: ["/node_modules/"],
};
