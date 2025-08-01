import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerDeliveryRequest {
  letterId: string;
  action: 'schedule' | 'send';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { letterId, action }: TriggerDeliveryRequest = await req.json();

    console.log(`Processing ${action} request for letter ${letterId}`);

    // Get the letter details
    const { data: letter, error: letterError } = await supabase
      .from('letters')
      .select('*')
      .eq('id', letterId)
      .single();

    if (letterError) {
      console.error('Error fetching letter:', letterError);
      throw letterError;
    }

    // Create notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: letter.user_id,
        letter_id: letter.id,
        type: action === 'schedule' ? 'schedule' : 'delivery',
        subject: `Letter: ${letter.title}`,
        content: action === 'schedule' 
          ? `Your letter "${letter.title}" has been scheduled for delivery on ${letter.send_date}`
          : `Your letter "${letter.title}" has been delivered`,
        scheduled_for: action === 'schedule' ? letter.send_date : new Date().toISOString(),
        delivery_method: 'email',
        status: action === 'schedule' ? 'pending' : 'sent'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw notificationError;
    }

    // Update letter status
    const newStatus = action === 'schedule' ? 'scheduled' : 'sent';
    const { error: updateError } = await supabase
      .from('letters')
      .update({ status: newStatus })
      .eq('id', letterId);

    if (updateError) {
      console.error('Error updating letter status:', updateError);
      throw updateError;
    }

    console.log(`Successfully processed ${action} for letter ${letterId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Letter ${action === 'schedule' ? 'scheduled' : 'sent'} successfully`,
        newStatus 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in trigger-letter-delivery function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);