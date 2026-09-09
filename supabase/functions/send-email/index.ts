import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

interface WebhookPayload {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      organization_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function generateConfirmationURL(email_data: WebhookPayload['email_data']): string {
  // Use the Supabase Auth verify endpoint with token_hash (NOT PKCE code)
  // This allows verification from any browser/device without PKCE code verifier
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) throw new Error('SUPABASE_URL is required');
  const baseUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/verify`;
  const params = new URLSearchParams({
    token: email_data.token_hash,
    type: email_data.email_action_type,
    redirect_to: email_data.redirect_to || 'https://flourishnpo.com/auth/callback',
  });
  return `${baseUrl}?${params.toString()}`;
}

function getEmailSubject(actionType: string): string {
  switch (actionType) {
    case 'signup':
      return 'Confirm your Flourish account';
    case 'recovery':
      return 'Reset your Flourish password';
    case 'magiclink':
      return 'Your Flourish login link';
    case 'email_change':
      return 'Confirm your email change';
    case 'invite':
      return "You've been invited to Flourish";
    default:
      return 'Flourish notification';
  }
}

function getEmailHtml(user: WebhookPayload['user'], email_data: WebhookPayload['email_data']): string {
  const confirmationUrl = generateConfirmationURL(email_data);
  const userName = user.user_metadata?.full_name || 'there';
  const actionType = email_data.email_action_type;

  let heading = '';
  let message = '';
  let buttonText = '';

  switch (actionType) {
    case 'signup':
      heading = `Welcome to Flourish, ${userName}!`;
      message = 'Thanks for signing up. Please confirm your email address by clicking the button below:';
      buttonText = 'Confirm Email';
      break;
    case 'recovery':
      heading = 'Reset Your Password';
      message = 'Click the button below to reset your password:';
      buttonText = 'Reset Password';
      break;
    case 'magiclink':
      heading = 'Your Login Link';
      message = 'Click the button below to sign in to your account:';
      buttonText = 'Sign In';
      break;
    case 'email_change':
      heading = 'Confirm Email Change';
      message = 'Click the button below to confirm your new email address:';
      buttonText = 'Confirm Email Change';
      break;
    case 'invite':
      heading = "You've Been Invited!";
      message = 'You have been invited to join Flourish. Click the button below to accept:';
      buttonText = 'Accept Invitation';
      break;
    default:
      heading = 'Flourish Notification';
      message = 'Click the button below to continue:';
      buttonText = 'Continue';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${getEmailSubject(actionType)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; background: linear-gradient(135deg, #22a558 0%, #14532d 100%);">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Flourish</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">AI-powered CRM for nonprofits</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #18181b;">${heading}</h2>
              <p style="margin: 0 0 24px; font-size: 16px; color: #52525b;">${message}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #22a558 0%, #14532d 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">${buttonText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; color: #71717a;">Or use this code: <strong style="color: #18181b; font-size: 18px; letter-spacing: 2px;">${email_data.token}</strong></p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa;">&copy; ${new Date().getFullYear()} Flourish. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // Remove the v1,whsec_ prefix if present
  const secret = hookSecret.replace("v1,whsec_", "");
  const wh = new Webhook(secret);

  try {
    const { user, email_data } = wh.verify(payload, headers) as WebhookPayload;

    console.log("Sending email to:", user.email);
    console.log("Email action type:", email_data.email_action_type);
    console.log("Token hash:", email_data.token_hash);

    const { data, error } = await resend.emails.send({
      from: "Flourish <noreply@flourishnpo.com>",
      to: [user.email],
      subject: getEmailSubject(email_data.email_action_type),
      html: getEmailHtml(user, email_data),
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || "Unknown error",
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
