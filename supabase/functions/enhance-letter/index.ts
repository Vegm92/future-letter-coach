import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, goal, content } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert letter writer and goal clarity coach. Transform user letters to their future selves into more compelling, specific, and emotionally resonant versions. Make goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound) while maintaining the user\'s voice and passion. Return a JSON object with enhanced versions of the title, goal, and content.'
          },
          {
            role: 'user',
            content: `Please enhance this letter to make it more compelling and inspiring:

Title: "${title || 'Letter to Future Me'}"
Goal: "${goal || 'Not specified'}"
Content: "${content || 'Not provided'}"

Please return a JSON object with enhanced versions of all three fields. Make sure the enhanced content flows naturally and feels personal while being more specific and motivating.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;
    
    // Try to parse as JSON, fallback to structured response if needed
    let enhancedLetter;
    try {
      enhancedLetter = JSON.parse(enhancedText);
    } catch {
      // Fallback: create structured response
      enhancedLetter = {
        title: title || 'Enhanced Letter to Future Me',
        goal: goal || 'Your enhanced goal',
        content: content || 'Your enhanced letter content'
      };
    }

    return new Response(JSON.stringify({ enhancedLetter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error enhancing letter:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});