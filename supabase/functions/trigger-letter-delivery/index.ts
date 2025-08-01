import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', letter.user_id)
      .single();

    if (userError || !user?.email) {
      console.error('Error fetching user email:', userError);
      throw new Error('User email not found');
    }

    let emailSent = false;
    let emailError = null;

    // Send email if action is 'send'
    if (action === 'send') {
      try {
        console.log(`Sending email to ${user.email} for letter ${letterId}`);
        
        const emailResponse = await resend.emails.send({
          from: 'Vision Vault <onboarding@resend.dev>',
          to: [user.email],
          subject: `Letter: ${letter.title}`,
          html: `
            <h1>test</h1>
            <p>This is a test email delivery from Vision Vault.</p>
            <p>Letter: ${letter.title}</p>
          `,
        });

        console.log('Email sent successfully:', emailResponse);
        emailSent = true;
      } catch (error: any) {
        console.error('Error sending email:', error);
        emailError = error.message;
      }
    }

    // Create notification record
    const notificationStatus = action === 'schedule' ? 'pending' : (emailSent ? 'sent' : 'failed');
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: letter.user_id,
        letter_id: letter.id,
        type: 'letter_delivery',
        subject: `Letter: ${letter.title}`,
        content: action === 'schedule' 
          ? `Your letter "${letter.title}" has been scheduled for delivery on ${letter.send_date}`
          : (emailSent ? `Your letter "${letter.title}" has been delivered` : `Failed to deliver letter "${letter.title}"`),
        scheduled_for: action === 'schedule' ? letter.send_date : new Date().toISOString(),
        delivery_method: 'email',
        status: notificationStatus,
        error_message: emailError,
        sent_at: emailSent ? new Date().toISOString() : null
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw notificationError;
    }

    // Update letter status only if email was sent successfully (or if just scheduling)
    const newStatus = action === 'schedule' ? 'scheduled' : (emailSent ? 'sent' : 'scheduled');
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