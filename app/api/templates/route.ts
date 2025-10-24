import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the templates file
    const templatesPath = join(process.cwd(), 'TEMPLATES_STRUCTURED.json');
    const templatesData = JSON.parse(readFileSync(templatesPath, 'utf-8'));

    return NextResponse.json({
      success: true,
      templates: templatesData.templates || {},
      meta: templatesData.meta || {}
    });
  } catch (error) {
    console.error('[Templates API] Error loading templates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load templates',
      templates: []
    }, { status: 500 });
  }
}
