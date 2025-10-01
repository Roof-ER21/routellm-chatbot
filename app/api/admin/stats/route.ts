import { NextRequest, NextResponse } from 'next/server'
import { getAllRepsStats } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const stats = await getAllRepsStats()

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching rep stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rep stats' },
      { status: 500 }
    )
  }
}
