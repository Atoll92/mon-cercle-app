#!/bin/bash

# Script to install testing dependencies for the project

echo "Installing testing dependencies..."

# Install Vitest and related packages
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom

# Install MSW for API mocking
npm install --save-dev msw

# Add @vitest/coverage-v8 for test coverage reporting
npm install --save-dev @vitest/coverage-v8

echo "Testing dependencies installed successfully!"
echo "You can now run tests with: npm test"
echo "Or watch tests with: npm run test:watch"
echo "Or generate coverage reports with: npm run test:coverage"