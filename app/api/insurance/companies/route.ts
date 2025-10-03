import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET /api/insurance/companies - List all companies with optional search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    let result;

    if (search) {
      // Search query - search by name, phone, or email
      const searchPattern = `%${search}%`;
      result = await sql`
        SELECT
          id,
          name,
          claim_handler,
          phone,
          ext_instructions,
          email,
          created_at,
          updated_at
        FROM insurance_companies
        WHERE LOWER(name) LIKE LOWER(${searchPattern})
           OR LOWER(email) LIKE LOWER(${searchPattern})
           OR LOWER(phone) LIKE LOWER(${searchPattern})
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    } else {
      // No search - return all companies
      result = await sql`
        SELECT
          id,
          name,
          claim_handler,
          phone,
          ext_instructions,
          email,
          created_at,
          updated_at
        FROM insurance_companies
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    }

    // Map database fields to frontend expected fields
    const companies = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      contact_email: row.email,  // Map email to contact_email
      phone: row.phone,
      claim_handler: row.claim_handler,
      ext_instructions: row.ext_instructions,
      phone_instructions: row.ext_instructions,  // Also provide as phone_instructions
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      companies: companies,
      total: companies.length
    });
  } catch (error: any) {
    console.error('Error fetching insurance companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance companies', details: error.message },
      { status: 500 }
    );
  }
}
