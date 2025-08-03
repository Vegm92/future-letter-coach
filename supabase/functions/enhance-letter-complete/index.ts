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
    const { title, goal, content, send_date } = await req.json();
    
    console.log('=== ENHANCE LETTER COMPLETE DEBUG ===');
    console.log('Input:', { title, goal, content, send_date });

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
            content: `You are an expert letter writer and goal clarity coach. You will enhance a letter to someone's future self and generate milestone suggestions. 

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "enhancedLetter": {
    "title": "enhanced title",
    "goal": "enhanced SMART goal", 
    "content": "enhanced content"
  },
  "suggestedMilestones": [
    {
      "title": "milestone title",
      "percentage": 25,
      "target_date": "YYYY-MM-DD",
      "description": "milestone description"
    }
  ]
}

For the enhanced letter: Make goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound) while maintaining the user's voice and passion. Add specificity, emotion, and motivation.

For milestones: Create 4-6 progressive milestones that logically build toward the goal. Use the send date as the final deadline. Distribute percentages evenly (e.g., 20%, 40%, 60%, 80%, 100%). Make each milestone specific and actionable.`
          },
          {
            role: 'user',
            content: `Enhance this letter and create milestone suggestions:

Title: "${title || 'Letter to Future Me'}"
Goal: "${goal || 'Not specified'}"
Content: "${content || 'Not provided'}"
Send Date: "${send_date || 'Not specified'}"

Use the send date as the target deadline for planning milestones. Return ONLY the JSON response.`
          }
        ],
        max_tokens: 800,
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
    let result;
    try {
      result = JSON.parse(enhancedText);
      console.log('Successfully parsed JSON:', result);
      
      // Validate the structure
      if (!result.enhancedLetter || !result.suggestedMilestones) {
        throw new Error('Invalid response structure');
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Failed to parse text:', enhancedText);
      
      // Fallback: create enhanced versions manually
      result = {
        enhancedLetter: {
          title: title ? `${title} - Enhanced Vision` : 'My Inspiring Letter to Future Me',
          goal: goal ? `${goal} - with clear milestones and timeline` : 'Define and achieve meaningful life goals',
          content: content ? `${content}\n\nThis enhanced version includes more specific details and emotional resonance.` : 'Write a heartfelt letter to your future self with specific goals and inspiring language.'
        },
        suggestedMilestones: [
          {
            title: "Initial Planning & Setup",
            percentage: 25,
            target_date: send_date || "2025-12-31",
            description: "Begin your journey with proper planning and initial steps."
          },
          {
            title: "Midway Progress Check",
            percentage: 50,
            target_date: send_date || "2025-12-31", 
            description: "Evaluate progress and adjust your approach as needed."
          },
          {
            title: "Final Achievement",
            percentage: 100,
            target_date: send_date || "2025-12-31",
            description: "Complete your goal and celebrate your success."
          }
        ]
      };
    }

    console.log('Final result:', result);

    return new Response(JSON.stringify(result), {
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