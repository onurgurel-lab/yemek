export default {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@store/(.*)$': '<rootDir>/src/store/$1',
        '^@constants/(.*)$': '<rootDir>/src/constants/$1'
    },
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    moduleFileExtensions: ['js', 'jsx', 'json'],
    testMatch: [
        '<rootDir>/src/**/*.test.{js,jsx}',
        '<rootDir>/src/**/*.spec.{js,jsx}'
    ],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/main.jsx',
        '!src/vite-env.d.ts',
        '!**/node_modules/**',
        '!**/vendor/**'
    ]
}