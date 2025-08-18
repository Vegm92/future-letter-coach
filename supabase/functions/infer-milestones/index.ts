import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
import { z } from "https://esm.sh/zod@3.23.8";

// Input validation schema
const MilestoneInferenceSchema = z.object({
  goal: z.string().min(10, "Goal must be at least 10 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  title: z.string().optional(),
});

interface MilestoneInferenceRequest {
  goal: string;
  content: string;
  title?: string;
}

interface InferredMilestone {
  text: string;
  reasoning: string;
  dueDate?: string;
}

interface MilestoneInferenceResponse {
  suggestedMilestones: InferredMilestone[];
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
    const requestData: MilestoneInferenceRequest = await req.json();

    // Log function call
    logFunctionCall("infer-milestones", requestData, user.id);

    // Validate input
    const validation = validateInput(MilestoneInferenceSchema, requestData);
    if (validation.error) {
      return createErrorResponse("VALIDATION_ERROR", validation.error);
    }

    const { goal, content, title } = requestData;

    // Check if OpenAI API key is available
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return createErrorResponse(
        "CONFIGURATION_ERROR",
        "OpenAI API key not configured"
      );
    }

    const systemPrompt = `You are an expert goal strategist and milestone planner. Your task is to analyze a user's goal and letter content to infer meaningful, actionable milestones that will help them achieve their objective.

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "suggestedMilestones": [
    {
      "text": "specific milestone description",
      "reasoning": "why this milestone is important and how it contributes to the goal",
      "dueDate": "YYYY-MM-DD (optional, suggest realistic timeline)"
    }
  ]
}

Guidelines for milestone inference:
- Create 3-5 progressive milestones that logically build toward the main goal
- Make each milestone specific, actionable, and measurable
- Provide clear reasoning for why each milestone matters
- Suggest realistic timelines (next 3-12 months)
- Consider different types of milestones: learning, action, checkpoint, achievement
- Focus on building momentum and maintaining motivation
- Consider potential obstacles and include preparatory milestones`;

    const userPrompt = `Analyze this letter and suggest meaningful milestones:

${title ? `Title: "${title}"` : ""}

Goal: "${goal}"

Letter Content: "${content}"

Based on this information, suggest 3-5 progressive milestones that would help achieve this goal. Focus on creating a logical progression from where they are now to their desired outcome. Return ONLY the JSON response.`;

    // Call OpenAI API
    const openAIResult = await callOpenAI(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      800,
      0.7
    );

    if (openAIResult.error) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "Failed to infer milestones",
        { openAIError: openAIResult.error }
      );
    }

    // Parse the AI response
    let result: MilestoneInferenceResponse;
    try {
      const aiResponse = openAIResult.data.choices[0].message.content;
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback milestone inference if JSON parsing fails
      result = {
        suggestedMilestones: getKeywordBasedMilestones(goal, content),
      };
    }

    // Validate the result has milestones
    if (!result.suggestedMilestones || result.suggestedMilestones.length === 0) {
      result = {
        suggestedMilestones: getKeywordBasedMilestones(goal, content),
      };
    }

    // Log successful result
    logFunctionResult("infer-milestones", result);

    // Return success response
    return createSuccessResponse(result);
  } catch (error) {
    // Log error
    logFunctionResult("infer-milestones", null, error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      { error: error.message }
    );
  }
});

// Fallback milestone inference function
function getKeywordBasedMilestones(
  goal: string,
  content: string
): InferredMilestone[] {
  const combinedText = `${goal} ${content}`.toLowerCase();
  const milestones: InferredMilestone[] = [];

  // Helper function to generate dates
  const getDateFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  // Fitness/Health milestones
  if (
    combinedText.includes("fitness") ||
    combinedText.includes("health") ||
    combinedText.includes("exercise") ||
    combinedText.includes("workout") ||
    combinedText.includes("weight")
  ) {
    milestones.push(
      {
        text: "Establish consistent workout routine",
        reasoning:
          "Building the habit is crucial in the beginning - consistency matters more than intensity",
        dueDate: getDateFromNow(14),
      },
      {
        text: "Reach initial fitness benchmark",
        reasoning:
          "Having measurable progress keeps motivation high and provides clear wins",
        dueDate: getDateFromNow(45),
      },
      {
        text: "Evaluate and adjust fitness plan",
        reasoning:
          "Regular assessment ensures the plan remains effective and sustainable",
        dueDate: getDateFromNow(90),
      }
    );
  }
  // Learning/Skills milestones
  else if (
    combinedText.includes("learn") ||
    combinedText.includes("skill") ||
    combinedText.includes("study") ||
    combinedText.includes("course") ||
    combinedText.includes("education")
  ) {
    milestones.push(
      {
        text: "Complete foundational learning materials",
        reasoning:
          "Strong foundations are essential for building advanced skills effectively",
        dueDate: getDateFromNow(30),
      },
      {
        text: "Apply knowledge in practical project",
        reasoning:
          "Practical application solidifies learning and builds real-world experience",
        dueDate: getDateFromNow(60),
      },
      {
        text: "Teach or share knowledge with others",
        reasoning:
          "Teaching reinforces learning and builds confidence in your new skills",
        dueDate: getDateFromNow(90),
      }
    );
  }
  // Career milestones
  else if (
    combinedText.includes("career") ||
    combinedText.includes("job") ||
    combinedText.includes("work") ||
    combinedText.includes("professional") ||
    combinedText.includes("promotion")
  ) {
    milestones.push(
      {
        text: "Update professional profile and resume",
        reasoning:
          "Professional presence is the foundation for career advancement opportunities",
        dueDate: getDateFromNow(7),
      },
      {
        text: "Complete first networking activity",
        reasoning:
          "Active networking accelerates career opportunities and opens new doors",
        dueDate: getDateFromNow(30),
      },
      {
        text: "Apply for target position or opportunity",
        reasoning:
          "Taking action on opportunities is essential for career progression",
        dueDate: getDateFromNow(60),
      }
    );
  }
  // Personal development milestones
  else if (
    combinedText.includes("personal") ||
    combinedText.includes("growth") ||
    combinedText.includes("mindset") ||
    combinedText.includes("habits") ||
    combinedText.includes("improve")
  ) {
    milestones.push(
      {
        text: "Establish daily reflection practice",
        reasoning:
          "Regular self-reflection accelerates personal growth and self-awareness",
        dueDate: getDateFromNow(14),
      },
      {
        text: "Implement one new positive habit",
        reasoning:
          "Small habit changes compound over time to create significant transformation",
        dueDate: getDateFromNow(30),
      },
      {
        text: "Complete personal development assessment",
        reasoning:
          "Regular evaluation ensures you're progressing toward your authentic goals",
        dueDate: getDateFromNow(75),
      }
    );
  }
  // Default generic milestones
  else {
    milestones.push(
      {
        text: "Define specific action steps",
        reasoning:
          "Breaking down your goal into actionable steps makes it achievable and less overwhelming",
        dueDate: getDateFromNow(7),
      },
      {
        text: "Complete first major milestone",
        reasoning:
          "Early wins build momentum and confidence for long-term success",
        dueDate: getDateFromNow(30),
      },
      {
        text: "Review progress and adjust approach",
        reasoning:
          "Regular reflection ensures you stay on track and adapt to challenges",
        dueDate: getDateFromNow(60),
      },
      {
        text: "Celebrate achievements and plan next phase",
        reasoning:
          "Acknowledging progress maintains motivation and sets foundation for continued growth",
        dueDate: getDateFromNow(90),
      }
    );
  }

  return milestones;
}
