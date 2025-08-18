import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useEnhancement } from '../useEnhancement'

// Mock toast to avoid UI side effects in tests
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock supabase to return a working mock
const mockInvoke = vi.fn()
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    }
  }
}))

// Create test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useEnhancement', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    })
    
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('enhanceField', () => {
    it('should return enhancement function and loading state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)
      
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      expect(typeof result.current.enhanceField).toBe('function')
      expect(typeof result.current.isEnhancingField).toBe('boolean')
      expect(typeof result.current.isLoading).toBe('boolean')
      expect(result.current.isEnhancingField).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should have enhance field function available', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)
      
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      expect(typeof result.current.enhanceField).toBe('function')
      expect(typeof result.current.inferMilestones).toBe('function')
    })
  })

  describe('inferMilestones', () => {
    it('should have infer milestones function available', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)
      
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      expect(typeof result.current.inferMilestones).toBe('function')
      expect(typeof result.current.isInferringMilestones).toBe('boolean')
      expect(result.current.isInferringMilestones).toBe(false)
    })
  })

  describe('loading states', () => {
    it('should have proper initial loading states', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)
      
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      // Initial state should not be loading
      expect(result.current.isEnhancingField).toBe(false)
      expect(result.current.isInferringMilestones).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeUndefined()
    })
  })
})
