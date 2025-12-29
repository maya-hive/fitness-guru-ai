import sgMail from "@sendgrid/mail";

// Validate and set API key
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

if (apiKey.trim() === '') {
  throw new Error('SENDGRID_API_KEY environment variable is empty');
}

sgMail.setApiKey(apiKey);

export async function sendPlanEmail({ to, sessionId }) {
  const planUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/plan/${sessionId}`;

  // Get and validate from email
  let fromEmail = (process.env.EMAIL_FROM || process.env.FROM_EMAIL || '').trim();

  if (!fromEmail) {
    throw new Error('EMAIL_FROM or FROM_EMAIL environment variable is not set');
  }

  // Log the from email for debugging (mask sensitive parts)
  const maskedFrom = fromEmail.includes('@')
    ? fromEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : fromEmail;
  console.log(`Sending email from: ${maskedFrom}`);

  const msg = {
    to,
    from: fromEmail,
    subject: "Your Personalized Fitness Plan – Quantum Fitness",
    html: emailTemplate({ planUrl })
  };

  console.log('msg', msg);

  try {
    await sgMail.send(msg)
      .then(() => { }, error => {
        console.error(error);

        if (error.response) {
          console.error(error.response.body)
        }
      });
  } catch (error) {
    // Enhanced error logging for SendGrid errors
    const maskedFrom = msg.from
      ? (msg.from.includes('@') ? msg.from.replace(/(.{2})(.*)(@.*)/, '$1***$3') : msg.from)
      : 'NOT SET';

    const statusCode = error.code || error.response?.statusCode;
    const errorBody = error.response?.body;
    const errorMessage = error.message || 'Unknown error';

    const errorDetails = {
      to,
      sessionId,
      from: maskedFrom,
      fromLength: msg.from?.length || 0,
      fromHasAt: msg.from?.includes('@') || false,
      error: errorMessage,
      statusCode,
      responseBody: errorBody ? JSON.stringify(errorBody, null, 2) : undefined,
      responseHeaders: error.response?.headers
    };

    console.error('Failed to send email:', errorDetails);

    // Log specific SendGrid error details if available
    if (errorBody) {
      console.error('SendGrid error details:', JSON.stringify(errorBody, null, 2));
    }

    // Handle authorization errors specifically
    if (statusCode === 403 ||
      errorMessage.toLowerCase().includes('not authorized') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      (errorBody?.errors?.some(e =>
        e.message?.toLowerCase().includes('not authorized') ||
        e.message?.toLowerCase().includes('unauthorized') ||
        e.message?.toLowerCase().includes('permission')
      ))) {
      console.error('========================================');
      console.error('SENDGRID AUTHORIZATION ERROR DETECTED');
      console.error('========================================');
      console.error('This error typically means:');
      console.error('  1. The API key does not have "Mail Send" permission enabled');
      console.error('  2. The API key is invalid or expired');
      console.error('  3. The API key belongs to a different SendGrid account');
      console.error('');
      console.error('How to fix:');
      console.error('  1. Go to SendGrid Dashboard > Settings > API Keys');
      console.error('  2. Check that your API key has "Mail Send" permission');
      console.error('  3. If not, create a new API key with "Full Access" or "Restricted Access" with "Mail Send" enabled');
      console.error('  4. Update your SENDGRID_API_KEY environment variable with the new key');
      console.error('  5. Restart your application');
      console.error('');
      console.error('Current API key status:');
      console.error(`  - API key is set: ${!!apiKey}`);
      console.error(`  - API key length: ${apiKey?.length || 0} characters`);
      console.error(`  - API key starts with: ${apiKey?.substring(0, 7) || 'N/A'}...`);
      console.error('========================================');

      // Create a more helpful error message
      const authError = new Error(
        'SendGrid API key is not authorized to send emails. ' +
        'Please verify that your API key has "Mail Send" permission enabled in the SendGrid dashboard.'
      );
      authError.statusCode = statusCode;
      authError.originalError = error;
      throw authError;
    }

    // Additional diagnostics for "Invalid from email address" error
    if (errorBody?.errors?.some(e => e.field === 'from')) {
      console.error('DIAGNOSTICS for Invalid from email:');
      console.error(`  - From email value: "${msg.from}"`);
      console.error(`  - Email length: ${msg.from?.length || 0}`);
      console.error(`  - Contains @: ${msg.from?.includes('@') || false}`);
      console.error(`  - Trimmed value: "${msg.from?.trim()}"`);
      console.error('  - Common causes:');
      console.error('    1. Email not verified in SendGrid dashboard');
      console.error('    2. Email contains extra whitespace or invalid characters');
      console.error('    3. Email format is incorrect (should be: email@domain.com or "Name <email@domain.com>")');
      console.error('    4. Email domain not authenticated in SendGrid');
    }

    throw error;
  }
}

function emailTemplate({ planUrl }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Your Fitness Plan</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            
            <tr>
              <td style="background:#0f172a;padding:24px;color:#ffffff;">
                <h2 style="margin:0;font-size:22px;">Quantum Fitness Guru</h2>
                <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">
                  Your AI-Powered Personal Training Assistant
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;">
                <h3 style="margin-top:0;color:#111827;">
                  Your personalized fitness plan is ready 💪
                </h3>

                <p style="color:#374151;font-size:15px;line-height:1.6;">
                  You can view your full workout and recovery plan securely using the link below.
                  This link allows you to access your plan anytime, from any device.
                </p>

                <div style="text-align:center;margin:32px 0;">
                  <a href="${planUrl}"
                     style="background:#2563eb;color:#ffffff;text-decoration:none;
                            padding:14px 24px;border-radius:6px;
                            display:inline-block;font-weight:bold;">
                    View My Fitness Plan
                  </a>
                </div>

                <p style="color:#6b7280;font-size:13px;line-height:1.5;">
                  For your privacy, we don't include workout details directly in emails.
                  If you didn't request this plan, you can safely ignore this message.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f9fafb;padding:16px;text-align:center;
                         color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} Quantum Fitness
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

