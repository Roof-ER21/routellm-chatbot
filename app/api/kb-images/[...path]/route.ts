/**
 * KB Images API Route
 * Serves images from /public/kb-images/ folder
 *
 * This is a fallback for Railway deployment where static files
 * from /public may not be served correctly.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct file path
    const imagePath = path.join(process.cwd(), 'public', 'kb-images', ...params.path)

    console.log('[KB Images API] Requested:', params.path.join('/'))
    console.log('[KB Images API] Full path:', imagePath)

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error('[KB Images API] File not found:', imagePath)
      return new NextResponse('Image not found', { status: 404 })
    }

    // Read file
    const imageBuffer = fs.readFileSync(imagePath)

    // Determine content type from extension
    const ext = path.extname(imagePath).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' :
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.gif' ? 'image/gif' :
                       'application/octet-stream'

    console.log('[KB Images API] ✓ Serving:', params.path.join('/'), `(${imageBuffer.length} bytes)`)

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': imageBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[KB Images API] Error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
