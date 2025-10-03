import { NextRequest, NextResponse } from 'next/server'
import { sendClaimEmail, SendEmailOptions } from '@/lib/email'

/**
 * POST /api/email/send
 * Send an insurance claim email
 *
 * Body:
 * - to: string (recipient email)
 * - subject?: string (email subject, auto-generated if not provided)
 * - body: string (email body content)
 * - templateName?: string (template used to generate the email)
 * - sessionId?: number (chat session ID for logging)
 * - repName: string (rep name for logging)
 * - attachments?: Array<{filename: string, content: string, type?: string}>
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, subject, body: emailBody, templateName, sessionId, repName, attachments } = body

    // Validation
    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipient email (to) is required'
        },
        { status: 400 }
      )
    }

    if (!emailBody) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email body is required'
        },
        { status: 400 }
      )
    }

    if (!repName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rep name is required'
        },
        { status: 400 }
      )
    }

    // Prepare email options
    const emailOptions: SendEmailOptions = {
      to,
      subject,
      body: emailBody,
      templateName,
      sessionId,
      repName,
      attachments: attachments || []
    }

    // Send email
    const result = await sendClaimEmail(emailOptions)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: result.emailId,
      resendId: result.resendId,
      data: result.data
    })
  } catch (error) {
    console.error('Error in email send API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/email/send
 * Simple test endpoint to verify the API is working
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Email send API is ready',
    usage: {
      method: 'POST',
      body: {
        to: 'recipient@example.com (required)',
        subject: 'Optional: Email subject (auto-generated from body if not provided)',
        body: 'Email content - plain text or template generated (required)',
        templateName: 'Optional: Name of template used',
        sessionId: 'Optional: Chat session ID for logging',
        repName: 'Rep name for logging (required)',
        attachments: 'Optional: Array of attachments [{filename, content, type}]'
      },
      example: {
        to: 'adjuster@insurance.com',
        subject: 'Appeal of Partial Denial - 123 Main St',
        body: 'Subject: Appeal of Partial Denial...\n\nDear Adjuster,\n\n...',
        templateName: 'Partial Denial Appeal',
        sessionId: 123,
        repName: 'John Smith',
        attachments: []
      }
    }
  })
}
