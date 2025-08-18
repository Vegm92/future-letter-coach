import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useEnhancement } from '../useEnhancement'
import { supabase } from '../../lib/supabase'

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
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
  const mockSupabaseInvoke = vi.mocked(supabase.functions.invoke)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enhanceField', () => {
    it('should return enhancement function and loading state', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      expect(typeof result.current.enhanceField).toBe('function')
      expect(typeof result.current.isEnhancingField).toBe('boolean')
      expect(typeof result.current.isLoading).toBe('boolean')
    })

    it('should call supabase enhance-field function with correct data', async () => {
      const mockResponse = {
        data: { 
          data: { 
            suggestion: 'Enhanced text', 
            explanation: 'This is better because...' 
          } 
        },
        error: null,
      }
      mockSupabaseInvoke.mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      const enhanceData = {
        field: 'title' as const,
        originalContent: 'Original title',
        context: { goal: 'Test goal' },
      }

      const response = await result.current.enhanceField(enhanceData)

      expect(mockSupabaseInvoke).toHaveBeenCalledWith('enhance-field', {
        body: enhanceData,
      })
      expect(response).toEqual({
        suggestion: 'Enhanced text',
        explanation: 'This is better because...',
      })
    })

    it('should handle enhancement errors', async () => {
      const mockError = new Error('Enhancement failed')
      mockSupabaseInvoke.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      await expect(
        result.current.enhanceField({
          field: 'title' as const,
          originalContent: 'Test',
          context: {},
        })
      ).rejects.toThrow('Enhancement failed')
    })
  })

  describe('inferMilestones', () => {
    it('should call supabase infer-milestones function with correct data', async () => {
      const mockResponse = {
        data: { 
          data: { 
            suggestedMilestones: [
              { title: 'Milestone 1', description: 'Description 1', percentage: 25 },
            ]
          } 
        },
        error: null,
      }
      mockSupabaseInvoke.mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      const inferenceData = {
        goal: 'Learn programming',
        content: 'I want to become a developer',
        sendDate: '2024-12-31',
      }

      const response = await result.current.inferMilestones(inferenceData)

      expect(mockSupabaseInvoke).toHaveBeenCalledWith('infer-milestones', {
        body: inferenceData,
      })
      expect(response).toEqual({
        suggestedMilestones: [
          { title: 'Milestone 1', description: 'Description 1', percentage: 25 },
        ],
      })
    })

    it('should handle milestone inference errors', async () => {
      const mockError = new Error('Inference failed')
      mockSupabaseInvoke.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const wrapper = createWrapper()
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      await expect(
        result.current.inferMilestones({
          goal: 'Test goal',
          content: 'Test content',
          sendDate: '2024-12-31',
        })
      ).rejects.toThrow('Inference failed')
    })
  })

  describe('loading states', () => {
    it('should show loading states during operations', async () => {
      // Mock a delayed response
      mockSupabaseInvoke.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { data: { suggestion: 'Enhanced', explanation: 'Better' } },
          error: null,
        }), 100))
      )

      const wrapper = createWrapper()
      const { result } = renderHook(() => useEnhancement(), { wrapper })

      // Initial state should not be loading
      expect(result.current.isEnhancingField).toBe(false)
      expect(result.current.isInferringMilestones).toBe(false)
      expect(result.current.isLoading).toBe(false)

      // Start enhancement
      const enhancePromise = result.current.enhanceField({
        field: 'title' as const,
        originalContent: 'Test',
        context: {},
      })

      // Should show loading state
      await waitFor(() => {
        expect(result.current.isEnhancingField).toBe(true)
        expect(result.current.isLoading).toBe(true)
      })

      // Wait for completion
      await enhancePromise

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isEnhancingField).toBe(false)
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
