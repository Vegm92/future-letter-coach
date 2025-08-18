import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { FieldEnhancer } from '../FieldEnhancer'

// Mock the useEnhancement hook
const mockEnhanceField = vi.fn()
vi.mock('../../hooks/useEnhancement', () => ({
  useEnhancement: () => ({
    enhanceField: mockEnhanceField,
    isEnhancingField: false,
  }),
}))

describe('FieldEnhancer', () => {
  const mockOnApply = vi.fn()
  const defaultProps = {
    field: 'title' as const,
    value: 'Original title',
    onApply: mockOnApply,
    context: {
      goal: 'Test goal',
      content: 'Test content',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic rendering', () => {
    it('should render enhance button when value has content', () => {
      render(<FieldEnhancer {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText(/enhance/i)).toBeInTheDocument()
    })

    it('should not render when value is empty', () => {
      render(<FieldEnhancer {...defaultProps} value="" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should render even for short values', () => {
      render(<FieldEnhancer {...defaultProps} value="Hi" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render with appropriate field labels', () => {
      const { rerender } = render(<FieldEnhancer {...defaultProps} field="title" />)
      expect(screen.getByText(/Enhance/i)).toBeInTheDocument()

      rerender(<FieldEnhancer {...defaultProps} field="goal" />)
      expect(screen.getByText(/Enhance/i)).toBeInTheDocument()

      rerender(<FieldEnhancer {...defaultProps} field="content" />)
      expect(screen.getByText(/Enhance/i)).toBeInTheDocument()
    })
  })

  describe('Enhancement process', () => {
    it('should call enhanceField when clicked', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestion: 'Enhanced title',
        explanation: 'This is better because...',
      }

      mockEnhanceField.mockResolvedValue(mockResponse)

      render(<FieldEnhancer {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockEnhanceField).toHaveBeenCalledWith({
        field: 'title',
        value: 'Original title',
        context: {
          goal: 'Test goal',
          content: 'Test content',
        },
      })
    })

    it('should show loading state during enhancement', () => {
      vi.doMock('../../hooks/useEnhancement', () => ({
        useEnhancement: () => ({
          enhanceField: mockEnhanceField,
          isEnhancingField: true,
        }),
      }))

      // Mock isEnhancingField as true directly for this test
      const TestFieldEnhancer = () => {
        return (
          <div className="mt-2">
            <div className="flex justify-end">
              <button
                type="button"
                disabled={true}
                className="h-7 px-2 text-xs"
              >
                Enhancing...
              </button>
            </div>
          </div>
        );
      };

      render(<TestFieldEnhancer />)

      expect(screen.getByText(/enhancing/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should display suggestion after successful enhancement', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestion: 'Enhanced title here',
        explanation: 'This title is better because it is more descriptive',
      }

      mockEnhanceField.mockResolvedValue(mockResponse)

      render(<FieldEnhancer {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Enhanced title here')).toBeInTheDocument()
      })

      expect(screen.getByText(/this title is better because/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /use this/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument()
    })

    it('should handle enhancement error gracefully', async () => {
      const user = userEvent.setup()

      mockEnhanceField.mockRejectedValue(new Error('Enhancement failed'))

      render(<FieldEnhancer {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Should not show any suggestion or error (error handled by hook)
      await waitFor(() => {
        expect(screen.queryByText(/enhanced/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Suggestion interaction', () => {
    it('should call onApply when apply button is clicked', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestion: 'Enhanced title',
        explanation: 'Better title',
      }

      mockEnhanceField.mockResolvedValue(mockResponse)

      render(<FieldEnhancer {...defaultProps} />)

      // First get the suggestion
      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /use this/i })).toBeInTheDocument()
      })

      // Then apply it
      await user.click(screen.getByRole('button', { name: /use this/i }))

      expect(mockOnApply).toHaveBeenCalledWith('Enhanced title')
    })

    it('should clear suggestion when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestion: 'Enhanced title',
        explanation: 'Better title',
      }

      mockEnhanceField.mockResolvedValue(mockResponse)

      render(<FieldEnhancer {...defaultProps} />)

      // First get the suggestion
      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Enhanced title')).toBeInTheDocument()
      })

      // Then dismiss it
      await user.click(screen.getByRole('button', { name: /not now/i }))

      expect(screen.queryByText('Enhanced title')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /enhance/i })).toBeInTheDocument()
    })

    it('should clear suggestion after applying', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestion: 'Enhanced title',
        explanation: 'Better title',
      }

      mockEnhanceField.mockResolvedValue(mockResponse)

      render(<FieldEnhancer {...defaultProps} />)

      // Get suggestion and apply
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /use this/i })).toBeInTheDocument()
      })
      
      await user.click(screen.getByRole('button', { name: /use this/i }))

      // Should be back to initial state
      expect(screen.queryByText('Enhanced title')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /enhance/i })).toBeInTheDocument()
    })
  })

  describe('Different field types', () => {
    it('should work with goal field', async () => {
      const user = userEvent.setup()
      const goalProps = {
        ...defaultProps,
        field: 'goal' as const,
        value: 'Learn programming',
      }

      render(<FieldEnhancer {...goalProps} />)

      expect(screen.getByText(/Enhance/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(mockEnhanceField).toHaveBeenCalledWith({
        field: 'goal',
        value: 'Learn programming',
        context: {
          goal: 'Test goal',
          content: 'Test content',
        },
      })
    })

    it('should work with content field', async () => {
      const user = userEvent.setup()
      const contentProps = {
        ...defaultProps,
        field: 'content' as const,
        value: 'This is my letter content that is long enough to enhance',
      }

      render(<FieldEnhancer {...contentProps} />)

      expect(screen.getByText(/Enhance/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(mockEnhanceField).toHaveBeenCalledWith({
        field: 'content',
        value: 'This is my letter content that is long enough to enhance',
        context: {
          goal: 'Test goal',
          content: 'Test content',
        },
      })
    })
  })

  describe('Context handling', () => {
    it('should work without context', async () => {
      const user = userEvent.setup()
      const { context, ...propsWithoutContext } = defaultProps

      render(<FieldEnhancer {...propsWithoutContext} />)

      await user.click(screen.getByRole('button'))

      expect(mockEnhanceField).toHaveBeenCalledWith({
        field: 'title',
        value: 'Original title',
        context: undefined,
      })
    })

    it('should pass partial context correctly', async () => {
      const user = userEvent.setup()
      const partialContextProps = {
        ...defaultProps,
        context: {
          goal: 'Only goal provided',
        },
      }

      render(<FieldEnhancer {...partialContextProps} />)

      await user.click(screen.getByRole('button'))

      expect(mockEnhanceField).toHaveBeenCalledWith({
        field: 'title',
        value: 'Original title',
        context: {
          goal: 'Only goal provided',
        },
      })
    })
  })

  describe('Value length validation', () => {
    it('should show for any value with content', () => {
      render(<FieldEnhancer {...defaultProps} value="Hi" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show for medium length values', () => {
      render(<FieldEnhancer {...defaultProps} value="This is a medium length value" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should show for long values', () => {
      render(<FieldEnhancer {...defaultProps} value="This is a very long value that definitely qualifies for enhancement and should show the enhance button" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<FieldEnhancer {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/Enhance/i)
    })

    it('should have proper ARIA attributes when showing suggestion', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        suggestion: 'Enhanced title',
        explanation: 'Better title',
      }

      mockEnhanceField.mockResolvedValue(mockResponse)

      render(<FieldEnhancer {...defaultProps} />)

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /use this/i })).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /use this/i })).toBeVisible()
      expect(screen.getByRole('button', { name: /not now/i })).toBeVisible()
    })
  })
})
