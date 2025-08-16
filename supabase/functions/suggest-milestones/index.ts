import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
  verifyJWT,
  validateInput,
  MilestoneSuggestionSchema,
  callOpenAI,
  logFunctionCall,
  logFunctionResult,
} from "../_shared/utils.ts";

interface MilestoneSuggestionRequest {
  letterId: string;
  goal: string;
  content?: string;
  sendDate: string;
}

interface Milestone {
  title: string;
  percentage: number;
  target_date: string;
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT token
  const authHeader = req.headers.get("authorization");
  const { user, error: authError } = await verifyJWT(authHeader);

  if (authError || !user) {
    return createErrorResponse(
      "UNAUTHORIZED",
      "Authentication required",
      { authError },
      401
    );
  }

  try {
    const requestData: MilestoneSuggestionRequest = await req.json();

    // Log function call
    logFunctionCall("suggest-milestones", requestData, user.id);

    // Validate input
    const validation = validateInput(MilestoneSuggestionSchema, requestData);
    if (validation.error) {
      return createErrorResponse("VALIDATION_ERROR", validation.error);
    }

    const { letterId, goal, content, sendDate } = requestData;

    // Calculate days between now and send date
    const today = new Date();
    const targetDate = new Date(sendDate);
    const totalDays = Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prompt = `You are an expert goal achievement coach. Based on the following information, suggest 3-5 logical, achievable milestones that will help accomplish this goal.

Goal: ${goal}
Additional Context: ${content || "No additional context provided"}
Timeline: ${totalDays} days until target date (${sendDate})

Requirements:
1. Create 3-5 milestones that build progressively toward the goal
2. Distribute them logically across the timeline
3. Each milestone should have a clear, actionable title
4. Assign appropriate percentage completion (e.g., 20%, 40%, 60%, 80%, 100%)
5. Suggest realistic target dates based on the timeline
6. Make milestones SMART (Specific, Measurable, Achievable, Relevant, Time-bound)

Return ONLY a valid JSON array of milestone objects with this exact structure:
[
  {
    "title": "Milestone title",
    "percentage": 25,
    "target_date": "YYYY-MM-DD",
    "description": "Brief description of what this milestone involves"
  }
]

Keep titles concise (max 50 characters) and descriptions helpful but brief (max 150 characters).
Ensure percentages add up logically and target dates are distributed across the timeline.`;

    // Call OpenAI API
    const openAIResult = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are a goal achievement expert. Return only valid JSON arrays of milestone objects as requested. No additional text or formatting.",
        },
        { role: "user", content: prompt },
      ],
      1000,
      0.7
    );

    if (openAIResult.error) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "Failed to generate milestone suggestions",
        { openAIError: openAIResult.error }
      );
    }

    // Parse the JSON response
    let suggestedMilestones: Milestone[];
    try {
      const aiResponse = openAIResult.data.choices[0].message.content;
      suggestedMilestones = JSON.parse(aiResponse);
    } catch (parseError) {
      return createErrorResponse(
        "PARSE_ERROR",
        "Invalid response format from AI",
        { parseError: parseError.message }
      );
    }

    // Validate the response structure
    if (!Array.isArray(suggestedMilestones)) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "AI response is not an array"
      );
    }

    // Validate each milestone has required fields
    for (const milestone of suggestedMilestones) {
      if (!milestone.title || !milestone.percentage || !milestone.target_date) {
        return createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid milestone structure",
          { milestone }
        );
      }
    }

    // Log successful result
    logFunctionResult("suggest-milestones", { suggestedMilestones });

    // Return success response
    return createSuccessResponse({ suggestedMilestones });
  } catch (error) {
    // Log error
    logFunctionResult("suggest-milestones", null, error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      { error: error.message }
    );
  }
});
