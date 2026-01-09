module.exports = {
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
    transform: {
      "^.+\\.jsx?$": "babel-jest",
    },
    testPathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/"],
    moduleFileExtensions: ["js", "jsx"],
    resetMocks: false,
    "setupFiles": ["jest-localstorage-mock"]
  };