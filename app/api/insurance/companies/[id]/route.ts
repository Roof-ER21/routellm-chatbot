import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET /api/insurance/companies/[id] - Get specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT
        id, name, claim_handler_type, phone, phone_instructions,
        email, additional_phone, additional_email, website,
        status, notes, usage_count, created_at, updated_at
      FROM insurance_companies
      WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      company: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching insurance company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance company', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/insurance/companies/[id] - Delete company (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM insurance_companies
      WHERE id = ${id}
      RETURNING id, name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error deleting insurance company:', error);
    return NextResponse.json(
      { error: 'Failed to delete insurance company', details: error.message },
      { status: 500 }
    );
  }
}
