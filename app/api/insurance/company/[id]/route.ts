import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/railway-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT * FROM insurance_companies WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      company: result.rows[0],
    });
  } catch (error: any) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
