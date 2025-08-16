import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LetterService } from '../letterService'
import { SupabaseLetterRepository } from '@/shared/services/repositories'
import { createMockLetter } from '@/test/utils'
import type { CreateLetterRequest } from '@/shared/services/repositories'
import type { Letter } from '@/shared/types/database'

// Mock the repository
vi.mock('@/shared/services/repositories')

describe('LetterService', () => {
  let letterService: LetterService
  let mockRepository: jest.Mocked<SupabaseLetterRepository>

  const mockLetter = createMockLetter({
    id: 'letter-123',
    title: 'Test Letter',
    content: 'Test content',
    goal: 'Test goal',
    user_id: 'user-123',
    send_date: '2024-12-31T00:00:00Z',
  })

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findByStatus: vi.fn(),
      updateStatus: vi.fn(),
      lock: vi.fn(),
      unlock: vi.fn(),
    } as jest.Mocked<SupabaseLetterRepository>

    vi.mocked(SupabaseLetterRepository).mockImplementation(() => mockRepository)
    letterService = new LetterService(mockRepository)
  })

  describe('Letter Validation', () => {
    const validLetterData: Partial<CreateLetterRequest> = {
      title: 'Valid Title',
      content: 'Valid content',
      goal: 'Valid goal',
      send_date: '2024-12-31T00:00:00Z',
      user_id: 'user-123',
    }

    it('should validate a complete letter successfully', async () => {
      const result = await letterService.validateLetter(validLetterData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require title', async () => {
      const invalidData = { ...validLetterData, title: '' }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required')
    })

    it('should require title (whitespace only)', async () => {
      const invalidData = { ...validLetterData, title: '   ' }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required')
    })

    it('should require content', async () => {
      const invalidData = { ...validLetterData, content: '' }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content is required')
    })

    it('should require goal', async () => {
      const invalidData = { ...validLetterData, goal: undefined }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Goal is required')
    })

    it('should require send_date', async () => {
      const invalidData = { ...validLetterData, send_date: '' }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Send date is required')
    })

    it('should require user_id', async () => {
      const invalidData = { ...validLetterData, user_id: '' }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User ID is required')
    })

    it('should collect multiple validation errors', async () => {
      const invalidData = {
        title: '',
        content: '',
        goal: '',
        send_date: '',
        user_id: '',
      }
      const result = await letterService.validateLetter(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(5)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'Title is required',
          'Content is required',
          'Goal is required',
          'Send date is required',
          'User ID is required',
        ])
      )
    })

    it('should handle missing fields gracefully', async () => {
      const result = await letterService.validateLetter({})

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(5)
    })
  })

  describe('Create Letter', () => {
    const validCreateRequest: CreateLetterRequest = {
      title: 'New Letter',
      content: 'Letter content',
      goal: 'Letter goal',
      send_date: '2024-12-31T00:00:00Z',
      user_id: 'user-123',
    }

    it('should create a letter successfully', async () => {
      mockRepository.create.mockResolvedValue(mockLetter)

      const result = await letterService.createLetter(validCreateRequest)

      expect(mockRepository.create).toHaveBeenCalledWith(validCreateRequest)
      expect(result).toEqual(mockLetter)
    })

    it('should validate before creating', async () => {
      const invalidRequest = { ...validCreateRequest, title: '' }

      await expect(letterService.createLetter(invalidRequest)).rejects.toThrow(
        'Title is required'
      )

      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should include all validation errors in exception', async () => {
      const invalidRequest: CreateLetterRequest = {
        title: '',
        content: '',
        goal: '',
        send_date: '',
        user_id: '',
      }

      await expect(letterService.createLetter(invalidRequest)).rejects.toThrow(
        'Title is required, Content is required, Goal is required, Send date is required, User ID is required'
      )
    })

    it('should propagate repository errors', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database error'))

      await expect(letterService.createLetter(validCreateRequest)).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('Update Letter', () => {
    const letterId = 'letter-123'
    const updateData: Partial<Letter> = {
      title: 'Updated Title',
      content: 'Updated content',
    }

    it('should update a letter successfully', async () => {
      const updatedLetter = { ...mockLetter, ...updateData }
      mockRepository.update.mockResolvedValue(updatedLetter)

      const result = await letterService.updateLetter(letterId, updateData)

      expect(mockRepository.update).toHaveBeenCalledWith(letterId, updateData)
      expect(result).toEqual(updatedLetter)
    })

    it('should handle partial updates', async () => {
      const partialUpdate = { title: 'Only Title Updated' }
      const updatedLetter = { ...mockLetter, ...partialUpdate }
      mockRepository.update.mockResolvedValue(updatedLetter)

      const result = await letterService.updateLetter(letterId, partialUpdate)

      expect(mockRepository.update).toHaveBeenCalledWith(letterId, partialUpdate)
      expect(result.title).toBe('Only Title Updated')
      expect(result.content).toBe(mockLetter.content) // Unchanged
    })

    it('should propagate repository errors', async () => {
      mockRepository.update.mockRejectedValue(new Error('Update failed'))

      await expect(letterService.updateLetter(letterId, updateData)).rejects.toThrow(
        'Update failed'
      )
    })
  })

  describe('Delete Letter', () => {
    const letterId = 'letter-123'

    it('should delete a letter successfully', async () => {
      mockRepository.delete.mockResolvedValue()

      await letterService.deleteLetter(letterId)

      expect(mockRepository.delete).toHaveBeenCalledWith(letterId)
    })

    it('should propagate repository errors', async () => {
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(letterService.deleteLetter(letterId)).rejects.toThrow(
        'Delete failed'
      )
    })
  })

  describe('Get Letter By ID', () => {
    const letterId = 'letter-123'

    it('should return a letter when found', async () => {
      mockRepository.findById.mockResolvedValue(mockLetter)

      const result = await letterService.getLetterById(letterId)

      expect(mockRepository.findById).toHaveBeenCalledWith(letterId)
      expect(result).toEqual(mockLetter)
    })

    it('should return null when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await letterService.getLetterById(letterId)

      expect(result).toBeNull()
    })

    it('should propagate repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Find failed'))

      await expect(letterService.getLetterById(letterId)).rejects.toThrow(
        'Find failed'
      )
    })
  })

  describe('Get User Letters', () => {
    const userId = 'user-123'

    it('should return user letters', async () => {
      const userLetters = [mockLetter, { ...mockLetter, id: 'letter-456' }]
      mockRepository.findAll.mockResolvedValue(userLetters)

      const result = await letterService.getUserLetters(userId)

      expect(mockRepository.findAll).toHaveBeenCalledWith(userId)
      expect(result).toEqual(userLetters)
    })

    it('should return empty array when no letters found', async () => {
      mockRepository.findAll.mockResolvedValue([])

      const result = await letterService.getUserLetters(userId)

      expect(result).toEqual([])
    })

    it('should propagate repository errors', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Find all failed'))

      await expect(letterService.getUserLetters(userId)).rejects.toThrow(
        'Find all failed'
      )
    })
  })

  describe('Get Letters By Status', () => {
    const userId = 'user-123'
    const status: Letter['status'] = 'draft'

    it('should return letters with specified status', async () => {
      const draftLetters = [
        { ...mockLetter, status: 'draft' },
        { ...mockLetter, id: 'letter-456', status: 'draft' },
      ]
      mockRepository.findByStatus.mockResolvedValue(draftLetters)

      const result = await letterService.getLettersByStatus(userId, status)

      expect(mockRepository.findByStatus).toHaveBeenCalledWith(userId, status)
      expect(result).toEqual(draftLetters)
    })

    it('should handle different status values', async () => {
      const statuses: Letter['status'][] = ['draft', 'scheduled', 'sent', 'archived']

      for (const testStatus of statuses) {
        mockRepository.findByStatus.mockResolvedValue([])
        
        await letterService.getLettersByStatus(userId, testStatus)
        
        expect(mockRepository.findByStatus).toHaveBeenCalledWith(userId, testStatus)
      }
    })

    it('should propagate repository errors', async () => {
      mockRepository.findByStatus.mockRejectedValue(new Error('Status search failed'))

      await expect(
        letterService.getLettersByStatus(userId, status)
      ).rejects.toThrow('Status search failed')
    })
  })

  describe('Update Letter Status', () => {
    const letterId = 'letter-123'
    const newStatus: Letter['status'] = 'sent'

    it('should update letter status successfully', async () => {
      const updatedLetter = { ...mockLetter, status: newStatus }
      mockRepository.updateStatus.mockResolvedValue(updatedLetter)

      const result = await letterService.updateLetterStatus(letterId, newStatus)

      expect(mockRepository.updateStatus).toHaveBeenCalledWith(letterId, newStatus)
      expect(result).toEqual(updatedLetter)
      expect(result.status).toBe(newStatus)
    })

    it('should handle all valid status transitions', async () => {
      const statuses: Letter['status'][] = ['draft', 'scheduled', 'sent', 'archived']

      for (const status of statuses) {
        const updatedLetter = { ...mockLetter, status }
        mockRepository.updateStatus.mockResolvedValue(updatedLetter)

        const result = await letterService.updateLetterStatus(letterId, status)
        expect(result.status).toBe(status)
      }
    })

    it('should propagate repository errors', async () => {
      mockRepository.updateStatus.mockRejectedValue(new Error('Status update failed'))

      await expect(
        letterService.updateLetterStatus(letterId, newStatus)
      ).rejects.toThrow('Status update failed')
    })
  })

  describe('Lock Letter', () => {
    const letterId = 'letter-123'

    it('should lock a letter successfully', async () => {
      const lockedLetter = { ...mockLetter, is_locked: true }
      mockRepository.lock.mockResolvedValue(lockedLetter)

      const result = await letterService.lockLetter(letterId)

      expect(mockRepository.lock).toHaveBeenCalledWith(letterId)
      expect(result).toEqual(lockedLetter)
      expect(result.is_locked).toBe(true)
    })

    it('should propagate repository errors', async () => {
      mockRepository.lock.mockRejectedValue(new Error('Lock failed'))

      await expect(letterService.lockLetter(letterId)).rejects.toThrow('Lock failed')
    })
  })

  describe('Unlock Letter', () => {
    const letterId = 'letter-123'

    it('should unlock a letter successfully', async () => {
      const unlockedLetter = { ...mockLetter, is_locked: false }
      mockRepository.unlock.mockResolvedValue(unlockedLetter)

      const result = await letterService.unlockLetter(letterId)

      expect(mockRepository.unlock).toHaveBeenCalledWith(letterId)
      expect(result).toEqual(unlockedLetter)
      expect(result.is_locked).toBe(false)
    })

    it('should propagate repository errors', async () => {
      mockRepository.unlock.mockRejectedValue(new Error('Unlock failed'))

      await expect(letterService.unlockLetter(letterId)).rejects.toThrow('Unlock failed')
    })
  })

  describe('Integration with Repository', () => {
    it('should be constructed with repository dependency', () => {
      expect(letterService).toBeInstanceOf(LetterService)
      expect(vi.mocked(SupabaseLetterRepository)).toHaveBeenCalled()
    })

    it('should use the same repository instance for all operations', async () => {
      mockRepository.create.mockResolvedValue(mockLetter)
      mockRepository.findById.mockResolvedValue(mockLetter)
      mockRepository.update.mockResolvedValue(mockLetter)

      const createRequest: CreateLetterRequest = {
        title: 'Test',
        content: 'Test',
        goal: 'Test',
        send_date: '2024-01-01',
        user_id: 'user-123',
      }

      await letterService.createLetter(createRequest)
      await letterService.getLetterById('test-id')
      await letterService.updateLetter('test-id', { title: 'Updated' })

      // All calls should be on the same repository instance
      expect(mockRepository.create).toHaveBeenCalled()
      expect(mockRepository.findById).toHaveBeenCalled()
      expect(mockRepository.update).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined values in validation', async () => {
      const dataWithUndefined = {
        title: undefined,
        content: undefined,
        goal: undefined,
        send_date: undefined,
        user_id: undefined,
      }

      const result = await letterService.validateLetter(dataWithUndefined)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(5)
    })

    it('should trim whitespace in validation', async () => {
      const dataWithWhitespace: Partial<CreateLetterRequest> = {
        title: '  ',
        content: ' \n \t ',
        goal: '   ',
      }

      const result = await letterService.validateLetter(dataWithWhitespace)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required')
      expect(result.errors).toContain('Content is required')
      expect(result.errors).toContain('Goal is required')
    })

    it('should handle empty objects in updates', async () => {
      const updatedLetter = { ...mockLetter }
      mockRepository.update.mockResolvedValue(updatedLetter)

      const result = await letterService.updateLetter('letter-123', {})

      expect(mockRepository.update).toHaveBeenCalledWith('letter-123', {})
      expect(result).toEqual(updatedLetter)
    })

    it('should handle null values from repository', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await letterService.getLetterById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should preserve error details from repository', async () => {
      const originalError = new Error('Specific database error')
      mockRepository.create.mockRejectedValue(originalError)

      const validRequest: CreateLetterRequest = {
        title: 'Valid Title',
        content: 'Valid content',
        goal: 'Valid goal',
        send_date: '2024-01-01',
        user_id: 'user-123',
      }

      await expect(letterService.createLetter(validRequest)).rejects.toThrow(
        'Specific database error'
      )
    })

    it('should not mask validation errors with repository errors', async () => {
      // This shouldn't happen since validation runs first
      mockRepository.create.mockRejectedValue(new Error('Should not be called'))

      const invalidRequest: CreateLetterRequest = {
        title: '',
        content: '',
        goal: '',
        send_date: '',
        user_id: '',
      }

      await expect(letterService.createLetter(invalidRequest)).rejects.toThrow(
        /Title is required/
      )
      expect(mockRepository.create).not.toHaveBeenCalled()
    })
  })
})
