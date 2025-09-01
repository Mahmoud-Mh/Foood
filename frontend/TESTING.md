# Testing Guide

This document outlines the comprehensive testing strategy for the Recipe Hub frontend application.

## Testing Architecture

We use a **hybrid A+B approach** that combines high-impact unit testing with comprehensive E2E testing:

- **Part A: High-Impact Unit Testing** - Focus on critical business logic with maximum ROI
- **Part B: End-to-End Testing** - Ensure real user workflows function correctly

## Unit Tests (Jest + React Testing Library)

### Coverage Achievements

| Component | Coverage | Test Count | Key Features Tested |
|-----------|----------|------------|-------------------|
| **AuthService** | 87.27% | 37 tests | Token refresh, password management, JWT parsing, edge cases |
| **HTTP Service** | 95.95% | 29 tests | Timeout handling, FormData, PATCH method, error scenarios |
| **Navbar** | 78.84% | 23 tests | User interactions, mobile menu, auth states, dropdown positioning |

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test auth.service.test.ts

# Run tests for specific component
npm test -- --testPathPattern=Navbar.test.tsx
```

### Unit Test Structure

```
src/
├── components/
│   └── __tests__/
│       ├── Navbar.test.tsx
│       ├── ErrorDisplay.test.tsx
│       └── PageErrorBoundary.test.tsx
└── services/
    └── __tests__/
        ├── auth.service.test.ts
        └── http.service.test.ts
```

## End-to-End Tests (Playwright)

### Test Coverage

Our E2E tests cover the three critical user journeys:

1. **Authentication Flow** (`auth-flow.spec.ts`)
   - User registration and validation
   - Login with various scenarios  
   - Session management and logout
   - Admin vs regular user access
   - Mobile authentication

2. **Recipe Management** (`recipe-management.spec.ts`)
   - Recipe creation with all fields
   - Dynamic ingredient/instruction management
   - Recipe editing and deletion
   - Image upload and validation
   - Mobile recipe creation

3. **Search and Favorites** (`search-and-favorites.spec.ts`)
   - Recipe search by title, ingredients, category
   - Search filters and combinations
   - Adding/removing favorites
   - Category browsing
   - Mobile search interface

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests with browser visible
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test auth-flow.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
```

### E2E Test Structure

```
e2e/
├── auth-flow.spec.ts           # Authentication user journeys
├── recipe-management.spec.ts   # Recipe CRUD operations
├── search-and-favorites.spec.ts # Search and favorites functionality
├── utils/
│   └── test-helpers.ts         # Reusable test utilities
├── fixtures/
│   └── test-data.ts           # Test data and mock responses
└── global-setup.ts            # Global test setup
```

### Browser Coverage

Tests run across multiple browsers and devices:

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Pixel 5, iPhone 12
- **Viewports**: 1920x1080, 375x667 (mobile)

## Test Data Management

### Test Users

```typescript
// Available test users
testUsers = {
  regularUser: { email: 'john.doe@test.com', password: 'TestPassword123!' },
  adminUser: { email: 'admin@test.com', password: 'AdminPassword123!' },
  newUser: { email: 'new.user@test.com', password: 'NewPassword123!' }
}
```

### Test Recipes

Pre-defined recipes for consistent testing:
- Ultimate Chocolate Cake (Dessert, Medium difficulty)
- Creamy Chicken Curry (Main Course, Easy)
- Classic Caesar Salad (Salad, Easy)

## Test Utilities

### TestHelpers Class

The `TestHelpers` class provides reusable methods for common E2E operations:

```typescript
const helpers = createTestHelpers(page);

// Authentication
await helpers.loginAsUser(email, password);
await helpers.loginAsAdmin();
await helpers.logout();

// Recipe operations
await helpers.createRecipe(recipeData);
await helpers.searchRecipes(query);
await helpers.addToFavorites(recipeTitle);

// Utilities
await helpers.navigateTo(path);
await helpers.screenshot(name);
await helpers.mockApiResponse(url, response);
```

## CI/CD Integration

### GitHub Actions (Example)

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### Unit Testing

1. **Test Business Logic**: Focus on services, utilities, and complex components
2. **Mock Dependencies**: Mock external services, APIs, and browser APIs
3. **Test Edge Cases**: Error scenarios, empty states, validation failures
4. **Avoid Implementation Details**: Test behavior, not implementation

### E2E Testing  

1. **Test User Journeys**: Focus on complete workflows users actually perform
2. **Use Page Object Model**: Encapsulate page interactions in helper classes
3. **Stable Selectors**: Use `data-testid` attributes for reliable element selection
4. **Independent Tests**: Each test should set up and clean up its own state
5. **Wait Strategies**: Use `waitForLoadState('networkidle')` for dynamic content

### Debugging

1. **Screenshots**: Automatic screenshots on test failures
2. **Videos**: Record test execution for failed tests
3. **Trace Files**: Detailed execution traces for debugging
4. **Debug Mode**: Step through tests interactively

## Performance Considerations

### Unit Tests
- **Parallel Execution**: Tests run in parallel by default
- **Fast Feedback**: Unit tests complete in under 5 seconds
- **Focused Testing**: Target high-impact code with maximum ROI

### E2E Tests
- **Strategic Coverage**: Focus on critical user paths, not exhaustive coverage
- **Browser Parallelization**: Tests run across multiple browser instances
- **Network Mocking**: Mock slow API calls for consistent test timing
- **Retry Strategy**: Automatic retries for flaky tests in CI

## Maintenance

### Regular Tasks

1. **Update Test Data**: Refresh test fixtures when app data models change
2. **Review Selectors**: Update `data-testid` attributes when UI changes
3. **Performance Monitoring**: Track test execution time and optimize slow tests
4. **Coverage Monitoring**: Maintain coverage thresholds and identify gaps

### Adding New Tests

1. **Unit Tests**: Add to existing `__tests__` directories following established patterns
2. **E2E Tests**: Create new spec files in `e2e/` directory or extend existing ones
3. **Test Data**: Add new fixtures to `e2e/fixtures/test-data.ts`
4. **Helpers**: Extend `TestHelpers` class for common operations

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout or improve wait strategies
2. **Flaky Tests**: Add proper waits and make tests more deterministic
3. **Browser Issues**: Clear browser data, update browser versions
4. **Network Errors**: Mock API responses, check test environment

### Getting Help

- Check test output for detailed error messages
- Use `--debug` mode for interactive debugging
- Review screenshots and videos for visual confirmation
- Consult this guide for best practices and examples