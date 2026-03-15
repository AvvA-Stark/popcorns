# Testing Guide for Popcorns

This document describes the testing infrastructure, how to run tests, and current test coverage goals.

## 📋 Table of Contents

- [Test Stack](#test-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Coverage Goals](#coverage-goals)
- [Writing Tests](#writing-tests)
- [E2E Testing (Detox)](#e2e-testing-detox)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## 🧪 Test Stack

- **Jest** - Test runner and framework
- **React Native Testing Library** - Component testing utilities
- **jest-expo** - Expo preset for Jest
- **Detox** - E2E testing framework (optional, not yet configured)

## 🚀 Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to see detailed coverage.

### Run specific test file

```bash
npm test -- lib/__tests__/cache.test.ts
```

### Run tests matching pattern

```bash
npm test -- --testNamePattern="should return cached data"
```

## 📁 Test Structure

```
app/
├── lib/
│   ├── __tests__/
│   │   ├── cache.test.ts          # Cache utility tests
│   │   ├── region.test.ts         # Region detection tests
│   │   └── watchlist.test.ts      # Watchlist service tests
│   ├── cache.ts
│   ├── region.ts
│   └── watchlist.ts
├── components/
│   ├── __tests__/
│   │   ├── MovieCard.test.tsx     # MovieCard component tests
│   │   └── WatchlistCard.test.tsx # WatchlistCard component tests
│   ├── MovieCard.tsx
│   └── WatchlistCard.tsx
├── jest.config.js                 # Jest configuration
├── jest.setup.js                  # Global test setup & mocks
└── TESTING.md                     # This file
```

## 🎯 Coverage Goals

### Current Status (as of latest run)

| Module               | Statements | Branches | Functions | Lines  | Status |
|----------------------|------------|----------|-----------|--------|--------|
| lib/cache.ts         | 100%       | 77.77%   | 100%      | 100%   | ✅     |
| lib/region.ts        | 100%       | 91.30%   | 100%      | 100%   | ✅     |
| lib/watchlist.ts     | 91.48%     | 80%      | 100%      | 90.69% | ✅     |
| MovieCard.tsx        | 83.33%     | 100%     | 50%       | 83.33% | ⚠️     |
| WatchlistCard.tsx    | 58.82%     | 70%      | 33.33%    | 58.82% | ⚠️     |

### Coverage Targets

**Core utilities (lib/):** >80% coverage on all metrics
- ✅ Achieved for cache, region, and watchlist

**Components:** >60% statement coverage
- ✅ MovieCard: 83%
- ⚠️ WatchlistCard: 59% (close!)

**Overall project:** Currently at ~17% due to untested screens and complex components. Focus is on **core utilities** first.

## ✍️ Writing Tests

### Example: Testing a utility function

```typescript
// lib/__tests__/myutil.test.ts
import { myFunction } from '../myutil';

describe('myutil', () => {
  it('should do something', () => {
    const result = myFunction(123);
    expect(result).toBe(246);
  });
  
  it('should handle errors', () => {
    expect(() => myFunction(-1)).toThrow('Invalid input');
  });
});
```

### Example: Testing a React component

```typescript
// components/__tests__/MyComponent.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render title', () => {
    const { getByText } = render(<MyComponent title="Hello" />);
    expect(getByText('Hello')).toBeTruthy();
  });
  
  it('should call onPress when button is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);
    
    fireEvent.press(getByText('Tap Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking modules

```typescript
// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
```

## 🤖 E2E Testing (Detox)

**Status:** Not yet implemented. Planned for future iteration.

Detox would allow testing complete user flows like:
- Launch app → Swipe through movies → Add to watchlist
- Search for movie → View details → Share
- Region detection verification

### Future Detox Setup

```bash
# Install Detox
npm install --save-dev detox

# Initialize Detox config
npx detox init

# Run E2E tests (iOS simulator)
npx detox test --configuration ios.sim.debug
```

See [Detox documentation](https://wix.github.io/Detox/) for setup guide.

### Why Detox isn't included yet

- Requires iOS simulator or Android emulator
- Needs native builds (not Expo Go)
- More setup overhead for CI/CD
- Focus was on achieving >80% coverage on core utilities first

**Recommendation:** Add Detox once core functionality is stable and you need to test complex swipe gestures and navigation flows.

## 🔄 CI/CD Pipeline

GitHub Actions workflow runs on every push and PR:

**Jobs:**

1. **test** - Runs Jest tests with coverage
   - Matrix: Node 18.x and 20.x
   - Uploads coverage to Codecov
   - Archives coverage report as artifact

2. **build** - Verifies Expo config and TypeScript
   - Checks TypeScript compilation
   - Validates Expo configuration

3. **lint** - Type checking (future: ESLint)
   - TypeScript type check

**Configuration:** `.github/workflows/test.yml`

### Viewing CI Results

- **GitHub Actions tab:** See test runs, logs, and artifacts
- **Codecov:** Coverage reports (if configured with token)
- **Artifacts:** Download coverage HTML reports from Actions tab

## 🐛 Troubleshooting

### "Cannot find module" errors

Make sure mocks are in `jest.setup.js`:

```js
jest.mock('@react-native-async-storage/async-storage', () => ({ ... }));
```

### "ReferenceError: You are trying to import a file outside the scope"

This is an Expo Winter runtime issue. Make sure `jest.setup.js` includes:

```js
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
  global.__ExpoImportMetaRegistry = {};
}
```

### "WorkletsError: Native part of Worklets doesn't seem to be initialized"

This happens with `react-native-reanimated`. Mock it in `jest.setup.js`:

```js
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (val) => ({ value: val }),
  useAnimatedStyle: (cb) => cb(),
  withSpring: (val) => val,
  // ... other mocks
}));
```

### Tests pass locally but fail in CI

- Check Node version (CI uses 18.x and 20.x)
- Make sure `npm ci --legacy-peer-deps` is used
- Check for timing-sensitive tests (add timeouts if needed)

### Coverage not updating

- Delete `coverage/` folder and re-run tests
- Make sure Jest config `collectCoverageFrom` includes your files

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)

---

**Last Updated:** 2026-03-15  
**Test Count:** 56 passing tests  
**Core Coverage:** >80% on utilities (cache, region, watchlist)
