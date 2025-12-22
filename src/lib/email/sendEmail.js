import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPlanEmail({ to, sessionId }) {
    const planUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/plan/${sessionId}`;

    const msg = {
        to,
        from: process.env.EMAIL_FROM || process.env.FROM_EMAIL,
        subject: "Your Personalized Fitness Plan – Quantum Fitness",
        html: emailTemplate({ planUrl })
    };

    await sgMail.send(msg);
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

