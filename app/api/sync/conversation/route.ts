/**
 * POST /api/sync/conversation
 *
 * Sync a conversation to the database (upsert)
 * Updates if exists, creates if new
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ensureSyncTablesExist,
  upsertConversation,
  upsertMessages,
  upsertAlerts
} from '@/lib/sync-db'

interface ConversationData {
  id: string
  title: string
  preview: string
  createdAt?: string
  messages: Array<{
    id: string
    role: string
    content: string
    timestamp: string
  }>
  alerts?: Array<{
    id: string
    type: string
    severity: string
    title: string
    message: string
    timestamp: string
    flagged?: boolean
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, conversation } = body

    // Validate userId
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid userId is required' },
        { status: 400 }
      )
    }

    // Validate conversation object
    if (!conversation || typeof conversation !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Conversation object is required' },
        { status: 400 }
      )
    }

    const conv = conversation as ConversationData

    // Validate required conversation fields
    if (!conv.id || typeof conv.id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Conversation id is required' },
        { status: 400 }
      )
    }

    if (!conv.title || typeof conv.title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Conversation title is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(conv.messages)) {
      return NextResponse.json(
        { success: false, error: 'Conversation messages must be an array' },
        { status: 400 }
      )
    }

    // Ensure tables exist
    await ensureSyncTablesExist()

    // Prepare data
    const preview = conv.preview || (conv.messages.length > 0 ? conv.messages[0].content.substring(0, 200) : '')
    const createdAt = conv.createdAt ? new Date(conv.createdAt) : new Date()

    // Upsert conversation
    const conversationId = await upsertConversation(
      userId,
      conv.id,
      conv.title,
      preview,
      createdAt
    )

    // Prepare messages for upsert
    const messages = conv.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    }))

    // Upsert messages
    await upsertMessages(conversationId, messages)

    // Upsert alerts if provided
    if (conv.alerts && Array.isArray(conv.alerts)) {
      const alerts = conv.alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: new Date(alert.timestamp),
        flagged: alert.flagged || false
      }))

      await upsertAlerts(conversationId, alerts)
    }

    // Return success
    return NextResponse.json({
      success: true,
      conversationId,
      messageCount: messages.length,
      alertCount: conv.alerts?.length || 0
    })

  } catch (error: any) {
    console.error('Error in conversation sync endpoint:', error)

    // Handle database connection errors gracefully
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { success: false, error: 'Database temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return NextResponse.json(
        { success: false, error: 'User not found. Please log in again.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
