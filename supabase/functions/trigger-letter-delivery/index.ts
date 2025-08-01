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
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your FutureLetter AI</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
              
              <!-- Email Container -->
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <div style="display: inline-flex; align-items: center; margin-bottom: 20px;">
                    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                        <path d="M2 2l7.586 7.586"></path>
                        <circle cx="11" cy="11" r="2"></circle>
                      </svg>
                    </div>
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      FutureLetter AI
                    </h1>
                  </div>
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 400;">
                    A letter from your past self has arrived
                  </p>
                </div>
                
                <!-- Main Content -->
                <div style="padding: 40px 30px;">
                  
                  <!-- Letter Title -->
                  <div style="text-align: center; margin-bottom: 40px;">
                    <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                      ${letter.title}
                    </h2>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Delivered on ${new Date(letter.send_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <!-- Goal Section -->
                  <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                      <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 6l-2 6h4l-2 6"></path>
                        </svg>
                      </div>
                      <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">Your Goal</h3>
                    </div>
                    <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      ${letter.ai_enhanced_goal || letter.goal}
                    </p>
                  </div>
                  
                  <!-- Letter Content -->
                  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="position: absolute; top: -1px; left: -1px; right: -1px; height: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;"></div>
                    <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 18px; font-weight: 600;">Your Message</h3>
                    <div style="color: #4b5563; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">
                      ${letter.content}
                    </div>
                  </div>
                  
                  <!-- Reflection Prompt -->
                  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin-top: 30px; text-align: center;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 500;">
                      💭 Take a moment to reflect: How far have you come since writing this letter?
                    </p>
                  </div>
                  
                </div>
                
                <!-- Footer -->
                <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                    Delivered with care by <strong style="color: #4f46e5;">FutureLetter AI</strong>
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    Helping you bridge the gap between dreams and reality
                  </p>
                </div>
                
              </div>
              
            </body>
            </html>
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