import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { LetterCard } from '@/components/LetterCard'
import { createMockLetter, createMockMilestone } from '@/test/utils'
import { format, addDays, addMonths } from 'date-fns'

describe('LetterCard', () => {
  const mockHandlers = {
    onEdit: vi.fn(),
    onView: vi.fn(),
    onStatusChange: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders letter title and goal', () => {
      const mockLetter = createMockLetter({
        title: 'My Future Goals',
        goal: 'Learn React and TypeScript',
        status: 'draft',
      })

      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('My Future Goals')).toBeInTheDocument()
      expect(screen.getByText('Learn React and TypeScript')).toBeInTheDocument()
    })

    it('renders send date in correct format', () => {
      const futureSendDate = format(addDays(new Date(), 90), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const mockLetter = createMockLetter({
        send_date: futureSendDate,
      })

      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Check that the date is rendered in the expected format
      const expectedDateText = format(addDays(new Date(), 90), 'MMM dd, yyyy')
      expect(screen.getByText(new RegExp(expectedDateText))).toBeInTheDocument()
    })

    it('renders creation date in correct format', () => {
      const pastCreationDate = format(addDays(new Date(), -30), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const mockLetter = createMockLetter({
        created_at: pastCreationDate,
      })

      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const expectedDateText = format(addDays(new Date(), -30), 'MMM dd')
      expect(screen.getByText(new RegExp(expectedDateText))).toBeInTheDocument()
    })
  })

  describe('Status Management', () => {
    it('renders draft status correctly', () => {
      const mockLetter = createMockLetter({ status: 'draft' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('renders sent status correctly', () => {
      const mockLetter = createMockLetter({ status: 'sent' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    it('renders archived status correctly', () => {
      const mockLetter = createMockLetter({ status: 'archived' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Archived')).toBeInTheDocument()
    })
  })

  describe('Progress Tracking', () => {
    it('displays progress when milestones exist', () => {
      const milestones = [
        createMockMilestone({ completed: true }),
        createMockMilestone({ completed: false }),
        createMockMilestone({ completed: true }),
      ]
      
      const mockLetter = createMockLetter({ milestones })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('67%')).toBeInTheDocument() // 2 out of 3 completed
    })

    it('hides progress when no milestones exist', () => {
      const mockLetter = createMockLetter({ milestones: [] })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    })
  })
})
