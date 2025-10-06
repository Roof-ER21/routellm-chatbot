import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/railway-db';
import { insuranceCompanies } from '@/lib/insurance-companies-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try database first
    try {
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
    } catch (dbError) {
      console.warn('Database unavailable, using fallback data:', dbError);

      // Fallback to insurance companies data
      const company = insuranceCompanies.find(c => c.id === id);

      if (!company) {
        return NextResponse.json(
          { success: false, error: 'Company not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        company: company,
      });
    }
  } catch (error: any) {
    console.error('Get company error:', error)

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
