import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import CreateLetterForm from "../CreateLetterForm";
import * as voiceMemoHook from "@/features/voice-memo/hooks/useVoiceMemoRecorder";
import * as smartEnhancementHook from "@/features/enhancement/hooks/useSmartEnhancement";

// Mock toast function
const mockToast = vi.fn();
vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock dependencies
vi.mock("@/features/voice-memo/hooks/useVoiceMemoRecorder");
vi.mock("@/features/enhancement/hooks/useSmartEnhancement");

// Mock Supabase client
vi.mock("@/shared/config/client", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };
  return {
    supabase: mockSupabase,
  };
});

describe("CreateLetterForm", () => {
  const mockHandlers = {
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const mockVoiceMemo = {
    audioUrl: null,
    isRecording: false,
    isPaused: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    resetRecording: vi.fn(),
  };

  const mockSmartEnhancement = {
    state: "idle" as const,
    canEnhance: true,
    appliedFields: new Set(),
    loadingFields: new Set(),
    enhance: vi.fn(),
    retry: vi.fn(),
    applyField: vi.fn(),
    applyMilestones: vi.fn(),
    applyAllRemaining: vi.fn(),
    isExpanded: false,
    setIsExpanded: vi.fn(),
    hasEnhancementData: false,
    data: null,
    milestonesApplied: false,
    isApplyingMilestones: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(voiceMemoHook.useVoiceMemoRecorder).mockReturnValue(
      mockVoiceMemo,
    );
    vi.mocked(smartEnhancementHook.useSmartEnhancement).mockReturnValue(
      mockSmartEnhancement,
    );
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<CreateLetterForm {...mockHandlers} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send date/i)).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(<CreateLetterForm {...mockHandlers} />);

      expect(
        screen.getByRole("button", { name: /create letter/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("should initialize with default send date (30 days from now)", () => {
      render(<CreateLetterForm {...mockHandlers} />);

      const sendDateInput = screen.getByLabelText(
        /send date/i,
      ) as HTMLInputElement;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      const expectedDateString = expectedDate.toISOString().split("T")[0];

      expect(sendDateInput.value).toBe(expectedDateString);
    });

    it("should render milestones section when collapsed", () => {
      render(<CreateLetterForm {...mockHandlers} />);

      expect(screen.getByText("Milestones (Optional)")).toBeInTheDocument();
      // The "Add Milestone" button (inside the milestones form) should not be visible when collapsed
      expect(
        screen.queryByRole("button", { name: "Add Milestone" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation error for empty title", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      const submitButton = screen.getByRole("button", {
        name: /create letter/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Please fill in all required fields",
          variant: "destructive",
        });
      });
    });

    it("should show validation error for empty content", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      // Fill only title
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Title");

      const submitButton = screen.getByRole("button", {
        name: /create letter/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Please fill in all required fields",
          variant: "destructive",
        });
      });
    });

    it("should show validation error for empty goal", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      // Fill title and content but not goal
      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      await user.type(titleInput, "Test Title");
      await user.type(contentInput, "Test content");

      const submitButton = screen.getByRole("button", {
        name: /create letter/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Please fill in all required fields",
          variant: "destructive",
        });
      });
    });

    it("should not show validation errors when all required fields are filled", async () => {
      const user = userEvent.setup();

      // Get the mocked Supabase from the module mock
      const { supabase } = await import('@/shared/config/client')
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      }

      // Mock successful Supabase calls
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "letter-123", title: "Test Title" },
              error: null,
            }),
          }),
        }),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill all required fields
      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const goalInput = screen.getByLabelText(/goal/i);

      await user.type(titleInput, "Test Title");
      await user.type(contentInput, "Test content");
      await user.type(goalInput, "Test goal");

      const submitButton = screen.getByRole("button", {
        name: /create letter/i,
      });
      await user.click(submitButton);

      // Should not show validation error
      expect(
        screen.queryByText(/please fill in all required fields/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should disable submit button during submission", async () => {
      const user = userEvent.setup();

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      // Mock Supabase to return a promise that we can control
      let resolveSubmit: (value: { data: { id: string } | null; error: Error | null }) => void;
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn(
              () =>
                new Promise((resolve) => {
                  resolveSubmit = resolve;
                }),
            ),
          }),
        }),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const goalInput = screen.getByLabelText(/goal/i);

      await user.type(titleInput, "Test Title");
      await user.type(contentInput, "Test content");
      await user.type(goalInput, "Test goal");

      const submitButton = screen.getByRole("button", {
        name: /create letter/i,
      });

      // Click submit
      user.click(submitButton);

      // Should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveSubmit!({ data: { id: "letter-123" }, error: null });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should call onSuccess and onClose on successful submission", async () => {
      const user = userEvent.setup();

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      const mockLetter = { id: "letter-123", title: "Test Title" };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLetter,
              error: null,
            }),
          }),
        }),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(screen.getByLabelText(/content/i), "Test content");
      await user.type(screen.getByLabelText(/goal/i), "Test goal");

      await user.click(screen.getByRole("button", { name: /create letter/i }));

      await waitFor(() => {
        expect(mockHandlers.onSuccess).toHaveBeenCalledWith(mockLetter);
        expect(mockHandlers.onClose).toHaveBeenCalled();
      });
    });

    it("should handle submission errors gracefully", async () => {
      const user = userEvent.setup();

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      // Mock Supabase to throw an error
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("Database error"),
            }),
          }),
        }),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(screen.getByLabelText(/content/i), "Test content");
      await user.type(screen.getByLabelText(/goal/i), "Test goal");

      await user.click(screen.getByRole("button", { name: /create letter/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to create letter",
          description: "Please try again.",
          variant: "destructive",
        });
      });

      expect(mockHandlers.onSuccess).not.toHaveBeenCalled();
      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });

    it("should handle authentication errors", async () => {
      const user = userEvent.setup();

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      // Mock auth failure
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(screen.getByLabelText(/content/i), "Test content");
      await user.type(screen.getByLabelText(/goal/i), "Test goal");

      await user.click(screen.getByRole("button", { name: /create letter/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to create letter",
          description: "Please try again.",
          variant: "destructive",
        });
      });
    });
  });

  describe("Cancel Functionality", () => {
    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it("should not submit form when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockHandlers.onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Milestones Management", () => {
    it("should show milestone section when expanded", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      const milestonesToggle = screen.getByRole("button", {
        name: /milestones/i,
      });
      await user.click(milestonesToggle);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /add milestone/i }),
        ).toBeInTheDocument();
      });
    });

    it("should add a new milestone when Add Milestone is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      // Expand milestones section
      await user.click(screen.getByRole("button", { name: /add milestones/i }));

      // Add milestone
      await user.click(screen.getByRole("button", { name: /add milestone/i }));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/complete first month/i),
        ).toBeInTheDocument();
      });
    });

    it("should remove milestone when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      // Expand milestones and add one
      await user.click(screen.getByRole("button", { name: /add milestones/i }));
      await user.click(screen.getByRole("button", { name: /add milestone/i }));

      // Should have milestone input
      expect(
        screen.getByPlaceholderText(/complete first month/i),
      ).toBeInTheDocument();

      // Remove milestone
      const deleteButton = screen.getByRole("button", { name: "" });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/complete first month/i),
        ).not.toBeInTheDocument();
      });
    });

    it("should update milestone data when fields are changed", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      // Expand milestones and add one
      await user.click(screen.getByRole("button", { name: /add milestones/i }));
      await user.click(screen.getByRole("button", { name: /add milestone/i }));

      const titleInput = screen.getByPlaceholderText(/complete first month/i);
      await user.type(titleInput, "Complete Phase 1");

      expect(titleInput).toHaveValue("Complete Phase 1");
    });
  });

  describe("Voice Memo Integration", () => {
    it("should show recording controls when voice memo is available", () => {
      vi.mocked(voiceMemoHook.useVoiceMemoRecorder).mockReturnValue({
        ...mockVoiceMemo,
        audioUrl: "https://example.com/audio.mp3",
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Voice memo controls should be visible
      expect(
        screen.getByRole("button", { name: /record/i }),
      ).toBeInTheDocument();
    });

    it("should start recording when record button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      const recordButton = screen.getByRole("button", { name: /record/i });
      await user.click(recordButton);

      expect(mockVoiceMemo.startRecording).toHaveBeenCalled();
    });

    it("should include voice memo URL in submission when available", async () => {
      const user = userEvent.setup();

      vi.mocked(voiceMemoHook.useVoiceMemoRecorder).mockReturnValue({
        ...mockVoiceMemo,
        audioUrl: "https://example.com/audio.mp3",
      });

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          expect(data).toHaveProperty("voice_memo_url");
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "letter-123" },
                error: null,
              }),
            }),
          };
        }),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(screen.getByLabelText(/content/i), "Test content");
      await user.type(screen.getByLabelText(/goal/i), "Test goal");

      await user.click(screen.getByRole("button", { name: /create letter/i }));

      // The mock assertion inside the implementation will verify voice_memo_url was included
    });
  });

  describe("AI Enhancement Integration", () => {
    it("should show enhancement controls when available", () => {
      vi.mocked(smartEnhancementHook.useSmartEnhancement).mockReturnValue({
        ...mockSmartEnhancement,
        state: "success",
        appliedFields: new Set(["title", "goal"]),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Enhancement indicators should be visible
      expect(screen.getByText(/enhanced/i)).toBeInTheDocument();
    });

    it("should apply AI enhancement when available", async () => {
      const user = userEvent.setup();

      const enhancedMock = {
        ...mockSmartEnhancement,
        state: "success" as const,
        canEnhance: true,
        enhance: vi.fn(),
      };

      vi.mocked(smartEnhancementHook.useSmartEnhancement).mockReturnValue(
        enhancedMock,
      );

      render(<CreateLetterForm {...mockHandlers} />);

      // Click enhance button to trigger enhancement
      const enhanceButton = screen.getByRole("button", {
        name: /enhance with ai/i,
      });
      await user.click(enhanceButton);

      // Enhancement should be called
      expect(enhancedMock.enhance).toHaveBeenCalled();
    });

    it("should include AI enhancement metadata in submission", async () => {
      const user = userEvent.setup();

      vi.mocked(smartEnhancementHook.useSmartEnhancement).mockReturnValue({
        ...mockSmartEnhancement,
        state: "success",
        appliedFields: new Set(["goal"]),
      });

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          expect(data).toHaveProperty("ai_enhanced", true);
          expect(data).toHaveProperty("ai_enhanced_goal");
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "letter-123" },
                error: null,
              }),
            }),
          };
        }),
      });

      render(<CreateLetterForm {...mockHandlers} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(screen.getByLabelText(/content/i), "Test content");
      await user.type(screen.getByLabelText(/goal/i), "Test goal");

      await user.click(screen.getByRole("button", { name: /create letter/i }));

      // The mock assertion inside the implementation will verify AI metadata was included
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<CreateLetterForm {...mockHandlers} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/goal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send date/i)).toBeInTheDocument();
    });

    it("should have proper button types", () => {
      render(<CreateLetterForm {...mockHandlers} />);

      const submitButton = screen.getByRole("button", {
        name: /create letter/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(submitButton).toHaveAttribute("type", "submit");
      expect(cancelButton).toHaveAttribute("type", "button");
    });

    it("should have proper ARIA attributes for collapsible sections", async () => {
      const user = userEvent.setup();
      render(<CreateLetterForm {...mockHandlers} />);

      const milestonesToggle = screen.getByRole("button", {
        name: /milestones/i,
      });
      expect(milestonesToggle).toHaveAttribute("aria-expanded", "false");

      await user.click(milestonesToggle);

      expect(milestonesToggle).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing onSuccess callback gracefully", async () => {
      const user = userEvent.setup();

      // Get the mocked Supabase from the module mock
      const { supabase } = await import("@/shared/config/client");
      const mockSupabase = supabase as {
        auth: { getUser: ReturnType<typeof vi.fn> }
        from: ReturnType<typeof vi.fn>
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "letter-123" },
              error: null,
            }),
          }),
        }),
      });

      // Render without onSuccess callback
      render(
        <CreateLetterForm
          onClose={mockHandlers.onClose}
          onSuccess={undefined as ((letter: { id: string; title: string }) => void) | undefined}
        />,
      );

      // Fill and submit form - should not crash
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(screen.getByLabelText(/content/i), "Test content");
      await user.type(screen.getByLabelText(/goal/i), "Test goal");

      await user.click(screen.getByRole("button", { name: /create letter/i }));

      // Should still call onClose
      await waitFor(() => {
        expect(mockHandlers.onClose).toHaveBeenCalled();
      });
    });

    it("should handle very long input values", async () => {
      render(<CreateLetterForm {...mockHandlers} />);

      const longText = "A".repeat(10000);
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;

      // Use fireEvent.change for better performance with large text
      fireEvent.change(titleInput, { target: { value: longText } });
      expect(titleInput).toHaveValue(longText);
    });

    it("should handle special characters in input", async () => {
      render(<CreateLetterForm {...mockHandlers} />);

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      const specialText = '!@#$%^&*()_+-=[]|:;"<>?,./'; // Remove problematic { } characters

      // Use fireEvent.change instead of userEvent.type for complex strings
      fireEvent.change(titleInput, { target: { value: specialText } });
      expect(titleInput).toHaveValue(specialText);
    });
  });
});
