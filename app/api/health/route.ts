import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used by service worker and offline detector to verify connection
 */

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Susan AI-21',
    version: '1.0.0'
  });
}
