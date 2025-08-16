import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { z } from "https://esm.sh/zod@3.23.8";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Type": "application/json",
};

// Standard error response format
export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

// Standard success response format
export interface StandardSuccessResponse<T = Record<string, unknown>> {
  success: true;
  data: T;
  timestamp: string;
}

// User interface for JWT verification
export interface AuthenticatedUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

// Response helper functions
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  status: number = 400
): Response {
  const errorResponse: StandardErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  const successResponse: StandardSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(successResponse), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// JWT verification helper
export async function verifyJWT(
  authHeader: string | null
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  if (!authHeader) {
    return { user: null, error: "No authorization header" };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Invalid authorization header format" };
  }

  const token = authHeader.substring(7);

  if (!supabaseUrl || !supabaseServiceKey) {
    return { user: null, error: "Supabase configuration missing" };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: "Invalid or expired token" };
    }

    return { user: user as AuthenticatedUser };
  } catch (error) {
    return { user: null, error: "Token verification failed" };
  }
}

// Input validation schemas
export const LetterEnhancementSchema = z.object({
  title: z.string().optional(),
  goal: z.string().optional(),
  content: z.string().optional(),
  send_date: z.string().optional(),
});

export const MilestoneSuggestionSchema = z.object({
  letterId: z.string().uuid(),
  goal: z.string().min(1, "Goal is required"),
  content: z.string().optional(),
  sendDate: z.string().min(1, "Send date is required"),
});

export const LetterDeliverySchema = z.object({
  letterId: z.string().uuid(),
  action: z.enum(["schedule", "send"]),
});

// Generic input validation helper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data?: T; error?: string } {
  try {
    const validatedData = schema.parse(data);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { error: `Validation failed: ${errorMessage}` };
    }
    return { error: "Invalid input data" };
  }
}

// OpenAI API helper
export async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 800,
  temperature: number = 0.7
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!openAIApiKey) {
    return { error: "OpenAI API key not configured" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `OpenAI API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { error: `OpenAI API call failed: ${errorMessage}` };
  }
}

// Logging helper
export function logFunctionCall(
  functionName: string,
  input: Record<string, unknown>,
  userId?: string
) {
  console.log(`=== ${functionName.toUpperCase()} FUNCTION CALL ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`User ID: ${userId || "anonymous"}`);
  console.log(`Input:`, JSON.stringify(input, null, 2));
}

export function logFunctionResult(
  functionName: string,
  result: Record<string, unknown> | null,
  error?: unknown
) {
  if (error) {
    console.error(`=== ${functionName.toUpperCase()} FUNCTION ERROR ===`);
    console.error(`Error:`, error);
  } else {
    console.log(`=== ${functionName.toUpperCase()} FUNCTION SUCCESS ===`);
    console.log(`Result:`, JSON.stringify(result, null, 2));
  }
}
