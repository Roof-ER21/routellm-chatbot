import { NextRequest, NextResponse } from 'next/server'
import { getTodaysChats } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const chats = await getTodaysChats()

    return NextResponse.json({
      success: true,
      chats
    })
  } catch (error) {
    console.error('Error fetching today\'s chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s chats' },
      { status: 500 }
    )
  }
}
