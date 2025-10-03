import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// POST /api/insurance/track - Track insurance company usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, repId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Increment company usage count
    await sql`
      UPDATE insurance_companies
      SET usage_count = usage_count + 1
      WHERE id = ${companyId}
    `;

    // Track user preference if repId provided
    if (repId) {
      await sql`
        INSERT INTO user_insurance_preferences (rep_id, company_id, last_used, use_count)
        VALUES (${repId}, ${companyId}, NOW(), 1)
        ON CONFLICT (rep_id, company_id)
        DO UPDATE SET
          last_used = NOW(),
          use_count = user_insurance_preferences.use_count + 1
      `;
    }

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error tracking insurance company usage:', error);
    return NextResponse.json(
      { error: 'Failed to track usage', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/insurance/track - Get user's most used companies
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const repId = searchParams.get('repId');

    if (!repId) {
      return NextResponse.json(
        { error: 'Rep ID is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT
        ic.id, ic.name, ic.claim_handler_type, ic.phone,
        ic.phone_instructions, ic.email, ic.additional_phone,
        ic.additional_email, ic.website, ic.notes,
        uip.use_count, uip.last_used
      FROM user_insurance_preferences uip
      JOIN insurance_companies ic ON ic.id = uip.company_id
      WHERE uip.rep_id = ${repId}
      ORDER BY uip.last_used DESC
      LIMIT 10
    `;

    return NextResponse.json({
      companies: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching user insurance preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error.message },
      { status: 500 }
    );
  }
}
