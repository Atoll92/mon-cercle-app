# Testing Guide

This project uses Vitest and React Testing Library for testing. Mock Service Worker (MSW) is used for API mocking.

## Setup

1. Install dependencies:
   ```bash
   # Run the install script
   ./install-test-deps.sh
   
   # Or install manually
   npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom msw @vitest/coverage-v8
   ```

2. The setup is already configured in these files:
   - `vite.config.js` - Vitest configuration
   - `src/setupTests.js` - Test setup
   - `src/test-utils.jsx` - Custom render utilities
   - `src/mocks/` - MSW handlers and setup

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized alongside the code they test:

- Component tests: `src/components/ComponentName.test.jsx`
- API function tests: `src/api/module.test.js`
- Context tests: `src/context/contextName.test.jsx`

## Writing Tests

### Component Tests

```jsx
// Example component test
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Your expected text')).toBeInTheDocument();
  });
});
```

### API Function Tests

```js
// Example API function test
import { describe, it, expect, vi } from 'vitest';
import { yourApiFunction } from './yourModule';
import { supabase } from '../supabaseclient';

// Mock the supabase client
vi.mock('../supabaseclient', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

describe('yourApiFunction', () => {
  it('fetches data correctly', async () => {
    // Setup mocks
    const mockData = { data: { id: '1', name: 'Test' }, error: null };
    const mockSelect = vi.fn().mockResolvedValue(mockData);
    supabase.from.mockReturnValue({ select: mockSelect });
    
    // Call the function
    const result = await yourApiFunction();
    
    // Assertions
    expect(supabase.from).toHaveBeenCalledWith('your_table');
    expect(result).toEqual(mockData.data);
  });
});
```

### Context Tests

```jsx
// Example context test
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { YourProvider, useYourContext } from './yourContext';

// Wrapper component for the provider
const wrapper = ({ children }) => <YourProvider>{children}</YourProvider>;

describe('YourContext', () => {
  it('provides initial state', () => {
    const { result } = renderHook(() => useYourContext(), { wrapper });
    expect(result.current.someValue).toBe('initial value');
  });
  
  it('updates state correctly', () => {
    const { result } = renderHook(() => useYourContext(), { wrapper });
    act(() => {
      result.current.someFunction('new value');
    });
    expect(result.current.someValue).toBe('new value');
  });
});
```

## Mocking APIs

API calls are mocked using Mock Service Worker (MSW). The handlers are defined in `src/mocks/handlers.js`.

To add a new API mock:

1. Add a handler to `src/mocks/handlers.js`:
   ```js
   http.get('/your-endpoint', () => {
     return HttpResponse.json({ data: 'your mock data' });
   }),
   ```

2. Use the mock in your tests.

## Best Practices

1. **Test behavior, not implementation**: Focus on what the user sees and interacts with.
2. **Use data-testid sparingly**: Prefer to select elements by role, text, or label.
3. **Mock dependencies**: Use Vitest's mocking capabilities to isolate the unit under test.
4. **Test edge cases**: Include tests for loading states, error states, empty states, etc.
5. **Keep tests simple**: Each test should verify one specific behavior.
6. **Avoid testing third-party code**: Focus on testing your own code.
7. **Maintain test isolation**: Tests should not depend on each other.

## Coverage Goals

Aim for high coverage in critical parts of the application:

- API functions: 80%+ coverage
- Context providers: 90%+ coverage
- Components: 70%+ coverage
- Utility functions: 90%+ coverage