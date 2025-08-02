import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { letterId, goal, content, sendDate } = await req.json();
    
    if (!letterId || !goal) {
      return new Response(
        JSON.stringify({ error: 'Letter ID and goal are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating milestone suggestions for letter:', letterId);

    // Calculate days between now and send date
    const today = new Date();
    const targetDate = new Date(sendDate);
    const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `
You are an expert goal achievement coach. Based on the following information, suggest 3-5 logical, achievable milestones that will help accomplish this goal.

Goal: ${goal}
Additional Context: ${content || 'No additional context provided'}
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
Ensure percentages add up logically and target dates are distributed across the timeline.
`;

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
            content: 'You are a goal achievement expert. Return only valid JSON arrays of milestone objects as requested. No additional text or formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate milestone suggestions');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI response:', aiResponse);

    // Parse the JSON response
    let suggestedMilestones;
    try {
      suggestedMilestones = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', aiResponse);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    if (!Array.isArray(suggestedMilestones)) {
      throw new Error('AI response is not an array');
    }

    // Validate each milestone has required fields
    for (const milestone of suggestedMilestones) {
      if (!milestone.title || !milestone.percentage || !milestone.target_date) {
        throw new Error('Invalid milestone structure');
      }
    }

    console.log('Generated milestones:', suggestedMilestones);

    return new Response(
      JSON.stringify({ suggestedMilestones }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in suggest-milestones function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});