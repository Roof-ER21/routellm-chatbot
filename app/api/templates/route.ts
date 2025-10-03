import { NextRequest, NextResponse } from 'next/server'
import { templateEngine } from '@/lib/template-engine'

/**
 * GET /api/templates
 * List all available templates
 */
export async function GET(req: NextRequest) {
  try {
    const templates = templateEngine.listTemplates()

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error('Error listing templates:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates
 * Get detailed template information
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templateKey } = body

    if (!templateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'templateKey is required'
        },
        { status: 400 }
      )
    }

    const templateInfo = templateEngine.getTemplateInfo(templateKey)

    if (!templateInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template: templateInfo
    })
  } catch (error) {
    console.error('Error getting template info:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get template info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
