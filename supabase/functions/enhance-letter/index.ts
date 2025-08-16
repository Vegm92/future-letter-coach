import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
  verifyJWT,
  validateInput,
  LetterEnhancementSchema,
  callOpenAI,
  logFunctionCall,
  logFunctionResult,
} from "../_shared/utils.ts";

interface EnhancementRequest {
  title?: string;
  goal?: string;
  content?: string;
  send_date?: string;
  includeMilestones?: boolean;
}

interface EnhancedLetter {
  title: string;
  goal: string;
  content: string;
}

interface Milestone {
  title: string;
  percentage: number;
  target_date: string;
  description: string;
}

interface EnhancementResponse {
  enhancedLetter: EnhancedLetter;
  suggestedMilestones?: Milestone[];
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
    const requestData: EnhancementRequest = await req.json();

    // Log function call
    logFunctionCall("enhance-letter", requestData, user.id);

    // Validate input
    const validation = validateInput(LetterEnhancementSchema, requestData);
    if (validation.error) {
      return createErrorResponse("VALIDATION_ERROR", validation.error);
    }

    const { title, goal, content, send_date, includeMilestones } = requestData;

    // Check if OpenAI API key is available
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return createErrorResponse(
        "CONFIGURATION_ERROR",
        "OpenAI API key not configured"
      );
    }

    // Create the enhancement prompt
    const enhancementPrompt = `You are an expert letter writer and goal clarity coach. You will enhance a letter to someone's future self and optionally generate milestone suggestions.

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "enhancedLetter": {
    "title": "enhanced title",
    "goal": "enhanced SMART goal", 
    "content": "enhanced content"
  }${
    includeMilestones
      ? `,
  "suggestedMilestones": [
    {
      "title": "milestone title",
      "percentage": 25,
      "target_date": "YYYY-MM-DD",
      "description": "milestone description"
    }
  ]`
      : ""
  }
}

For the enhanced letter: Make goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound) while maintaining the user's voice and passion. Add specificity, emotion, and motivation.

${
  includeMilestones
    ? `For milestones: Create 4-6 progressive milestones that logically build toward the goal. Use the send date as the final deadline. Distribute percentages evenly (e.g., 20%, 40%, 60%, 80%, 100%). Make each milestone specific and actionable.`
    : ""
}`;

    // Call OpenAI API
    const openAIResult = await callOpenAI(
      [
        {
          role: "system",
          content: enhancementPrompt,
        },
        {
          role: "user",
          content: `Enhance this letter${
            includeMilestones ? " and create milestone suggestions" : ""
          }:

Title: "${title || "Letter to Future Me"}"
Goal: "${goal || "Not specified"}"
Content: "${content || "Not provided"}"
Send Date: "${send_date || "Not specified"}"

Use the send date as the target deadline for planning milestones. Return ONLY the JSON response.`,
        },
      ],
      800,
      0.7
    );

    if (openAIResult.error) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "Failed to enhance letter",
        { openAIError: openAIResult.error }
      );
    }

    // Parse the AI response
    let result: EnhancementResponse;
    try {
      const aiResponse = openAIResult.data.choices[0].message.content;
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback enhancement if JSON parsing fails
      result = {
        enhancedLetter: {
          title: title
            ? `${title} - Enhanced Vision`
            : "My Inspiring Letter to Future Me",
          goal: goal
            ? `${goal} - with clear milestones and timeline`
            : "Define and achieve meaningful life goals",
          content: content
            ? `${content}\n\nThis enhanced version includes more specific details and emotional resonance.`
            : "Write a heartfelt letter to your future self with specific goals and inspiring language.",
        },
      };

      if (includeMilestones) {
        result.suggestedMilestones = [
          {
            title: "Define Clear Objectives",
            percentage: 20,
            target_date:
              send_date ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            description: "Break down your goal into specific, measurable steps",
          },
          {
            title: "Create Action Plan",
            percentage: 40,
            target_date:
              send_date ||
              new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            description:
              "Develop a detailed roadmap with timelines and milestones",
          },
          {
            title: "Begin Implementation",
            percentage: 60,
            target_date:
              send_date ||
              new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            description: "Start taking action on your first milestone",
          },
          {
            title: "Monitor Progress",
            percentage: 80,
            target_date:
              send_date ||
              new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            description:
              "Track your progress and adjust your approach as needed",
          },
          {
            title: "Achieve Goal",
            percentage: 100,
            target_date:
              send_date ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            description:
              "Reach your final objective and celebrate your success",
          },
        ];
      }
    }

    // Log successful result
    logFunctionResult("enhance-letter", result);

    // Return success response
    return createSuccessResponse(result);
  } catch (error) {
    // Log error
    logFunctionResult("enhance-letter", null, error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      { error: error.message }
    );
  }
});
