/**
 * POST /api/sync/login
 *
 * Verify user credentials and return user information
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySyncUser, ensureSyncTablesExist } from '@/lib/sync-db'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, code } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Code is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Ensure tables exist
    await ensureSyncTablesExist()

    // Verify credentials
    const user = await verifySyncUser(name.trim(), code.trim())

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please check your name and code.' },
        { status: 401 }
      )
    }

    // Return success with user information
    return NextResponse.json({
      success: true,
      userId: user.id,
      displayName: user.display_name,
      lastActive: user.last_active
    })

  } catch (error: any) {
    console.error('Error in login endpoint:', error)

    // Handle database connection errors gracefully
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { success: false, error: 'Database temporarily unavailable. Please try again later.' },
        { status: 503 }
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
