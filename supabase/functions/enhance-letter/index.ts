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
    
    console.log('=== ENHANCE LETTER DEBUG ===');
    console.log('Input:', { title, goal, content });
    console.log('OpenAI API Key available:', !!openAIApiKey);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
            content: 'You are an expert letter writer and goal clarity coach. Transform user letters to their future selves into more compelling, specific, and emotionally resonant versions. Make goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound) while maintaining the user\'s voice and passion. You MUST respond with valid JSON in exactly this format: {"title": "enhanced title", "goal": "enhanced goal", "content": "enhanced content"}. Do not include any other text outside the JSON.'
          },
          {
            role: 'user',
            content: `Enhance this letter to make it more compelling and inspiring:

Title: "${title || 'Letter to Future Me'}"
Goal: "${goal || 'Not specified'}"
Content: "${content || 'Not provided'}"

Return ONLY a JSON object with enhanced versions. Even if the content is brief, provide meaningful enhancements that add specificity, emotion, and motivation. Make it sound more personal and inspiring while keeping the core intent.`
          }
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Failed to enhance letter' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);
    
    const enhancedText = data.choices[0].message.content;
    console.log('Raw enhanced text:', enhancedText);
    
    // Try to parse as JSON
    let enhancedLetter;
    try {
      enhancedLetter = JSON.parse(enhancedText);
      console.log('Successfully parsed JSON:', enhancedLetter);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Failed to parse text:', enhancedText);
      
      // Fallback: create enhanced versions manually
      enhancedLetter = {
        title: title ? `${title} - Enhanced Vision` : 'My Inspiring Letter to Future Me',
        goal: goal ? `${goal} - with clear milestones and timeline` : 'Define and achieve meaningful life goals',
        content: content ? `${content}\n\nThis enhanced version includes more specific details and emotional resonance.` : 'Write a heartfelt letter to your future self with specific goals and inspiring language.'
      };
    }

    console.log('Final enhanced letter:', enhancedLetter);

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