import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
  verifyJWT,
  validateInput,
  callOpenAI,
  logFunctionCall,
  logFunctionResult,
} from "../_shared/utils.ts";

// Input validation schema for goal enhancement
const GoalEnhancementSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
});

interface GoalEnhancementRequest {
  goal: string;
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
    const requestData: GoalEnhancementRequest = await req.json();

    // Log function call
    logFunctionCall("enhance-goal", requestData, user.id);

    // Validate input
    const validation = validateInput(GoalEnhancementSchema, requestData);
    if (validation.error) {
      return createErrorResponse("VALIDATION_ERROR", validation.error);
    }

    const { goal } = requestData;

    // Call OpenAI API
    const openAIResult = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are a goal clarity expert. Transform vague goals into specific, measurable, inspiring goals. Make them SMART (Specific, Measurable, Achievable, Relevant, Time-bound) while keeping the user's original intent and passion. Keep it concise but motivating.",
        },
        {
          role: "user",
          content: `Please rewrite this goal to be more specific, measurable, and inspiring: "${goal}"`,
        },
      ],
      200,
      0.7
    );

    if (openAIResult.error) {
      return createErrorResponse("OPENAI_API_ERROR", "Failed to enhance goal", {
        openAIError: openAIResult.error,
      });
    }

    const enhancedGoal = openAIResult.data.choices[0].message.content;

    // Log successful result
    logFunctionResult("enhance-goal", { enhancedGoal });

    // Return success response
    return createSuccessResponse({ enhancedGoal });
  } catch (error) {
    // Log error
    logFunctionResult("enhance-goal", null, error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      { error: error.message }
    );
  }
});
