/**
 * Email Notification System for Railway Deployment
 *
 * Handles:
 * - New user login alerts
 * - Nightly recap emails with conversation summaries
 */

import { Resend } from 'resend'
import sql from './railway-db'

// Initialize Resend with API key
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ahmed.mahmoud@theroofdocs.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'SusanAI-21 <noreply@susanai-21.com>'

/**
 * Track first-time users in memory (resets on deployment restart)
 * In production, you could use a database flag or Redis
 */
const seenUsers = new Set<string>()

/**
 * Check if a user is new (first time logging in)
 */
export async function isNewUser(repName: string): Promise<boolean> {
  try {
    // Check if we've seen this user in current session
    if (seenUsers.has(repName)) {
      return false
    }

    // Check database - if user has no previous chat messages, they're new
    const result = await sql`
      SELECT COUNT(*) as count
      FROM chat_messages
      WHERE rep_name = ${repName}
    `

    const messageCount = parseInt(result.rows[0]?.count || '0')

    // If they have 0 messages, they're brand new
    // If they have 1-2 messages, they just started - still new
    const isNew = messageCount <= 2

    if (!isNew) {
      seenUsers.add(repName)
    }

    return isNew
  } catch (error) {
    console.error('[Email Notifications] Error checking if user is new:', error)
    return false
  }
}

/**
 * Mark user as seen (called after sending new user email)
 */
export function markUserAsSeen(repName: string): void {
  seenUsers.add(repName)
}

/**
 * Send new user login alert to admin
 */
export async function sendNewUserAlert(repName: string): Promise<boolean> {
  try {
    if (!resend) {
      console.log('[Email Notifications] Resend not configured, skipping new user alert')
      return false
    }

    // Check if user is actually new
    const userIsNew = await isNewUser(repName)
    if (!userIsNew) {
      console.log(`[Email Notifications] ${repName} is not a new user, skipping alert`)
      return false
    }

    const currentTime = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short'
    })

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `🆕 New User: ${repName} just logged in!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <span style="font-size: 48px;">🎉</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">New User Alert!</h1>
                      <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">SusanAI-21 has a new team member</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 10px; border-left: 5px solid #3b82f6; margin-bottom: 25px;">
                        <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 20px; font-weight: bold;">👤 New Rep</h2>
                        <p style="margin: 0; color: #1e3a8a; font-size: 24px; font-weight: bold;">${repName}</p>
                      </div>

                      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <table style="width: 100%; font-size: 14px; color: #374151;">
                          <tr>
                            <td style="padding: 8px 0; font-weight: 600;">⏰ First Login:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${currentTime}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: 600;">📱 Status:</td>
                            <td style="padding: 8px 0; color: #10b981; font-weight: bold;">Active Now</td>
                          </tr>
                        </table>
                      </div>

                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; border-left: 5px solid #f59e0b;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          <strong>💡 Action Recommended:</strong><br>
                          Consider reaching out to welcome ${repName} and ensure they have all the resources needed to get started with SusanAI-21.
                        </p>
                      </div>

                      <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://susanai-21.vercel.app'}/admin"
                           style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                          View Admin Dashboard
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 25px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        Automated New User Alert • SusanAI-21
                      </p>
                      <p style="margin: 0; color: #6b7280; font-size: 11px;">
                        Generated at ${currentTime}
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Email Notifications] Error sending new user alert:', error)
      return false
    }

    console.log(`[Email Notifications] ✅ New user alert sent for ${repName}`)
    markUserAsSeen(repName)
    return true
  } catch (error) {
    console.error('[Email Notifications] Exception sending new user alert:', error)
    return false
  }
}

/**
 * Send nightly recap email with day's activity summary
 */
export async function sendNightlyRecap(): Promise<boolean> {
  try {
    if (!resend) {
      console.log('[Email Notifications] Resend not configured, skipping nightly recap')
      return false
    }

    // Get today's statistics
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Get all users who logged in today
    const usersResult = await sql`
      SELECT DISTINCT rep_name
      FROM chat_messages
      WHERE created_at >= ${todayStart.toISOString()}
        AND created_at <= ${todayEnd.toISOString()}
      ORDER BY rep_name
    `

    const activeUsers = usersResult.rows.map(row => row.rep_name)

    // Get new users (users who created their first message today)
    const newUsersResult = await sql`
      SELECT DISTINCT cm.rep_name
      FROM chat_messages cm
      INNER JOIN (
        SELECT rep_name, MIN(created_at) as first_message
        FROM chat_messages
        GROUP BY rep_name
      ) first ON cm.rep_name = first.rep_name
      WHERE first.first_message >= ${todayStart.toISOString()}
        AND first.first_message <= ${todayEnd.toISOString()}
      ORDER BY cm.rep_name
    `

    const newUsers = newUsersResult.rows.map(row => row.rep_name)

    // Get total conversations and messages today
    const statsResult = await sql`
      SELECT
        COUNT(DISTINCT session_id) as total_conversations,
        COUNT(*) as total_messages
      FROM chat_messages
      WHERE created_at >= ${todayStart.toISOString()}
        AND created_at <= ${todayEnd.toISOString()}
    `

    const stats = statsResult.rows[0] || { total_conversations: 0, total_messages: 0 }

    // Get per-user activity
    const activityResult = await sql`
      SELECT
        rep_name,
        COUNT(DISTINCT session_id) as conversation_count,
        COUNT(*) as message_count,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM chat_messages
      WHERE created_at >= ${todayStart.toISOString()}
        AND created_at <= ${todayEnd.toISOString()}
      GROUP BY rep_name
      ORDER BY message_count DESC
    `

    const userActivity = activityResult.rows

    // Generate activity HTML table
    const activityHTML = userActivity.map(user => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-weight: 600; color: #111827;">
          ${user.rep_name}
          ${newUsers.includes(user.rep_name) ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 8px; font-weight: bold;">NEW</span>' : ''}
        </td>
        <td style="padding: 12px; text-align: center; color: #374151;">${user.conversation_count}</td>
        <td style="padding: 12px; text-align: center; color: #374151;">${user.message_count}</td>
        <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 11px;">
          ${new Date(user.first_activity).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 11px;">
          ${new Date(user.last_activity).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' })}
        </td>
      </tr>
    `).join('')

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `📊 Daily Recap: ${activeUsers.length} Users, ${stats.total_conversations} Conversations`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 800px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <span style="font-size: 48px;">👁️</span>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Daily Activity Recap</h1>
                      <p style="margin: 10px 0 0 0; color: #fca5a5; font-size: 16px;">${todayDate}</p>
                    </td>
                  </tr>

                  <!-- Summary Stats -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 25px 0; color: #111827; font-size: 22px; font-weight: bold; border-bottom: 3px solid #dc2626; padding-bottom: 10px;">
                        📈 Daily Summary
                      </h2>

                      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
                        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 20px; border-radius: 10px; text-align: center;">
                          <p style="margin: 0; color: #93c5fd; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Active Users</p>
                          <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 36px; font-weight: bold;">${activeUsers.length}</p>
                        </div>

                        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 20px; border-radius: 10px; text-align: center;">
                          <p style="margin: 0; color: #6ee7b7; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Conversations</p>
                          <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 36px; font-weight: bold;">${stats.total_conversations}</p>
                        </div>

                        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 20px; border-radius: 10px; text-align: center;">
                          <p style="margin: 0; color: #ddd6fe; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Messages</p>
                          <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 36px; font-weight: bold;">${stats.total_messages}</p>
                        </div>

                        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px; text-align: center;">
                          <p style="margin: 0; color: #fde68a; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">New Users</p>
                          <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 36px; font-weight: bold;">${newUsers.length}</p>
                        </div>
                      </div>

                      ${newUsers.length > 0 ? `
                      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #10b981; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: bold;">🎉 New Users Today</h3>
                        <p style="margin: 0; color: #047857; font-size: 14px; font-weight: 600;">
                          ${newUsers.join(', ')}
                        </p>
                      </div>
                      ` : ''}

                      <h2 style="margin: 30px 0 20px 0; color: #111827; font-size: 20px; font-weight: bold; border-bottom: 3px solid #dc2626; padding-bottom: 10px;">
                        👥 User Activity Breakdown
                      </h2>

                      <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <thead>
                          <tr style="background: #f9fafb;">
                            <th style="padding: 12px; text-align: left; color: #374151; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">User</th>
                            <th style="padding: 12px; text-align: center; color: #374151; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Conversations</th>
                            <th style="padding: 12px; text-align: center; color: #374151; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Messages</th>
                            <th style="padding: 12px; text-align: center; color: #374151; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">First</th>
                            <th style="padding: 12px; text-align: center; color: #374151; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Last</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${activityHTML || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #6b7280;">No activity today</td></tr>'}
                        </tbody>
                      </table>

                      <div style="text-align: center; margin-top: 40px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://susanai-21.vercel.app'}/admin"
                           style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                          View Full Admin Dashboard
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #1f2937; padding: 25px; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        Automated Daily Report • SusanAI-21 Analytics
                      </p>
                      <p style="margin: 0; color: #6b7280; font-size: 11px;">
                        Generated at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })}
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('[Email Notifications] Error sending nightly recap:', error)
      return false
    }

    console.log('[Email Notifications] ✅ Nightly recap sent successfully')
    return true
  } catch (error) {
    console.error('[Email Notifications] Exception sending nightly recap:', error)
    return false
  }
}
