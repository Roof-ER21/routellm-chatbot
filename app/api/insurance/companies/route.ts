import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/railway-db';
import { insuranceCompanies } from '@/lib/insurance-companies-data';

// GET /api/insurance/companies - List all companies with optional search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    let result;
    let companies;

    // Try database first, fall back to mock data if DB unavailable
    try {
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
      companies = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        contact_email: row.email,
        phone: row.phone,
        claim_handler: row.claim_handler,
        ext_instructions: row.ext_instructions,
        phone_instructions: row.ext_instructions,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (dbError) {
      console.warn('Database unavailable, using mock data:', dbError);

      // Use comprehensive insurance companies data
      if (search) {
        const searchLower = search.toLowerCase();
        companies = insuranceCompanies.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.contact_email.toLowerCase().includes(searchLower) ||
          (c.phone && c.phone.includes(search))
        );
      } else {
        companies = insuranceCompanies;
      }
    }

    return NextResponse.json({
      success: true,
      companies: companies,
      total: companies.length
    });
  } catch (error: any) {
    console.error('Error fetching insurance companies:', error);

    // Last resort: return all insurance companies data
    return NextResponse.json({
      success: true,
      companies: insuranceCompanies,
      total: insuranceCompanies.length
    });
  }
}
