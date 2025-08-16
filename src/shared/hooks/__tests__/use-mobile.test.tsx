import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/shared/hooks/use-mobile'

// Mock window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
})

describe('useIsMobile', () => {
  let mockMediaQueryList: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    mockMatchMedia.mockReturnValue(mockMediaQueryList)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should return undefined initially', () => {
      const { result } = renderHook(() => useIsMobile())
      
      // Before useEffect runs, it should return false (!!undefined = false)
      expect(result.current).toBe(false)
    })

    it('should set up media query listener for mobile breakpoint', () => {
      renderHook(() => useIsMobile())

      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('Desktop Detection', () => {
    it('should return false for desktop width (>= 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    it('should return false for tablet width (768px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })
  })

  describe('Mobile Detection', () => {
    it('should return true for mobile width (< 768px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 767 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    it('should return true for small mobile width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })
  })

  describe('Responsive Updates', () => {
    it('should update when window size changes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 })
      
      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)

      // Simulate window resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 500 })
      
      // Get the change handler that was registered
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
      
      act(() => {
        changeHandler()
      })

      expect(result.current).toBe(true)
    })

    it('should update when switching from mobile to desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 })
      
      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)

      // Simulate window resize to desktop
      Object.defineProperty(window, 'innerWidth', { value: 1024 })
      
      // Get the change handler that was registered
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
      
      act(() => {
        changeHandler()
      })

      expect(result.current).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useIsMobile())

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalled()

      unmount()

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    it('should remove the same event listener that was added', () => {
      const { unmount } = renderHook(() => useIsMobile())

      const addedHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]

      unmount()

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        addedHandler
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle media query not supported', () => {
      // Mock matchMedia to return undefined/null
      mockMatchMedia.mockReturnValue(null)

      // The hook should handle this gracefully and not crash
      const { result } = renderHook(() => useIsMobile())
      
      // Should default to false when matchMedia is not supported
      expect(result.current).toBe(false)
    })

    it('should work with different breakpoint values at boundary', () => {
      const boundaryTests = [
        { width: 766, expected: true },
        { width: 767, expected: true },
        { width: 768, expected: false },
        { width: 769, expected: false },
      ]

      boundaryTests.forEach(({ width, expected }) => {
        Object.defineProperty(window, 'innerWidth', { value: width })
        
        const { result, unmount } = renderHook(() => useIsMobile())
        
        expect(result.current).toBe(expected)
        
        unmount()
      })
    })
  })

  describe('Re-renders', () => {
    it('should not cause infinite re-renders', () => {
      let renderCount = 0
      
      const TestComponent = () => {
        renderCount++
        return useIsMobile()
      }

      renderHook(() => TestComponent())

      // Should only render once initially + once after effect
      expect(renderCount).toBeLessThanOrEqual(3)
    })

    it('should only re-render when mobile state actually changes', () => {
      let renderCount = 0
      
      const TestComponent = () => {
        renderCount++
        return useIsMobile()
      }

      Object.defineProperty(window, 'innerWidth', { value: 1024 })
      
      const { result } = renderHook(() => TestComponent())
      
      // Wait for initial render to complete
      expect(result.current).toBe(false)
      const initialRenderCount = renderCount
      
      // Simulate multiple resize events with same mobile state (desktop -> desktop)
      const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]
      
      act(() => {
        // These should not trigger re-renders since the mobile state remains false
        changeHandler()
        changeHandler()
        changeHandler()
      })

      // Should not cause additional re-renders since mobile state didn't change
      // Allow for potential React re-render during state update
      expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 1)
      expect(result.current).toBe(false)
    })
  })
})
