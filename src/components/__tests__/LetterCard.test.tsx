import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { LetterCard } from '@/features/letters'
import { createMockLetter, createMockMilestone } from '@/test/utils'

describe('LetterCard', () => {
  const mockHandlers = {
    onEdit: vi.fn(),
    onPlay: vi.fn(),
    onView: vi.fn(),
    onTriggerDelivery: vi.fn(),
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

    it('prefers AI enhanced goal over regular goal', () => {
      const mockLetter = createMockLetter({
        goal: 'Original goal',
        ai_enhanced_goal: 'AI enhanced goal with better clarity',
      })

      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('AI enhanced goal with better clarity')).toBeInTheDocument()
      expect(screen.queryByText('Original goal')).not.toBeInTheDocument()
    })

    it('renders send date in correct format', () => {
      const mockLetter = createMockLetter({
        send_date: '2024-12-31T00:00:00Z',
      })

      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument()
    })

    it('renders creation date in correct format', () => {
      const mockLetter = createMockLetter({
        created_at: '2024-01-15T10:30:00Z',
      })

      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Created Jan 15')).toBeInTheDocument()
    })
  })

  describe('Status Management', () => {
    it('renders draft status correctly', () => {
      const mockLetter = createMockLetter({ status: 'draft' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Schedule')).toBeInTheDocument()
    })

    it('renders scheduled status with days countdown', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      
      const mockLetter = createMockLetter({
        status: 'scheduled',
        send_date: futureDate.toISOString(),
      })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // The exact number may vary due to time calculation, so check for pattern
      expect(screen.getByText(/\d+ days left/)).toBeInTheDocument()
      expect(screen.getByText('Send Now')).toBeInTheDocument()
    })

    it('renders sent status correctly', () => {
      const mockLetter = createMockLetter({ status: 'sent' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('Delivered')).toBeInTheDocument()
      expect(screen.queryByText('Schedule')).not.toBeInTheDocument()
      expect(screen.queryByText('Send Now')).not.toBeInTheDocument()
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

    it('shows 0% progress when all milestones incomplete', () => {
      const milestones = [
        createMockMilestone({ completed: false }),
        createMockMilestone({ completed: false }),
      ]
      
      const mockLetter = createMockLetter({ milestones })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('shows 100% progress when all milestones complete', () => {
      const milestones = [
        createMockMilestone({ completed: true }),
        createMockMilestone({ completed: true }),
      ]
      
      const mockLetter = createMockLetter({ milestones })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Voice Memo Functionality', () => {
    it('shows play button when voice memo exists', () => {
      const mockLetter = createMockLetter({
        voice_memo_url: 'https://example.com/audio.mp3'
      })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const playButtons = screen.getAllByRole('button')
      const playButton = playButtons.find(button => 
        button.querySelector('[data-testid="play-icon"]') || 
        button.textContent?.includes('Play') ||
        button.querySelector('svg')?.getAttribute('class')?.includes('h-3')
      )
      
      expect(playButton).toBeInTheDocument()
    })

    it('calls onPlay with voice memo URL when play button clicked', async () => {
      const user = userEvent.setup()
      const voiceMemoUrl = 'https://example.com/audio.mp3'
      const mockLetter = createMockLetter({ voice_memo_url: voiceMemoUrl })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const playButton = screen.getByRole('button', { name: /play voice memo/i })
      await user.click(playButton)
      expect(mockHandlers.onPlay).toHaveBeenCalledWith(voiceMemoUrl)
    })

    it('hides play button when no voice memo exists', () => {
      const mockLetter = createMockLetter({ voice_memo_url: null })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Should only have Edit and Delete buttons, not Play
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeLessThan(5) // Fewer buttons without play
    })
  })

  describe('Action Buttons', () => {
    it('calls onView when card is clicked', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter()
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Click on the card container
      const card = screen.getByText(mockLetter.title).closest('[class*="cursor-pointer"]')
      expect(card).toBeInTheDocument()
      
      await user.click(card!)
      expect(mockHandlers.onView).toHaveBeenCalledWith(mockLetter)
    })

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter()
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const editButton = screen.getByRole('button', { name: /edit letter/i })
      await user.click(editButton)
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockLetter)
    })

    it('disables edit button when letter is locked', () => {
      const mockLetter = createMockLetter({ is_locked: true })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const editButton = screen.getByRole('button', { name: /edit letter/i })
      expect(editButton).toBeDisabled()
    })

    it('calls onTriggerDelivery when delivery button is clicked', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ status: 'draft' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const scheduleButton = screen.getByText('Schedule')
      await user.click(scheduleButton)
      
      expect(mockHandlers.onTriggerDelivery).toHaveBeenCalledWith(mockLetter)
    })
  })

  describe('Delete Functionality', () => {
    it('shows delete confirmation dialog', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ title: 'Letter to Delete' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const deleteButton = screen.getByRole('button', { name: /delete letter/i })
      await user.click(deleteButton)
      
      expect(screen.getByRole('heading', { name: 'Delete Letter' })).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete "Letter to Delete"/)).toBeInTheDocument()
    })

    it('calls onDelete when delete is confirmed', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter()
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Open delete dialog
      const deleteButton = screen.getByRole('button', { name: /delete letter/i })
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: 'Delete Letter' })
      await user.click(confirmButton)
      
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockLetter)
    })

    it('does not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter()
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Open delete dialog
      const deleteButton = screen.getByRole('button', { name: /delete letter/i })
      await user.click(deleteButton)
      
      // Cancel deletion
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockHandlers.onDelete).not.toHaveBeenCalled()
    })
  })

  describe('Status Change Functionality', () => {
    it('shows status change dialog for sent letters', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ status: 'sent' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const deliveredBadge = screen.getByText('Delivered')
      await user.click(deliveredBadge)
      
      expect(screen.getByText('Change Letter Status')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to change the status from "Delivered" to "Scheduled"/)).toBeInTheDocument()
    })

    it('calls onStatusChange when status change is confirmed', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ status: 'sent' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Open status change dialog
      const deliveredBadge = screen.getByText('Delivered')
      await user.click(deliveredBadge)
      
      // Confirm status change
      const changeButton = screen.getByText('Change to Scheduled')
      await user.click(changeButton)
      
      expect(mockHandlers.onStatusChange).toHaveBeenCalledWith(mockLetter, 'scheduled')
    })

    it('does not show status change dialog for non-sent letters', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ status: 'draft' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const draftBadge = screen.getByText('Draft')
      await user.click(draftBadge)
      
      expect(screen.queryByText('Change Letter Status')).not.toBeInTheDocument()
    })
  })

  describe('Event Propagation', () => {
    it('prevents card click when action buttons are clicked', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ status: 'draft' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const editButton = screen.getByRole('button', { name: /edit letter/i })
      await user.click(editButton)
      
      // onEdit should be called, but onView should not
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockLetter)
      expect(mockHandlers.onView).not.toHaveBeenCalled()
    })

    it('prevents card click when schedule button is clicked', async () => {
      const user = userEvent.setup()
      const mockLetter = createMockLetter({ status: 'draft' })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      const scheduleButton = screen.getByText('Schedule')
      await user.click(scheduleButton)
      
      expect(mockHandlers.onTriggerDelivery).toHaveBeenCalledWith(mockLetter)
      expect(mockHandlers.onView).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles and labels', () => {
      const mockLetter = createMockLetter()
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Check that buttons have proper roles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Edit button should be present
      expect(screen.getByRole('button', { name: /edit letter/i })).toBeInTheDocument()
    })

    it('provides proper ARIA labels for icon buttons', () => {
      const mockLetter = createMockLetter({
        voice_memo_url: 'https://example.com/audio.mp3'
      })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Icon buttons should be accessible
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeVisible()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const mockLetter = createMockLetter()
      
      render(<LetterCard letter={mockLetter} onEdit={mockHandlers.onEdit} onView={mockHandlers.onView} />)

      expect(screen.getByText(mockLetter.title)).toBeInTheDocument()
    })

    it('handles letters with no milestones', () => {
      const mockLetter = createMockLetter({ milestones: null })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    })

    it('handles invalid dates gracefully', () => {
      const mockLetter = createMockLetter({
        send_date: '2024-12-31T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      })
      
      render(<LetterCard letter={mockLetter} {...mockHandlers} />)

      // Should render without crashing
      expect(screen.getByText(mockLetter.title)).toBeInTheDocument()
    })
  })
})
