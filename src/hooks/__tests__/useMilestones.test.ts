import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useMilestones } from '../useMilestones'
import { supabase, getCurrentUser } from '../../lib/supabase'
import { createMockMilestone, createMockUser } from '../../test/utils'

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn(),
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
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useMilestones', () => {
  const mockGetCurrentUser = vi.mocked(getCurrentUser)
  const mockUser = createMockUser()
  const mockMilestone = createMockMilestone()
  const letterId = 'test-letter-id'

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue(mockUser)
  })

  describe('hook interface', () => {
    it('should return milestone functions and loading state', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      expect(typeof result.current.createMilestones).toBe('function')
      expect(typeof result.current.updateMilestones).toBe('function')
      expect(typeof result.current.isLoading).toBe('boolean')
    })
  })

  describe('createMilestones', () => {
    it('should create milestones with correct data', async () => {
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [mockMilestone],
          error: null,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      const milestonesToCreate = [
        {
          letterId,
          title: 'Test Milestone',
          description: 'Test description',
          percentage: 50,
          target_date: '2024-06-01',
        },
      ]

      const createdMilestones = await result.current.createMilestones(milestonesToCreate)

      expect(supabase.from).toHaveBeenCalledWith('milestones')
      expect(mockFromChain.insert).toHaveBeenCalledWith([
        {
          title: 'Test Milestone',
          description: 'Test description',
          percentage: 50,
          target_date: '2024-06-01',
          letter_id: letterId,
          completed: false,
        },
      ])
      expect(createdMilestones).toEqual([mockMilestone])
    })

    it('should handle empty milestones array', async () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      const createdMilestones = await result.current.createMilestones([])

      expect(createdMilestones).toEqual([])
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('should handle create milestones errors', async () => {
      const mockError = new Error('Failed to create milestones')
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      await expect(
        result.current.createMilestones([
          {
            letterId,
            title: 'Test',
            description: 'Test',
            percentage: 0,
            target_date: '2024-06-01',
          },
        ])
      ).rejects.toThrow('Failed to create milestones')
    })

    it('should handle authentication errors', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      await expect(
        result.current.createMilestones([
          {
            letterId,
            title: 'Test',
            description: 'Test',
            percentage: 0,
            target_date: '2024-06-01',
          },
        ])
      ).rejects.toThrow('Not authenticated')
    })
  })

  describe('updateMilestones', () => {
    it('should update milestones by deleting old ones and creating new ones', async () => {
      const mockFromChainDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      const mockFromChainInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [mockMilestone],
          error: null,
        }),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockFromChainDelete as any)
        .mockReturnValueOnce(mockFromChainInsert as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      const milestonesToUpdate = [
        {
          letterId,
          title: 'Updated Milestone',
          description: 'Updated description',
          percentage: 75,
          target_date: '2024-07-01',
        },
      ]

      const updatedMilestones = await result.current.updateMilestones(letterId, milestonesToUpdate)

      // Should first delete existing milestones
      expect(mockFromChainDelete.delete).toHaveBeenCalled()
      expect(mockFromChainDelete.eq).toHaveBeenCalledWith('letter_id', letterId)

      // Then create new milestones
      expect(mockFromChainInsert.insert).toHaveBeenCalledWith([
        {
          title: 'Updated Milestone',
          description: 'Updated description',
          percentage: 75,
          target_date: '2024-07-01',
          letter_id: letterId,
          completed: false,
        },
      ])

      expect(updatedMilestones).toEqual([mockMilestone])
    })

    it('should handle empty milestones array in update', async () => {
      const mockFromChainDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockFromChainDelete as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      const updatedMilestones = await result.current.updateMilestones(letterId, [])

      // Should still delete existing milestones
      expect(mockFromChainDelete.delete).toHaveBeenCalled()
      expect(mockFromChainDelete.eq).toHaveBeenCalledWith('letter_id', letterId)

      // Should return empty array
      expect(updatedMilestones).toEqual([])
    })

    it('should handle delete errors during update', async () => {
      const mockError = new Error('Failed to delete milestones')
      const mockFromChainDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockFromChainDelete as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      await expect(
        result.current.updateMilestones(letterId, [
          {
            letterId,
            title: 'Test',
            description: 'Test',
            percentage: 0,
            target_date: '2024-06-01',
          },
        ])
      ).rejects.toThrow('Failed to delete milestones')
    })

    it('should handle insert errors during update', async () => {
      const mockFromChainDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      const mockError = new Error('Failed to insert milestones')
      const mockFromChainInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockFromChainDelete as any)
        .mockReturnValueOnce(mockFromChainInsert as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      await expect(
        result.current.updateMilestones(letterId, [
          {
            letterId,
            title: 'Test',
            description: 'Test',
            percentage: 0,
            target_date: '2024-06-01',
          },
        ])
      ).rejects.toThrow('Failed to insert milestones')
    })
  })

  describe('loading states', () => {
    it('should show loading state during operations', async () => {
      // Mock a delayed response
      const mockFromChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn(() =>
          new Promise(resolve => setTimeout(() => resolve({
            data: [mockMilestone],
            error: null,
          }), 100))
        ),
      }
      
      vi.mocked(supabase.from).mockReturnValue(mockFromChain as any)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useMilestones(), { wrapper })

      // Initial state should not be loading
      expect(result.current.isLoading).toBe(false)

      // Start creating milestones
      const createPromise = result.current.createMilestones([
        {
          letterId,
          title: 'Test',
          description: 'Test',
          percentage: 0,
          target_date: '2024-06-01',
        },
      ])

      // Should show loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Wait for completion
      await createPromise

      // Loading should be false after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
