# Testing Guidelines

This document establishes clear rules and patterns for testing in this React application to maintain consistency and avoid common pitfalls.

## Hook Testing Rules

### ✅ DO: Test Hook Interfaces (Integration-Style)

Hook tests should focus on **interface testing** - verifying that hooks provide the expected API and behavior:

```typescript
// ✅ Good: Test the hook interface
describe('useEnhancement', () => {
  it('should provide the expected API', () => {
    const { result } = renderHook(() => useEnhancement(), { wrapper })
    
    // Test function signatures
    expect(typeof result.current.enhanceField).toBe('function')
    expect(typeof result.current.inferMilestones).toBe('function')
    
    // Test initial state
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })
})
```

### ❌ DON'T: Mock Complex Dependencies

Avoid complex mocking of external dependencies (Supabase, HTTP clients, etc.) that leads to brittle tests:

```typescript
// ❌ Bad: Complex HTTP/API mocking
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockImplementation((name, { body }) => {
        if (name === 'enhance-field') {
          return Promise.resolve({ data: { suggestion: `Enhanced ${body.value}` }})
        }
        // ... complex mock logic
      })
    }
  }
}))
```

### ✅ DO: Use Simple Mock Stubs

For hooks that need external dependencies, use simple mock stubs:

```typescript
// ✅ Good: Simple mock stub
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}))
```

## Component Testing Rules

### ✅ DO: Test User Interactions and UI States

```typescript
// ✅ Good: Test user interactions
it('should show loading state when submitting', async () => {
  render(<LetterForm onClose={vi.fn()} onSuccess={vi.fn()} />)
  
  fireEvent.click(screen.getByRole('button', { name: /save/i }))
  
  expect(screen.getByText(/saving/i)).toBeInTheDocument()
})
```

### ❌ DON'T: Test Implementation Details

```typescript
// ❌ Bad: Testing implementation details
it('should call useMutation with correct parameters', () => {
  const mockUseMutation = vi.fn()
  vi.mock('@tanstack/react-query', () => ({ useMutation: mockUseMutation }))
  // ... this tests the implementation, not behavior
})
```

## Date Handling in Tests

### ✅ DO: Use Dynamic Dates

Always use dynamic date generation to avoid time-dependent test failures:

```typescript
// ✅ Good: Dynamic dates
const futureDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')
const mockLetter = createMockLetter({
  send_date: futureDate
})
```

### ❌ DON'T: Hardcode Dates

```typescript
// ❌ Bad: Hardcoded dates that will fail over time
const mockLetter = {
  send_date: '2024-12-01' // This will fail validation in 2025+
}
```

## Mock Strategy

### For Unit Tests
- Use `vi.fn()` for simple function mocks
- Mock only the immediate interface, not deep dependencies
- Focus on testing the component/hook contract

### For Integration Tests
- Test with real data flow where possible
- Use test databases or in-memory stores
- Mock only external services (APIs, file system)

### Test File Organization

```
src/
  components/
    __tests__/
      Component.test.tsx          # Component behavior tests
  hooks/
    __tests__/
      useHook.test.ts            # Hook interface tests
  lib/
    __tests__/
      utils.test.ts              # Utility function tests
```

## Testing Checklist

Before writing any test, ask:

- [ ] Am I testing **behavior** or **implementation details**?
- [ ] Will this test **break when I refactor** without changing behavior?
- [ ] Am I testing the **user-facing contract** of this code?
- [ ] Are my **dates dynamic** and won't fail over time?
- [ ] Is my **mock as simple as possible**?

## Common Patterns

### Hook Testing Template
```typescript
describe('useMyHook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } }
    })
    vi.clearAllMocks()
  })

  const renderHookWithProvider = (hook: () => any) => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)
    
    return renderHook(hook, { wrapper })
  }

  it('should provide expected interface', () => {
    const { result } = renderHookWithProvider(() => useMyHook())
    
    expect(typeof result.current.someFunction).toBe('function')
    expect(result.current.isLoading).toBe(false)
  })
})
```

## When Tests Fail

1. **Check dates first** - Are you using hardcoded dates?
2. **Simplify mocks** - Are your mocks too complex?
3. **Focus on interface** - Are you testing implementation details?
4. **Check dependencies** - Are you mocking too much?

---

**Remember**: Good tests should be **simple**, **focused**, and **resilient to refactoring**. They should test **what the code does**, not **how it does it**.
