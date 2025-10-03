/**
 * HTML Email Templates for Insurance Claims
 *
 * Professional email templates with Roof-ER branding
 * Converts plain text templates to rich HTML emails
 */

export interface EmailTemplate {
  subject: string
  html: string
  plainText: string
}

/**
 * Convert plain text template to professional HTML email
 */
export function convertToHTMLEmail(
  plainTextDocument: string,
  templateName: string,
  recipientName?: string
): EmailTemplate {
  // Extract subject from document (first line starting with "Subject:")
  const subjectMatch = plainTextDocument.match(/Subject:\s*(.+)/i)
  const subject = subjectMatch ? subjectMatch[1].trim() : `Insurance Claim - ${templateName}`

  // Remove subject line from body
  const bodyWithoutSubject = plainTextDocument.replace(/Subject:\s*.+\n\n?/i, '')

  // Convert markdown-style headers to HTML
  let htmlBody = bodyWithoutSubject
    // ## Headers
    .replace(/^## (.+)$/gm, '<h2 style="color: #111827; font-size: 18px; font-weight: bold; margin: 25px 0 15px 0; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">$1</h2>')
    // ### Sub-headers
    .replace(/^### (.+)$/gm, '<h3 style="color: #374151; font-size: 16px; font-weight: bold; margin: 20px 0 12px 0;">$1</h3>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li style="margin: 8px 0; color: #374151;">$1</li>')
    // Bullet points with -
    .replace(/^-\s+(.+)$/gm, '<li style="margin: 8px 0; color: #374151;">$1</li>')
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #111827;">$1</strong>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p style="margin: 12px 0; color: #374151; line-height: 1.6;">')

  // Wrap lists in <ul> or <ol>
  htmlBody = htmlBody.replace(/(<li[\s\S]+<\/li>)/g, '<ul style="margin: 15px 0; padding-left: 25px; list-style-type: disc;">$1</ul>')

  // Wrap in paragraph tags
  if (!htmlBody.startsWith('<h2') && !htmlBody.startsWith('<p')) {
    htmlBody = `<p style="margin: 12px 0; color: #374151; line-height: 1.6;">${htmlBody}</p>`
  }

  // Build the complete HTML email
  const html = buildEmailHTML(htmlBody, subject, recipientName)

  return {
    subject,
    html,
    plainText: plainTextDocument
  }
}

/**
 * Build complete HTML email with Roof-ER branding
 */
function buildEmailHTML(bodyContent: string, subject: string, recipientName?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email Container -->
        <table role="presentation" style="max-width: 650px; width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 10px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px 40px; text-align: center;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                      <span style="font-size: 35px;">🏠</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                      ROOF<span style="color: #fca5a5;">-ER</span>
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #fca5a5; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                      Professional Roofing Services
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              ${recipientName ? `<p style="margin: 0 0 20px 0; color: #111827; font-size: 15px; font-weight: 600;">Dear ${recipientName},</p>` : ''}

              ${bodyContent}
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #111827; font-weight: 600; font-size: 15px;">Professionally,</p>
                <p style="margin: 0 0 4px 0; color: #dc2626; font-weight: bold; font-size: 16px;">Roof-ER Roofing Team</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">Your Trusted Roofing Insurance Specialists</p>
              </div>

              <!-- Contact Info -->
              <div style="margin-top: 25px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #dc2626; border-radius: 6px;">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Contact Information</p>
                <table role="presentation" style="width: 100%; font-size: 13px; color: #6b7280;">
                  <tr>
                    <td style="padding: 4px 0;">📞 Phone:</td>
                    <td style="padding: 4px 0; font-weight: 500; color: #374151;">(555) 123-4567</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;">✉️ Email:</td>
                    <td style="padding: 4px 0; font-weight: 500; color: #374151;">claims@roof-er.com</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;">🌐 Website:</td>
                    <td style="padding: 4px 0; font-weight: 500; color: #374151;">www.roof-er.com</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 25px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                This email was generated by <strong style="color: #fca5a5;">SusanAI-21</strong>, your intelligent roofing insurance assistant.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 11px;">
                © ${new Date().getFullYear()} Roof-ER Professional Roofing Services. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Create a simple notification email
 */
export function createNotificationEmail(
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${title}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                ${message}
              </p>

              ${actionUrl ? `
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${actionUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                    ${actionText || 'View Details'}
                  </a>
                </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Powered by SusanAI-21 | Roof-ER Assistant
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Extract recipient name from email content
 */
export function extractRecipientName(emailContent: string): string | undefined {
  // Look for patterns like "Dear [Name]," or "[Name],"
  const patterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),/m,  // "John Smith," or "John,"
    /Dear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,  // "Dear John Smith" or "Dear John"
  ]

  for (const pattern of patterns) {
    const match = emailContent.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return undefined
}
