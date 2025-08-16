import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock the toast hook
const mockToast = vi.fn()
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock the AuthService
vi.mock('../../services', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    getCurrentSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }))
}))

// Mock supabase client
vi.mock('@/shared/config/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    }
  }
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticating).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should return all required properties', () => {
    const { result } = renderHook(() => useAuth())

    const requiredProperties = [
      'user',
      'session', 
      'isLoading',
      'isAuthenticating',
      'isAuthenticated',
      'signUp',
      'signIn',
      'signInWithGoogle',
      'signOut',
    ]

    requiredProperties.forEach(prop => {
      expect(result.current).toHaveProperty(prop)
    })
  })

  it('should handle loading to non-loading transition', async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
