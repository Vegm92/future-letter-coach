import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { vi } from 'vitest'

// Mock data factories
export const createMockLetter = (overrides = {}) => ({
  id: 'mock-letter-id',
  user_id: 'mock-user-id',
  title: 'Test Letter',
  content: 'This is a test letter content',
  goal: 'This is a test goal',
  send_date: '2024-12-31T23:59:59Z',
  delivery_date: '2024-12-31T23:59:59Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  status: 'draft',
  is_delivered: false,
  is_locked: false,
  voice_memo_url: null,
  enhanced_content: null,
  ai_enhanced_goal: null,
  milestones: [],
  ...overrides,
})

export const createMockMilestone = (overrides = {}) => ({
  id: 'mock-milestone-id',
  letter_id: 'mock-letter-id',
  title: 'Test Milestone',
  description: 'Test milestone description',
  target_date: '2024-06-01T00:00:00Z',
  completed: false,
  is_completed: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Test wrapper component
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export * from '@testing-library/user-event'
export { customRender as render }

// Common test helpers
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

export const mockFormSubmit = vi.fn()
export const mockNavigate = vi.fn()

// Mock implementations for common scenarios
export const mockSuccessfulQuery = (data: any) => ({
  data,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
})

export const mockLoadingQuery = () => ({
  data: undefined,
  error: null,
  isLoading: true,
  isError: false,
  isSuccess: false,
})

export const mockErrorQuery = (error: any) => ({
  data: undefined,
  error,
  isLoading: false,
  isError: true,
  isSuccess: false,
})

export const mockSuccessfulMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(() => Promise.resolve()),
  isLoading: false,
  isError: false,
  error: null,
  isSuccess: true,
})

export const mockLoadingMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: true,
  isError: false,
  error: null,
  isSuccess: false,
})

// Audio testing utilities
export const mockAudioContext = () => {
  const mockAudioContext = {
    createMediaElementSource: vi.fn(),
    createGain: vi.fn(() => ({
      gain: { value: 1 },
      connect: vi.fn(),
    })),
    destination: {},
  }
  
  global.AudioContext = vi.fn(() => mockAudioContext) as any
  global.webkitAudioContext = vi.fn(() => mockAudioContext) as any
  
  return mockAudioContext
}

// Voice memo testing utilities
export const mockMediaRecorder = () => {
  const mockRecorder = {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    state: 'inactive',
    ondataavailable: null,
    onstop: null,
  }
  
  global.MediaRecorder = vi.fn(() => mockRecorder) as any
  return mockRecorder
}
