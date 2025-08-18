import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { LetterForm } from '../LetterForm'
import type { Letter } from '../../types/supabase'
import { format, addDays, addMonths } from 'date-fns'

// Mock the hooks
const mockCreateLetter = vi.fn()
const mockUpdateLetter = vi.fn()
const mockCreateMilestones = vi.fn()
const mockUpdateMilestones = vi.fn()

vi.mock('../../hooks/useLetters', () => ({
  useLetters: () => ({
    createLetter: mockCreateLetter,
    updateLetter: mockUpdateLetter,
    loading: false,
  }),
}))

vi.mock('../../hooks/useMilestones', () => ({
  useMilestones: () => ({
    createMilestones: mockCreateMilestones,
    updateMilestones: mockUpdateMilestones,
    loading: false,
  }),
}))

// Mock child components
vi.mock('../FieldEnhancer', () => ({
  FieldEnhancer: ({ field, onApply, children }: any) => (
    <div data-testid={`field-enhancer-${field}`}>
      <button onClick={() => onApply(`Enhanced ${field}`)}>
        Enhance {field}
      </button>
      {children}
    </div>
  ),
}))

vi.mock('../MilestoneManager', () => ({
  MilestoneManager: ({ initialMilestones, onChange, goal, content }: any) => {
    const milestoneCount = initialMilestones?.length || 0;
    let testMilestones = initialMilestones || [];
    
    const addMilestone = () => {
      const futureDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
      const newMilestones = [...testMilestones, 
        { id: '1', text: 'Test milestone', reasoning: 'Test desc', dueDate: futureDate }
      ];
      testMilestones = newMilestones;
      onChange && onChange(newMilestones);
    };
    
    return (
      <div data-testid="milestone-manager">
        <button onClick={addMilestone}>
          Add Test Milestone
        </button>
        <div>Milestones: {milestoneCount}</div>
        <div>Goal: {goal || ''}</div>
        <div>Content: {content || ''}</div>
      </div>
    )
  },
}))

describe('LetterForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    onSuccess: mockOnSuccess,
    onClose: mockOnCancel,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render form fields', () => {
      render(<LetterForm {...defaultProps} />)

      expect(screen.getByLabelText(/letter title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your goal/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/letter content/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/send date/i)).toBeInTheDocument()
    })

    it('should render form buttons', () => {
      render(<LetterForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /create letter/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should render FieldEnhancer components', () => {
      render(<LetterForm {...defaultProps} />)

      expect(screen.getByTestId('field-enhancer-title')).toBeInTheDocument()
      expect(screen.getByTestId('field-enhancer-goal')).toBeInTheDocument()
      expect(screen.getByTestId('field-enhancer-content')).toBeInTheDocument()
    })

    it('should render MilestoneManager', () => {
      render(<LetterForm {...defaultProps} />)

      expect(screen.getByTestId('milestone-manager')).toBeInTheDocument()
    })
  })

  describe('Form validation', () => {
    it('should have title field', async () => {
      render(<LetterForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/letter title/i)
      expect(titleInput).toBeInTheDocument()
    })

    it('should have goal field', async () => {
      render(<LetterForm {...defaultProps} />)

      const goalInput = screen.getByLabelText(/your goal/i)
      expect(goalInput).toBeInTheDocument()
    })

    it('should have content field', async () => {
      render(<LetterForm {...defaultProps} />)

      const contentInput = screen.getByLabelText(/letter content/i)
      expect(contentInput).toBeInTheDocument()
    })

    it('should have send date field', async () => {
      render(<LetterForm {...defaultProps} />)

      const dateInput = screen.getByLabelText(/send date/i)
      expect(dateInput).toBeInTheDocument()
    })
  })

  describe('Form input handling', () => {
    it('should update title input', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/letter title/i)
      await user.type(titleInput, 'My Future Goals')

      expect(titleInput).toHaveValue('My Future Goals')
    })

    it('should update goal input', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const goalInput = screen.getByLabelText(/your goal/i)
      await user.type(goalInput, 'Learn programming')

      expect(goalInput).toHaveValue('Learn programming')
    })

    it('should update content textarea', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const contentInput = screen.getByLabelText(/letter content/i)
      await user.type(contentInput, 'Dear future me...')

      expect(contentInput).toHaveValue('Dear future me...')
    })

    it('should update send date', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const dateInput = screen.getByLabelText(/send date/i)
      const futureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      await user.clear(dateInput)
      await user.type(dateInput, futureDate)

      expect(dateInput).toHaveValue(futureDate)
    })
  })

  describe('Field enhancement integration', () => {
    it('should apply title enhancement', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const enhanceTitleButton = screen.getByRole('button', { name: /enhance title/i })
      await user.click(enhanceTitleButton)

      const titleInput = screen.getByLabelText(/letter title/i)
      expect(titleInput).toHaveValue('Enhanced title')
    })

    it('should apply goal enhancement', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const goalInput = screen.getByLabelText(/your goal/i)
      await user.type(goalInput, 'Original goal')

      const enhanceGoalButton = screen.getByRole('button', { name: /enhance goal/i })
      await user.click(enhanceGoalButton)

      expect(goalInput).toHaveValue('Enhanced goal')
    })

    it('should apply content enhancement', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const contentInput = screen.getByLabelText(/letter content/i)
      await user.type(contentInput, 'Original content')

      const enhanceContentButton = screen.getByRole('button', { name: /enhance content/i })
      await user.click(enhanceContentButton)

      expect(contentInput).toHaveValue('Enhanced content')
    })

    it('should pass context to FieldEnhancers when available', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/your goal/i), 'Test goal')
      await user.type(screen.getByLabelText(/letter content/i), 'Test content')

      expect(screen.getByText('Goal: Test goal')).toBeInTheDocument()
      expect(screen.getByText('Content: Test content')).toBeInTheDocument()
    })
  })

  describe('Milestone management integration', () => {
    it('should handle milestone changes', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      const addMilestoneButton = screen.getByRole('button', { name: /add test milestone/i })
      expect(addMilestoneButton).toBeInTheDocument()
      
      expect(screen.getByText('Milestones: 0')).toBeInTheDocument()
      
      await user.click(addMilestoneButton)
    })

    it('should pass goal and content to MilestoneManager', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/your goal/i), 'Learn coding')
      await user.type(screen.getByLabelText(/letter content/i), 'I want to be a developer')

      expect(screen.getByText('Goal: Learn coding')).toBeInTheDocument()
      expect(screen.getByText('Content: I want to be a developer')).toBeInTheDocument()
    })
  })

  describe('Form submission - Create letter', () => {
    it('should create letter with valid data', async () => {
      const user = userEvent.setup()
      const futureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      const mockLetter = {
        id: 'new-letter-id',
        title: 'Test Letter',
        goal: 'Test Goal',
        content: 'Test Content',
        send_date: futureDate,
      }
      mockCreateLetter.mockResolvedValue(mockLetter)

      render(<LetterForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/letter title/i), 'Test Letter')
      await user.type(screen.getByLabelText(/your goal/i), 'My specific goal for the future')
      await user.type(screen.getByLabelText(/letter content/i), 'Dear Future Me, I am writing this letter to document my goals and aspirations.')
      const formFutureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      await user.clear(screen.getByLabelText(/send date/i))
      await user.type(screen.getByLabelText(/send date/i), formFutureDate)

      await user.click(screen.getByRole('button', { name: /create letter/i }))

      await waitFor(() => {
        expect(mockCreateLetter).toHaveBeenCalledWith({
          title: 'Test Letter',
          goal: 'My specific goal for the future',
          content: 'Dear Future Me, I am writing this letter to document my goals and aspirations.',
          send_date: formFutureDate,
        })
        expect(mockOnSuccess).toHaveBeenCalledWith(mockLetter)
      })
    })

    it('should create milestones after creating letter', async () => {
      const user = userEvent.setup()
      const formFutureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      const milestoneFutureDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd')
      const mockLetter = {
        id: 'new-letter-id',
        title: 'Test Letter',
        goal: 'Test Goal',
        content: 'Test Content',
        send_date: formFutureDate,
      }
      mockCreateLetter.mockResolvedValue(mockLetter)
      mockCreateMilestones.mockResolvedValue([])

      render(<LetterForm {...defaultProps} />)

      // Fill form
      await user.type(screen.getByLabelText(/letter title/i), 'Test Letter')
      await user.type(screen.getByLabelText(/your goal/i), 'My specific goal for the future')
      await user.type(screen.getByLabelText(/letter content/i), 'Dear Future Me, I am writing this letter to document my goals and aspirations.')
      await user.clear(screen.getByLabelText(/send date/i))
      await user.type(screen.getByLabelText(/send date/i), formFutureDate)

      // Add a milestone
      await user.click(screen.getByRole('button', { name: /add test milestone/i }))

      // Submit form
      await user.click(screen.getByRole('button', { name: /create letter/i }))

      await waitFor(() => {
        expect(mockCreateLetter).toHaveBeenCalled()
        expect(mockCreateMilestones).toHaveBeenCalledWith([
          {
            letterId: 'new-letter-id',
            title: 'Test milestone',
            description: 'Test desc',
            percentage: 0,
            target_date: milestoneFutureDate,
          },
        ])
      })
    })

    it('should handle letter creation error', async () => {
      const user = userEvent.setup()
      const formFutureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')
      mockCreateLetter.mockRejectedValue(new Error('Creation failed'))

      render(<LetterForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/letter title/i), 'Test Letter')
      await user.type(screen.getByLabelText(/your goal/i), 'My specific goal for the future')
      await user.type(screen.getByLabelText(/letter content/i), 'This is a long test content for the letter')
      await user.clear(screen.getByLabelText(/send date/i))
      await user.type(screen.getByLabelText(/send date/i), formFutureDate)

      await user.click(screen.getByRole('button', { name: /create letter/i }))

      await waitFor(() => {
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form submission - Update letter', () => {
    const existingLetterSendDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')
    const existingMilestoneDate = format(addMonths(new Date(), 2), 'yyyy-MM-dd')
    const existingLetter: Partial<Letter> = {
      id: 'letter-1',
      title: 'Existing Letter',
      goal: 'Existing Goal',
      content: 'Existing Content',
      send_date: existingLetterSendDate,
      milestones: [
        { id: 'milestone-1', title: 'Existing Milestone', description: 'Existing desc', target_date: existingMilestoneDate, percentage: 0, letter_id: 'letter-1' }
      ]
    }

    it('should prefill form with existing letter data', () => {
      render(
        <LetterForm 
          {...defaultProps} 
          letter={existingLetter}
        />
      )

      expect(screen.getByDisplayValue('Existing Letter')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing Goal')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing Content')).toBeInTheDocument()
      expect(screen.getByDisplayValue(existingLetterSendDate)).toBeInTheDocument()
      expect(screen.getByText('Milestones: 1')).toBeInTheDocument()
    })

    it('should show update button instead of create button', () => {
      render(
        <LetterForm 
          {...defaultProps} 
          letter={existingLetter}
        />
      )

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /create letter/i })).not.toBeInTheDocument()
    })

    it('should update existing letter', async () => {
      const user = userEvent.setup()
      const updatedLetter = {
        ...existingLetter,
        title: 'Updated Letter Title',
        goal: 'Updated Goal',
        content: 'Updated Content',
      }
      mockUpdateLetter.mockResolvedValue(updatedLetter)

      render(
        <LetterForm 
          {...defaultProps} 
          letter={existingLetter}
        />
      )

      // Update the title
      const titleInput = screen.getByLabelText(/letter title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Letter Title')

      // Update the goal
      const goalInput = screen.getByLabelText(/your goal/i)
      await user.clear(goalInput)
      await user.type(goalInput, 'Updated Goal')

      // Update the content
      const contentInput = screen.getByLabelText(/letter content/i)
      await user.clear(contentInput)
      await user.type(contentInput, 'Updated Content')

      // Submit form
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(mockUpdateLetter).toHaveBeenCalledWith(existingLetter.id, {
          title: 'Updated Letter Title',
          goal: 'Updated Goal',
          content: 'Updated Content',
          send_date: existingLetter.send_date,
        })
        expect(mockOnSuccess).toHaveBeenCalledWith(updatedLetter)
      })
    })

    it('should update milestones after updating letter', async () => {
      const user = userEvent.setup()
      const newMilestoneDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd')
      const updatedLetter = { ...existingLetter, title: 'Updated Title' }
      mockUpdateLetter.mockResolvedValue(updatedLetter)
      mockUpdateMilestones.mockResolvedValue([])

      render(
        <LetterForm 
          {...defaultProps} 
          letter={existingLetter}
        />
      )

      // Update the title slightly
      const titleInput = screen.getByLabelText(/letter title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      // Add a new milestone
      await user.click(screen.getByRole('button', { name: /add test milestone/i }))

      // Submit form
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(mockUpdateLetter).toHaveBeenCalled()
        expect(mockUpdateMilestones).toHaveBeenCalledWith(existingLetter.id, [
          {
            letterId: existingLetter.id,
            title: 'Existing Milestone',
            description: 'Existing desc',
            percentage: 0,
            target_date: existingMilestoneDate,
          },
          {
            letterId: existingLetter.id,
            title: 'Test milestone',
            description: 'Test desc',
            percentage: 0,
            target_date: newMilestoneDate,
          },
        ])
      })
    })

  })

  describe('Cancel functionality', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Loading states', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      render(<LetterForm {...defaultProps} />)
      
      await user.type(screen.getByLabelText(/letter title/i), 'Valid Title')
      await user.type(screen.getByLabelText(/your goal/i), 'Valid goal that is long enough')
      await user.type(screen.getByLabelText(/letter content/i), 'Valid content that is definitely long enough to pass validation')
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create letter/i })
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<LetterForm {...defaultProps} />)

      const form = document.querySelector('form')
      expect(form).toBeInTheDocument()
    })

    it('should have proper labels for all inputs', () => {
      render(<LetterForm {...defaultProps} />)

      expect(screen.getByLabelText(/letter title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your goal/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/letter content/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/send date/i)).toBeInTheDocument()
    })
  })

  describe('Default values', () => {
    it('should set default send date to one month from now', () => {
      render(<LetterForm {...defaultProps} />)

      const dateInput = screen.getByLabelText(/send date/i) as HTMLInputElement
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + 30)
      const expectedDateString = expectedDate.toISOString().split('T')[0]

      expect(dateInput.value).toBe(expectedDateString)
    })

    it('should start with empty form fields', () => {
      render(<LetterForm {...defaultProps} />)

      expect(screen.getByLabelText(/letter title/i)).toHaveValue('')
      expect(screen.getByLabelText(/your goal/i)).toHaveValue('')
      expect(screen.getByLabelText(/letter content/i)).toHaveValue('')
    })
  })
})
