import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { MilestoneManager } from '../MilestoneManager'
import { createMockMilestone } from '@/test/utils'
import { format, addDays, addMonths } from 'date-fns'
// Mock the hooks
const mockInferMilestones = vi.fn()

vi.mock('../../hooks/useEnhancement', () => ({
  useEnhancement: () => ({
    inferMilestones: mockInferMilestones,
    isInferringMilestones: false,
  }),
}))

describe('MilestoneManager', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    onChange: mockOnChange,
    goal: 'Learn to code and build awesome projects',
    content: 'I want to become a full-stack developer and work at a tech company',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render milestone section with header', () => {
      render(<MilestoneManager {...defaultProps} />)

      expect(screen.getByText('Milestones')).toBeInTheDocument()
    })

    it('should show inference button when sufficient content is provided', () => {
      render(<MilestoneManager {...defaultProps} />)

      expect(screen.getByRole('button', { name: /suggest milestones/i })).toBeInTheDocument()
    })

    it('should show manual milestone input', () => {
      render(<MilestoneManager {...defaultProps} />)

      expect(screen.getByPlaceholderText(/add a custom milestone/i)).toBeInTheDocument()
    })
  })

  describe('Milestone inference', () => {
    it('should call inferMilestones with correct parameters', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestedMilestones: [
          { text: 'Learn HTML/CSS', reasoning: 'Basic web markup' },
          { text: 'Learn JavaScript', reasoning: 'Programming fundamentals' },
        ]
      }

      mockInferMilestones.mockResolvedValue(mockResponse)

      render(<MilestoneManager {...defaultProps} />)

      const suggestButton = screen.getByRole('button', { name: /suggest milestones/i })
      await user.click(suggestButton)

      expect(mockInferMilestones).toHaveBeenCalledWith({
        goal: defaultProps.goal,
        content: defaultProps.content,
        title: undefined,
      })
    })

    it('should handle inference error gracefully', async () => {
      const user = userEvent.setup()

      mockInferMilestones.mockRejectedValue(new Error('Inference failed'))

      render(<MilestoneManager {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /suggest milestones/i }))

      // Should not throw error (error handled by hook)
      await waitFor(() => {
        expect(screen.queryByText(/suggested milestones/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Manual milestone management', () => {
    it('should add manual milestone when entering text and pressing enter', async () => {
      const user = userEvent.setup()

      render(<MilestoneManager {...defaultProps} />)

      const input = screen.getByPlaceholderText(/add a custom milestone/i)
      await user.type(input, 'Learn React basics')
      await user.keyboard('{Enter}')

      // Check that onChange was called with new milestone
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'Learn React basics',
            isInferred: false,
          })
        ])
      )
    })

    it('should not add empty milestones', async () => {
      const user = userEvent.setup()

      render(<MilestoneManager {...defaultProps} />)

      // Reset mock after initial mounting call
      mockOnChange.mockClear()

      const input = screen.getByPlaceholderText(/add a custom milestone/i)
      await user.type(input, '   ')
      await user.keyboard('{Enter}')

      // Should not have been called after the Enter key press
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Displaying existing milestones', () => {
    it('should render existing milestones correctly', () => {
      const milestone1Date = format(addDays(new Date(), 30), 'yyyy-MM-dd')
      const milestone2Date = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      const existingMilestones = [
        { id: '1', text: 'Learn HTML', dueDate: milestone1Date, isInferred: false },
        { id: '2', text: 'Learn CSS', dueDate: milestone2Date, isInferred: true },
      ]

      render(
        <MilestoneManager {...defaultProps} initialMilestones={existingMilestones} />
      )

      expect(screen.getByText('Learn HTML')).toBeInTheDocument()
      expect(screen.getByText('Learn CSS')).toBeInTheDocument()
      expect(screen.getByDisplayValue(milestone1Date)).toBeInTheDocument()
      expect(screen.getByDisplayValue(milestone2Date)).toBeInTheDocument()
    })

    it('should not show suggest button when milestones already exist', () => {
      const milestoneDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')
      const existingMilestones = [
        { id: '1', text: 'Existing milestone', dueDate: milestoneDate, isInferred: false }
      ]

      render(
        <MilestoneManager {...defaultProps} initialMilestones={existingMilestones} />
      )

      expect(screen.queryByRole('button', { name: /suggest milestones/i })).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('should show appropriate message when no milestones and insufficient content', () => {
      const propsWithLittleContent = {
        ...defaultProps,
        goal: 'Code',
        content: 'Learn',
      }

      render(<MilestoneManager {...propsWithLittleContent} />)

      expect(screen.getByText(/add some goals and content above/i)).toBeInTheDocument()
    })
  })

  describe('Integration with context', () => {
    it('should not show suggest button without sufficient content', () => {
      const propsWithoutContent = {
        ...defaultProps,
        goal: 'Short',
        content: 'Too short',
      }

      render(<MilestoneManager {...propsWithoutContent} />)

      expect(screen.queryByRole('button', { name: /suggest milestones/i })).not.toBeInTheDocument()
    })
  })
})
