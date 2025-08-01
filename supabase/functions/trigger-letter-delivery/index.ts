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
        const startTime = Date.now();
        console.log(`=== EMAIL DELIVERY START ===`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Letter ID: ${letterId}`);
        console.log(`Recipient: ${user.email}`);
        console.log(`Letter Title: ${letter.title}`);
        console.log(`Letter Content Preview: ${letter.content.substring(0, 100)}...`);
        console.log(`Letter Goal: ${letter.goal}`);
        console.log(`Send Date: ${letter.send_date}`);
        
        const emailPayload = {
          from: 'Vision Vault <onboarding@resend.dev>',
          to: [user.email],
          subject: `Letter: ${letter.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
                Your Vision Vault Letter: ${letter.title}
              </h1>
              
              <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h2 style="color: #666; margin-top: 0;">Your Goal:</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">${letter.ai_enhanced_goal || letter.goal}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <h2 style="color: #666;">Your Letter:</h2>
                <div style="background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 10px 0;">
                  ${letter.content.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>Scheduled for:</strong> ${new Date(letter.send_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  This letter was sent to you by Vision Vault - helping you achieve your future goals.
                </p>
              </div>
            </div>
          `,
        };
        
        console.log(`=== EMAIL PAYLOAD ===`);
        console.log(`From: ${emailPayload.from}`);
        console.log(`To: ${emailPayload.to.join(', ')}`);
        console.log(`Subject: ${emailPayload.subject}`);
        console.log(`HTML Content Length: ${emailPayload.html.length} characters`);
        
        console.log(`Sending email via Resend API...`);
        const emailResponse = await resend.emails.send(emailPayload);
        
        const duration = Date.now() - startTime;
        console.log(`=== EMAIL DELIVERY SUCCESS ===`);
        console.log(`Duration: ${duration}ms`);
        console.log(`Email ID: ${emailResponse.data?.id || 'N/A'}`);
        console.log(`Response:`, JSON.stringify(emailResponse, null, 2));
        console.log(`=== EMAIL DELIVERY END ===`);
        
        emailSent = true;
      } catch (error: any) {
        const duration = Date.now() - (Date.now() - 1000); // Approximate duration
        console.error(`=== EMAIL DELIVERY FAILED ===`);
        console.error(`Duration: ${duration}ms`);
        console.error(`Error Type: ${error.constructor.name}`);
        console.error(`Error Message: ${error.message}`);
        console.error(`Full Error:`, JSON.stringify(error, null, 2));
        console.error(`=== EMAIL DELIVERY END ===`);
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