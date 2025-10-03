import { Resend } from 'resend'
import { convertToHTMLEmail, extractRecipientName } from './email-templates'
import { logSentEmail, EmailLog } from './db'

// Initialize Resend only if API key is available (optional feature)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Roof-ER Claims <noreply@susanai-21.vercel.app>'
const ADMIN_EMAIL = 'ahmed.mahmoud@theroofdocs.com'

export async function sendRealTimeNotification(
  repName: string,
  userMessage: string,
  aiResponse: string
) {
  try {
    if (!resend) {
      console.log('Email notifications disabled - RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: 'SusanAI-21 <onboarding@resend.dev>',
      to: ['ahmed.mahmoud@theroofdocs.com'],
      subject: `🔔 New Chat from ${repName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">👁️ SusanAI-21 Real-Time Alert</h1>
          </div>

          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-top: 0;">
              <strong>Rep:</strong> ${repName}<br>
              <strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
            </p>

            <div style="background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; border-radius: 5px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Question from ${repName}</p>
              <p style="margin: 10px 0 0 0; color: #111827; font-size: 14px;">${userMessage}</p>
            </div>

            <div style="background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; border-radius: 5px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">SusanAI-21 Response</p>
              <div style="margin: 10px 0 0 0; color: #111827; font-size: 14px;">${aiResponse.substring(0, 500)}${aiResponse.length > 500 ? '...' : ''}</div>
            </div>

            <p style="text-align: center; margin-top: 20px;">
              <a href="https://susanai-21.vercel.app/admin" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Dashboard</a>
            </p>
          </div>

          <div style="background: #1f2937; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              Powered by SusanAI-21 | Roof-ER Assistant
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

export async function sendNightlyReport(stats: any[], transcripts: any[]) {
  try {
    if (!resend) {
      console.log('Email reports disabled - RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    const totalChats = stats.reduce((sum, rep) => sum + (rep.message_count || 0), 0)
    const totalSessions = stats.reduce((sum, rep) => sum + (rep.session_count || 0), 0)

    // Generate stats HTML
    const statsHTML = stats.map(rep => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-weight: bold; color: #111827;">${rep.rep_name}</td>
        <td style="padding: 12px; text-align: center; color: #374151;">${rep.session_count || 0}</td>
        <td style="padding: 12px; text-align: center; color: #374151;">${rep.message_count || 0}</td>
        <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
          ${rep.first_message ? new Date(rep.first_message).toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) : 'N/A'}
        </td>
        <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
          ${rep.last_message ? new Date(rep.last_message).toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) : 'N/A'}
        </td>
      </tr>
    `).join('')

    // Generate transcripts HTML
    const transcriptsHTML = transcripts.map(session => {
      const messages = session.messages || []
      const messagesHTML = messages.map((msg: any) => `
        <div style="margin: 10px 0; padding: 10px; background: ${msg.role === 'user' ? '#eff6ff' : '#fef2f2'}; border-left: 3px solid ${msg.role === 'user' ? '#3b82f6' : '#dc2626'}; border-radius: 5px;">
          <p style="margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: bold;">
            ${msg.role === 'user' ? '👤 ' + session.rep_name : '👁️ SusanAI-21'} • ${new Date(msg.timestamp).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}
          </p>
          <p style="margin: 8px 0 0 0; color: #111827; font-size: 13px; line-height: 1.5;">${msg.content}</p>
        </div>
      `).join('')

      return `
        <div style="background: white; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">
            Session with ${session.rep_name} • ${new Date(session.started_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}
          </h3>
          ${messagesHTML}
        </div>
      `
    }).join('')

    const { data, error } = await resend.emails.send({
      from: 'SusanAI-21 Reports <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `📊 Daily Report - ${new Date().toLocaleDateString('en-US')} (${totalChats} Total Chats)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f9fafb;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">👁️ SusanAI-21 Daily Report</h1>
            <p style="color: #fca5a5; margin: 10px 0 0 0; font-size: 14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div style="background: white; padding: 20px; margin: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">📈 Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #93c5fd; margin: 0; font-size: 12px; text-transform: uppercase; font-weight: bold;">Total Reps Active</p>
                <p style="color: white; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${stats.length}</p>
              </div>
              <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #6ee7b7; margin: 0; font-size: 12px; text-transform: uppercase; font-weight: bold;">Chat Sessions</p>
                <p style="color: white; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${totalSessions}</p>
              </div>
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: #fca5a5; margin: 0; font-size: 12px; text-transform: uppercase; font-weight: bold;">Total Messages</p>
                <p style="color: white; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${totalChats}</p>
              </div>
            </div>

            <h2 style="color: #111827; margin: 30px 0 20px 0; font-size: 20px;">👥 Rep Activity</h2>
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; color: #374151; font-size: 12px; text-transform: uppercase;">Rep Name</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-size: 12px; text-transform: uppercase;">Sessions</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-size: 12px; text-transform: uppercase;">Messages</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-size: 12px; text-transform: uppercase;">First Chat</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-size: 12px; text-transform: uppercase;">Last Chat</th>
                </tr>
              </thead>
              <tbody>
                ${statsHTML || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #6b7280;">No activity today</td></tr>'}
              </tbody>
            </table>
          </div>

          ${transcripts.length > 0 ? `
          <div style="background: white; padding: 20px; margin: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">💬 Full Transcripts</h2>
            ${transcriptsHTML}
          </div>
          ` : ''}

          <div style="background: #1f2937; padding: 20px; margin: 20px 20px 0 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <p style="margin: 0;">
              <a href="https://susanai-21.vercel.app/admin" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Admin Dashboard</a>
            </p>
          </div>

          <div style="background: #111827; padding: 15px; margin: 0 20px 20px 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              Automated Daily Report • SusanAI-21 | Roof-ER Assistant<br>
              Generated at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Nightly report send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Nightly report exception:', error)
    return { success: false, error }
  }
}

/**
 * Send insurance claim email
 * Main function for sending emails with templates
 */
export interface SendEmailOptions {
  to: string
  subject?: string
  body: string
  templateName?: string
  sessionId?: number
  repName: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    type?: string
  }>
}

export async function sendClaimEmail(options: SendEmailOptions) {
  try {
    if (!resend) {
      console.log('Email service disabled - RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    // Convert plain text to HTML email with branding
    const recipientName = extractRecipientName(options.body)
    const emailTemplate = convertToHTMLEmail(
      options.body,
      options.templateName || 'Insurance Claim',
      recipientName
    )

    // Validate email
    if (!options.to || !isValidEmail(options.to)) {
      throw new Error('Invalid recipient email address')
    }

    // Prepare email data
    const emailData: any = {
      from: FROM_EMAIL,
      to: [options.to],
      subject: options.subject || emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.plainText,
    }

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
      }))
    }

    // Send via Resend
    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error('Email send error:', error)
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`)
    }

    // Log to database
    const emailLog: EmailLog = {
      sessionId: options.sessionId,
      repName: options.repName,
      toEmail: options.to,
      fromEmail: FROM_EMAIL,
      subject: emailData.subject,
      body: emailTemplate.plainText,
      htmlBody: emailTemplate.html,
      templateUsed: options.templateName,
      attachments: options.attachments,
      resendId: data?.id,
    }

    const dbRecord = await logSentEmail(emailLog)

    return {
      success: true,
      emailId: dbRecord.id,
      resendId: data?.id,
      message: 'Email sent successfully',
      data
    }
  } catch (error) {
    console.error('Send claim email exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validate email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
