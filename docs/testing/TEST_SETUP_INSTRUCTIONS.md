# Test Setup Instructions for B-Form Upload Tracker

## Backend Setup

### 1. Install Test Dependencies

```bash
cd bform-tracker-api

npm install --save-dev \
  jest@^29.7.0 \
  supertest@^6.3.3 \
  @testing-library/react@^14.0.0

# For mocking and utilities
npm install --save-dev \
  jest-mock-extended@^3.0.0 \
  node-mocks-http@^1.13.0
```

### 2. Update package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:ci": "jest --coverage --ci --maxWorkers=2"
  }
}
```

### 3. Jest Configuration

The `jest.config.js` file is already configured. Key settings:
- Test environment: `node`
- Test files location: `tests/**/*.test.js`
- Coverage threshold: 80% for all metrics
- Setup file: `tests/setup.js`

### 4. Environment Variables for Tests

Create `.env.test`:
```
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRES_IN=7d
DATABASE_HOST=localhost
DATABASE_USER=test
DATABASE_PASSWORD=test
DATABASE_NAME=bform_test
UPLOAD_DIR=./test-uploads
MAX_FILE_SIZE=52428800
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Watch mode (re-run on file change)
npm run test:watch

# Debug mode
npm run test:debug

# Run specific test file
npm test tests/backend/controllers.test.js

# Run tests matching pattern
npm test -- --testNamePattern="createUpload"

# CI mode (used in GitHub Actions)
npm run test:ci
```

## Frontend Setup

### 1. Install Test Dependencies

```bash
cd b-form-tracker

# Core testing libraries
npm install --save-dev \
  @testing-library/react@^14.0.0 \
  @testing-library/jest-dom@^6.1.0 \
  @testing-library/user-event@^14.5.0 \
  jest@^29.7.0 \
  jest-environment-jsdom@^29.7.0

# Babel for JSX transformation
npm install --save-dev \
  @babel/preset-react@^7.23.0 \
  babel-jest@^29.7.0 \
  @babel/preset-env@^7.23.0

# CSS and asset mocking
npm install --save-dev \
  identity-obj-proxy@^3.0.0
```

### 2. Create .babelrc

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    "@babel/preset-react"
  ]
}
```

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "format": "prettier --write \"src/**/*.{js,jsx,css}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:ci": "jest --coverage --ci --maxWorkers=2"
  }
}
```

### 4. Create Mock Files

Create `tests/__mocks__/fileMock.js`:
```javascript
module.exports = 'test-file-stub';
```

Create `tests/__mocks__/axios.js`:
```javascript
module.exports = {
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }))
};
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test:coverage

# Watch mode (re-run on file change)
npm run test:watch

# Debug mode
npm run test:debug

# Run specific test file
npm test components.test.js

# Run tests matching pattern
npm test -- --testNamePattern="StatsCards"

# CI mode
npm run test:ci
```

## Running Tests in Docker

### Backend Docker Testing

```dockerfile
# Dockerfile.test
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
CMD ["npm", "test"]
```

Build and run:
```bash
docker build -f Dockerfile.test -t bform-api-test .
docker run bform-api-test
```

## GitHub Actions CI/CD Setup

### Backend Workflow

Create `.github/workflows/backend-test.yml`:
```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: cd bform-tracker-api && npm ci
      
      - name: Run tests
        run: cd bform-tracker-api && npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./bform-tracker-api/coverage/lcov.info
```

### Frontend Workflow

Create `.github/workflows/frontend-test.yml`:
```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: cd b-form-tracker && npm ci
      
      - name: Run tests
        run: cd b-form-tracker && npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./b-form-tracker/coverage/lcov.info
```

## Pre-commit Hook Setup

### Setup husky and lint-staged

```bash
npm install --save-dev husky lint-staged

npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test"
```

### Update package.json

```json
{
  "lint-staged": {
    "src/**/*.js": ["eslint --fix", "jest --bail --findRelatedTests"],
    "src/**/*.jsx": ["eslint --fix", "jest --bail --findRelatedTests"]
  }
}
```

## Troubleshooting

### Jest Not Finding Tests
- Ensure files match pattern: `*.test.js` or `*.spec.js`
- Check `jest.config.js` testMatch configuration
- Verify file is in `tests/` directory

### Module Not Found Errors
- Check moduleNameMapper in jest.config.js
- Ensure mocks are in correct location
- Verify import paths match actual file structure

### Async Test Timeouts
- Increase testTimeout in jest.config.js
- Use `jest.useFakeTimers()` for time-dependent tests
- Ensure `await` is used with Promises

### Coverage Not Meeting Target
- Run `npm test -- --coverage` to see detailed report
- Look for red/yellow highlighted uncovered lines
- Add tests for branches and edge cases

### React Testing Library Issues
- Ensure React component is imported correctly
- Use `screen.getByTestId()` with data-testid attributes
- Wrap user interactions in `waitFor()` for async operations

### Babel Transform Errors
- Check `.babelrc` configuration
- Ensure @babel/preset-react is installed
- For CommonJS projects, adjust babel config

## Performance Optimization

### Speed Up Tests

```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Run only changed tests
npm test -- --onlyChanged

# Use bail to stop on first failure
npm test -- --bail

# Cache test results
npm test -- --cache
```

### Memory Management

```bash
# For memory-constrained environments
npm test -- --maxWorkers=1 --logHeapUsage

# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

## Code Coverage Analysis

### Generate Coverage Reports

```bash
# HTML coverage report
npm test -- --coverage

# Coverage opens in browser
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

### Coverage Thresholds

Configured in jest.config.js:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

These can be adjusted per project needs.

## IDE Integration

### VS Code

Install extensions:
- Jest Runner
- Jest
- Test Explorer UI

Add to `.vscode/settings.json`:
```json
{
  "jest.rootPath": "..",
  "jest.showCoverageOnLoad": true,
  "jest.runMode": "on-demand"
}
```

### WebStorm/IntelliJ

- Built-in Jest support
- Run tests with right-click context menu
- Built-in test coverage analysis

## Next Steps

1. **Run all tests**: `npm test`
2. **Check coverage**: `npm test -- --coverage`
3. **Fix any failures**: Review test output and fix issues
4. **Set up CI/CD**: Use provided GitHub Actions workflows
5. **Integrate with IDE**: Install testing extensions
6. **Add pre-commit hooks**: Prevent committing broken code

## Test Statistics

### Backend Test Suite
- **Total Test Cases**: 135+
- **Test Files**: 4
- **Coverage Target**: >80%
- **Average Test Time**: <5s

### Frontend Test Suite
- **Total Test Cases**: 125+
- **Test Files**: 3
- **Coverage Target**: >80%
- **Average Test Time**: <3s

## Support and Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- Test files in `tests/` directory include detailed comments
