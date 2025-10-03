import { NextRequest, NextResponse } from 'next/server'
import { templateEngine, TemplateContext } from '@/lib/template-engine'

/**
 * POST /api/templates/generate
 * Generate a document from a template
 *
 * Body:
 * - input: string (description or keyword to select template)
 * - templateKey?: string (optional, specific template to use)
 * - variables?: Record<string, string> (optional, manual variables)
 * - context?: TemplateContext (optional, additional context)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { input, templateKey, variables, context } = body

    if (!input && !templateKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either input or templateKey is required'
        },
        { status: 400 }
      )
    }

    let result

    if (templateKey && variables) {
      // Quick generate mode with specific template and variables
      result = await templateEngine.quickGenerate(templateKey, variables)
    } else if (input) {
      // Auto-select template from input
      result = await templateEngine.generate(input, context || {})
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters'
        },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to generate document'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: result.document,
      template: result.template,
      templateKey: result.templateKey,
      variables: result.variables,
      missingVariables: result.missingVariables,
      validation: result.validation,
      readyToSend: result.readyToSend,
      suggestedEdits: result.suggestedEdits
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/templates/generate
 * Simple test endpoint to verify the API is working
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Template generation API is ready',
    usage: {
      method: 'POST',
      body: {
        input: 'Description to auto-select template',
        templateKey: 'Optional: specific template key',
        variables: 'Optional: manual variables object',
        context: 'Optional: additional context'
      },
      examples: [
        {
          description: 'Auto-select template from description',
          body: {
            input: 'I need to appeal a partial denial for my property at 123 Main St',
            context: {
              user: {
                name: 'John Doe',
                email: 'john@example.com'
              }
            }
          }
        },
        {
          description: 'Generate with specific template',
          body: {
            templateKey: 'partial_denial_appeal',
            variables: {
              property_address: '123 Main St',
              adjuster_name: 'Jane Smith',
              denial_reason: 'Insufficient evidence'
            }
          }
        }
      ]
    }
  })
}
