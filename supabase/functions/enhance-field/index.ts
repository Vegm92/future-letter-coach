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
const FieldEnhancementSchema = z.object({
  field: z.enum(["title", "goal", "content"]),
  value: z.string().min(1, "Value is required"),
  context: z
    .object({
      title: z.string().optional(),
      goal: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

interface FieldEnhancementRequest {
  field: "title" | "goal" | "content";
  value: string;
  context?: {
    title?: string;
    goal?: string;
    content?: string;
  };
}

interface FieldEnhancementResponse {
  suggestion: string;
  explanation: string;
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
    const requestData: FieldEnhancementRequest = await req.json();

    // Log function call
    logFunctionCall("enhance-field", requestData, user.id);

    // Validate input
    const validation = validateInput(FieldEnhancementSchema, requestData);
    if (validation.error) {
      return createErrorResponse("VALIDATION_ERROR", validation.error);
    }

    const { field, value, context } = requestData;

    // Check if OpenAI API key is available
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return createErrorResponse(
        "CONFIGURATION_ERROR",
        "OpenAI API key not configured"
      );
    }

    // Create contextual enhancement prompts based on field type
    let systemPrompt = "";
    let userPrompt = "";

    switch (field) {
      case "title":
        systemPrompt = `You are an expert writer specializing in creating compelling, emotional titles for personal letters to future selves. Your task is to enhance letter titles while maintaining the user's original intent and voice.

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "suggestion": "enhanced title",
  "explanation": "brief explanation of what was improved and why"
}

Guidelines for title enhancement:
- Add emotional depth and forward-looking language
- Make it personal and inspiring
- Keep it concise but impactful
- Maintain the user's core message
- Add elements that create anticipation or hope`;

        userPrompt = `Enhance this letter title: "${value}"

${
  context
    ? `Context from the letter:
${context.goal ? `Goal: ${context.goal}` : ""}
${context.content ? `Content excerpt: ${context.content.substring(0, 200)}...` : ""}`
    : ""
}

Return ONLY the JSON response with your enhanced title and explanation.`;
        break;

      case "goal":
        systemPrompt = `You are a goal-setting expert and life coach. Your task is to enhance personal goals to make them more SMART (Specific, Measurable, Achievable, Relevant, Time-bound) while maintaining the user's passion and personal voice.

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "suggestion": "enhanced goal with specific strategies and mindset framing",
  "explanation": "brief explanation of what was improved and why"
}

Guidelines for goal enhancement:
- Make goals more specific and actionable
- Add strategies for achievement
- Include mindset and motivation elements
- Maintain the user's personal voice and passion
- Suggest concrete steps or approaches`;

        userPrompt = `Enhance this personal goal: "${value}"

${
  context
    ? `Additional context:
${context.title ? `Letter title: ${context.title}` : ""}
${context.content ? `Letter content: ${context.content.substring(0, 300)}...` : ""}`
    : ""
}

Make it more actionable and inspiring while keeping the personal touch. Return ONLY the JSON response.`;
        break;

      case "content":
        systemPrompt = `You are an expert in personal letter writing and emotional communication. Your task is to enhance letter content while preserving the user's authentic voice and personal message.

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "suggestion": "enhanced letter content",
  "explanation": "brief explanation of what was improved and why"
}

Guidelines for content enhancement:
- Improve emotional connection and warmth
- Add encouraging and motivating language
- Maintain the user's personal voice and style
- Enhance clarity and impact
- Include forward-looking hope and confidence
- Keep the personal, intimate tone of a letter to future self`;

        userPrompt = `Enhance this letter content: "${value}"

${
  context
    ? `Context:
${context.title ? `Title: ${context.title}` : ""}
${context.goal ? `Goal: ${context.goal}` : ""}`
    : ""
}

Improve the emotional connection and impact while maintaining the personal voice. Return ONLY the JSON response.`;
        break;
    }

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
      500,
      0.7
    );

    if (openAIResult.error) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "Failed to enhance field",
        { openAIError: openAIResult.error }
      );
    }

    // Parse the AI response
    let result: FieldEnhancementResponse;
    try {
      const aiResponse = openAIResult.data.choices[0].message.content;
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback enhancement if JSON parsing fails
      result = {
        suggestion: getSimpleEnhancement(field, value),
        explanation: `Added improvements to make your ${field} more impactful and engaging.`,
      };
    }

    // Log successful result
    logFunctionResult("enhance-field", result);

    // Return success response
    return createSuccessResponse(result);
  } catch (error) {
    // Log error
    logFunctionResult("enhance-field", null, error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      { error: error.message }
    );
  }
});

// Fallback enhancement function
function getSimpleEnhancement(field: string, value: string): string {
  switch (field) {
    case "title":
      return `${value} - A Journey of Growth and Discovery`;
    case "goal":
      return `${value}\n\nI will achieve this by setting clear milestones, staying consistent with daily actions, and celebrating small wins along the way. This goal represents not just an outcome, but a transformation in who I am becoming.`;
    case "content":
      return `Dear Future Me,\n\n${value}\n\nAs I write this, I feel both excited and nervous about the journey ahead. I know there will be challenges, but I also know that every step forward is building the person I want to become.\n\nI believe in us, and I can't wait to see how far we've come when you read this.\n\nWith love and determination,\nPast You`;
    default:
      return value;
  }
}
