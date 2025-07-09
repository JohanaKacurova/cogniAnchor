module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['./jest.setup.js'],
  roots: ['<rootDir>/modules', '<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>/modules', '<rootDir>'],
}; 