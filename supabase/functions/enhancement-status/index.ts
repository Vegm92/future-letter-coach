import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createErrorResponse,
  createSuccessResponse,
  verifyJWT,
  logFunctionCall,
  logFunctionResult,
} from "../_shared/utils.ts";

interface StatusResponse {
  available: boolean;
  reason?: string;
  config: {
    hasOpenAIKey: boolean;
    hasSupabaseConfig: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT token (optional for status check)
  const authHeader = req.headers.get("authorization");
  const { user, error: authError } = await verifyJWT(authHeader);

  try {
    // Log function call
    logFunctionCall("enhancement-status", {}, user?.id || "anonymous");

    // Check configuration
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const hasOpenAIKey = !!openAIApiKey;
    const hasSupabaseConfig = !!(supabaseUrl && supabaseServiceKey);

    // Determine availability
    let available = true;
    let reason: string | undefined;

    if (!hasOpenAIKey) {
      available = false;
      reason = "OpenAI API key not configured";
    } else if (!hasSupabaseConfig) {
      available = false;
      reason = "Supabase configuration missing";
    }

    const result: StatusResponse = {
      available,
      reason,
      config: {
        hasOpenAIKey,
        hasSupabaseConfig,
      },
    };

    // Log successful result
    logFunctionResult("enhancement-status", result);

    // Return success response
    return createSuccessResponse(result);
  } catch (error) {
    // Log error
    logFunctionResult("enhancement-status", null, error);

    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred while checking enhancement status",
      { error: error.message }
    );
  }
});
