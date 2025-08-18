import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useLetters } from '../useLetters'
import { supabase, getCurrentUser } from '../../lib/supabase'
import { createMockLetter, createMockUser } from '../../test/utils'
import { format, addDays, addMonths } from 'date-fns'

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
  getCurrentUser: vi.fn(),
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
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLetters', () => {
  const mockGetCurrentUser = vi.mocked(getCurrentUser)
  const mockUser = createMockUser()
  const mockLetter = createMockLetter()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue(mockUser)
  })

  describe('query operations', () => {
    it('should return letters query functions and state', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      expect(Array.isArray(result.current.letters)).toBe(true)
      expect(typeof result.current.isLoading).toBe('boolean')
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should fetch letters for current user', async () => {
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockLetter],
          error: null,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      await waitFor(() => {
        expect(result.current.letters).toEqual([mockLetter])
      })

      expect(supabase.from).toHaveBeenCalledWith('letters')
      expect(mockFromChain.eq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(mockFromChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('mutation operations', () => {
    it('should return mutation functions', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      expect(typeof result.current.createLetter).toBe('function')
      expect(typeof result.current.updateLetter).toBe('function')
      expect(typeof result.current.deleteLetter).toBe('function')
    })

    it('should create letter with correct data', async () => {
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockLetter,
          error: null,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      const createData = {
        title: 'New Letter',
        goal: 'Test Goal',
        content: 'Test Content',
        send_date: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
      }

      const createdLetter = await result.current.createLetter(createData)

      expect(mockFromChain.insert).toHaveBeenCalledWith({
        ...createData,
        user_id: mockUser.id,
        status: 'draft',
        ai_enhanced: false,
        is_locked: false,
      })
      expect(createdLetter).toEqual(mockLetter)
    })

    it('should update letter with correct data', async () => {
      const updatedLetter = { ...mockLetter, title: 'Updated Title' }
      const mockFromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedLetter,
          error: null,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      const updateData = { title: 'Updated Title' }
      const updatedResult = await result.current.updateLetter(mockLetter.id, updateData)

      expect(mockFromChain.update).toHaveBeenCalledWith(updateData)
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', mockLetter.id)
      expect(updatedResult).toEqual(updatedLetter)
    })

    it('should delete letter', async () => {
      const mockFromChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      await result.current.deleteLetter(mockLetter.id)

      expect(mockFromChain.delete).toHaveBeenCalled()
      expect(mockFromChain.eq).toHaveBeenCalledWith('id', mockLetter.id)
    })
  })

  describe('error handling', () => {
    it('should handle query errors', async () => {
      const mockError = new Error('Failed to fetch letters')
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch letters')
      })
    })

    it('should handle create letter errors', async () => {
      const mockError = new Error('Failed to create letter')
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      await expect(
        result.current.createLetter({
          title: 'Test',
          goal: 'Test',
          content: 'Test',
          send_date: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        })
      ).rejects.toThrow('Failed to create letter')
    })

    it('should handle update letter errors', async () => {
      const mockError = new Error('Failed to update letter')
      const mockFromChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      await expect(
        result.current.updateLetter(mockLetter.id, { title: 'Updated' })
      ).rejects.toThrow('Failed to update letter')
    })

    it('should handle authentication errors', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useLetters(), { wrapper })

      await expect(
        result.current.createLetter({
          title: 'Test',
          goal: 'Test',
          content: 'Test',
          send_date: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
        })
      ).rejects.toThrow('Not authenticated')
    })
  })
})
