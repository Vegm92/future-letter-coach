import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { AudioPreview } from '@/features/voice-memo/components'

describe('AudioPreview', () => {
  const defaultProps = {
    audioUrl: 'https://example.com/audio.mp3',
  }

  const mockHandlers = {
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onPlay: vi.fn(),
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Playback Mode (not recording)', () => {
    it('renders audio element with correct src', () => {
      render(<AudioPreview {...defaultProps} />)
      
      const audioElement = document.querySelector('audio')
      expect(audioElement).toBeInTheDocument()
      expect(audioElement).toHaveAttribute('src', defaultProps.audioUrl)
      expect(audioElement).toHaveAttribute('controls')
    })

    it('renders Play and Remove buttons', () => {
      render(<AudioPreview {...defaultProps} {...mockHandlers} />)
      
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
    })

    it('calls onPlay when Play button is clicked', async () => {
      const user = userEvent.setup()
      render(<AudioPreview {...defaultProps} {...mockHandlers} />)
      
      const playButton = screen.getByRole('button', { name: /play/i })
      await user.click(playButton)
      
      expect(mockHandlers.onPlay).toHaveBeenCalledOnce()
    })

    it('calls onRemove when Remove button is clicked', async () => {
      const user = userEvent.setup()
      render(<AudioPreview {...defaultProps} {...mockHandlers} />)
      
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)
      
      expect(mockHandlers.onRemove).toHaveBeenCalledOnce()
    })

    it('does not render Pause, Resume, or Stop buttons when not recording', () => {
      render(<AudioPreview {...defaultProps} />)
      
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
    })
  })

  describe('Recording Mode', () => {
    const recordingProps = {
      ...defaultProps,
      isRecording: true,
      ...mockHandlers,
    }

    it('hides audio element when recording', () => {
      render(<AudioPreview {...recordingProps} />)
      
      expect(screen.queryByRole('application')).not.toBeInTheDocument()
    })

    it('renders Pause and Stop buttons when recording', () => {
      render(<AudioPreview {...recordingProps} />)
      
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })

    it('does not render Play and Remove buttons when recording', () => {
      render(<AudioPreview {...recordingProps} />)
      
      expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    })

    it('calls onPause when Pause button is clicked', async () => {
      const user = userEvent.setup()
      render(<AudioPreview {...recordingProps} />)
      
      const pauseButton = screen.getByRole('button', { name: /pause/i })
      await user.click(pauseButton)
      
      expect(mockHandlers.onPause).toHaveBeenCalledOnce()
    })

    it('calls onStop when Stop button is clicked', async () => {
      const user = userEvent.setup()
      render(<AudioPreview {...recordingProps} />)
      
      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)
      
      expect(mockHandlers.onStop).toHaveBeenCalledOnce()
    })
  })

  describe('Paused Recording Mode', () => {
    const pausedRecordingProps = {
      ...defaultProps,
      isRecording: true,
      isPaused: true,
      ...mockHandlers,
    }

    it('renders Resume button when recording is paused', () => {
      render(<AudioPreview {...pausedRecordingProps} />)
      
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
    })

    it('calls onResume when Resume button is clicked', async () => {
      const user = userEvent.setup()
      render(<AudioPreview {...pausedRecordingProps} />)
      
      const resumeButton = screen.getByRole('button', { name: /resume/i })
      await user.click(resumeButton)
      
      expect(mockHandlers.onResume).toHaveBeenCalledOnce()
    })

    it('still renders Stop button when paused', () => {
      render(<AudioPreview {...pausedRecordingProps} />)
      
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper button structure with icons and text', () => {
      render(<AudioPreview {...defaultProps} {...mockHandlers} />)
      
      const playButton = screen.getByRole('button', { name: /play/i })
      const removeButton = screen.getByRole('button', { name: /remove/i })
      
      expect(playButton).toBeInTheDocument()
      expect(removeButton).toBeInTheDocument()
    })

    it('maintains proper button types', () => {
      render(<AudioPreview {...defaultProps} {...mockHandlers} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', async () => {
      const user = userEvent.setup()
      render(<AudioPreview {...defaultProps} />)
      
      // Should not crash when clicking buttons without handlers
      const playButton = screen.getByRole('button', { name: /play/i })
      const removeButton = screen.getByRole('button', { name: /remove/i })
      
      await user.click(playButton)
      await user.click(removeButton)
      
      // Component should still be rendered
      expect(document.querySelector('audio')).toBeInTheDocument()
    })

    it('handles empty audioUrl', () => {
      render(<AudioPreview audioUrl="" />)
      
      const audioElement = document.querySelector('audio')
      expect(audioElement).toBeInTheDocument()
      expect(audioElement).toHaveAttribute('src', '')
    })

    it('properly toggles between recording states', () => {
      const { rerender } = render(<AudioPreview {...defaultProps} />)
      
      // Initially not recording
      expect(document.querySelector('audio')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
      
      // Switch to recording
      rerender(<AudioPreview {...defaultProps} isRecording={true} />)
      expect(document.querySelector('audio')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      
      // Switch back to not recording
      rerender(<AudioPreview {...defaultProps} isRecording={false} />)
      expect(document.querySelector('audio')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    })
  })
})
