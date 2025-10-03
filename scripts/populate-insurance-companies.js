/**
 * Populate Insurance Companies Database
 *
 * Comprehensive list of insurance companies commonly used in
 * VA, MD, and PA for roofing claims
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Comprehensive insurance companies list
const INSURANCE_COMPANIES = [
  // ============================================================================
  // MAJOR NATIONAL CARRIERS
  // ============================================================================
  {
    name: 'State Farm',
    phone: '1-800-782-8332',
    website: 'https://www.statefarm.com',
    claim_portal: 'https://www.statefarm.com/claims',
    average_response_days: 7,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Requires detailed photo documentation. Often requests multiple estimates.'
  },
  {
    name: 'Allstate',
    phone: '1-800-726-6033',
    website: 'https://www.allstate.com',
    claim_portal: 'https://www.allstate.com/claims',
    average_response_days: 5,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Fast response times. Preferred contractor network available.'
  },
  {
    name: 'GEICO',
    phone: '1-800-841-3000',
    website: 'https://www.geico.com',
    claim_portal: 'https://www.geico.com/claims',
    average_response_days: 3,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'Very responsive. Digital-first approach.'
  },
  {
    name: 'Progressive',
    phone: '1-800-776-4737',
    website: 'https://www.progressive.com',
    claim_portal: 'https://www.progressive.com/claims',
    average_response_days: 4,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Mobile app for claims submission. Quick turnaround.'
  },
  {
    name: 'USAA',
    phone: '1-800-531-8722',
    website: 'https://www.usaa.com',
    claim_portal: 'https://www.usaa.com/claims',
    average_response_days: 3,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'Military/veterans only. Excellent customer service. Fair claim handling.'
  },

  // ============================================================================
  // MAJOR REGIONAL CARRIERS
  // ============================================================================
  {
    name: 'Liberty Mutual',
    phone: '1-800-225-2467',
    website: 'https://www.libertymutual.com',
    claim_portal: 'https://www.libertymutual.com/claims',
    average_response_days: 6,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Requires contractor licensing verification.'
  },
  {
    name: 'Farmers Insurance',
    phone: '1-888-327-6335',
    website: 'https://www.farmers.com',
    claim_portal: 'https://www.farmers.com/claims',
    average_response_days: 5,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Agent-based system. Contact local agent for best results.'
  },
  {
    name: 'Nationwide',
    phone: '1-800-421-3535',
    website: 'https://www.nationwide.com',
    claim_portal: 'https://www.nationwide.com/claims',
    average_response_days: 5,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'On Your Side claims service. Generally fair settlements.'
  },
  {
    name: 'American Family Insurance',
    phone: '1-800-692-6326',
    website: 'https://www.amfam.com',
    claim_portal: 'https://www.amfam.com/claims',
    average_response_days: 6,
    prefers_digital_submission: false,
    requires_supplement_approval: true,
    notes: 'Prefers phone/email submissions over digital portals.'
  },
  {
    name: 'Travelers',
    phone: '1-800-252-4633',
    website: 'https://www.travelers.com',
    claim_portal: 'https://www.travelers.com/claims',
    average_response_days: 5,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Commercial and residential. Requires detailed scope of work.'
  },

  // ============================================================================
  // SPECIALTY & REGIONAL (VA/MD/PA)
  // ============================================================================
  {
    name: 'Erie Insurance',
    phone: '1-800-458-0811',
    website: 'https://www.erieinsurance.com',
    claim_portal: 'https://www.erieinsurance.com/claims',
    average_response_days: 4,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'Strong presence in PA, MD, VA. Local adjusters. Fair claim handling.'
  },
  {
    name: 'Auto-Owners Insurance',
    phone: '1-888-252-4626',
    website: 'https://www.auto-owners.com',
    claim_portal: 'https://www.auto-owners.com/claims',
    average_response_days: 6,
    prefers_digital_submission: false,
    requires_supplement_approval: true,
    notes: 'Agent-focused. Contact local agent first.'
  },
  {
    name: 'MetLife',
    phone: '1-800-638-5433',
    website: 'https://www.metlife.com',
    claim_portal: 'https://www.metlife.com/claims',
    average_response_days: 7,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Primarily auto, but handles some homeowners.'
  },
  {
    name: 'Chubb',
    phone: '1-800-252-4670',
    website: 'https://www.chubb.com',
    claim_portal: 'https://www.chubb.com/claims',
    average_response_days: 3,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'High-value homes. Premium service. Generous settlements.'
  },
  {
    name: 'Safeco',
    phone: '1-800-332-3226',
    website: 'https://www.safeco.com',
    claim_portal: 'https://www.safeco.com/claims',
    average_response_days: 5,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Liberty Mutual subsidiary. Similar processes.'
  },
  {
    name: 'Mercury Insurance',
    phone: '1-800-503-3724',
    website: 'https://www.mercuryinsurance.com',
    claim_portal: 'https://www.mercuryinsurance.com/claims',
    average_response_days: 6,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'West coast focused but growing in mid-Atlantic.'
  },
  {
    name: 'Esurance',
    phone: '1-800-378-7262',
    website: 'https://www.esurance.com',
    claim_portal: 'https://www.esurance.com/claims',
    average_response_days: 4,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'Allstate subsidiary. Digital-first. Fast processing.'
  },
  {
    name: 'Amica Mutual',
    phone: '1-800-242-6422',
    website: 'https://www.amica.com',
    claim_portal: 'https://www.amica.com/claims',
    average_response_days: 4,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'Highly rated customer service. Fair claim handling.'
  },
  {
    name: 'The Hartford',
    phone: '1-800-547-5000',
    website: 'https://www.thehartford.com',
    claim_portal: 'https://www.thehartford.com/claims',
    average_response_days: 5,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'AARP partnership. Senior-focused. Good for older homes.'
  },
  {
    name: 'Kemper',
    phone: '1-800-833-0355',
    website: 'https://www.kemper.com',
    claim_portal: 'https://www.kemper.com/claims',
    average_response_days: 7,
    prefers_digital_submission: false,
    requires_supplement_approval: true,
    notes: 'Multiple brands (Infinity, Alliance). Contact specific brand.'
  },

  // ============================================================================
  // ADDITIONAL CARRIERS
  // ============================================================================
  {
    name: 'Mutual of Omaha',
    phone: '1-800-228-7104',
    website: 'https://www.mutualofomaha.com',
    claim_portal: 'https://www.mutualofomaha.com/claims',
    average_response_days: 6,
    prefers_digital_submission: false,
    requires_supplement_approval: true,
    notes: 'Life insurance primary, some property coverage.'
  },
  {
    name: 'Plymouth Rock',
    phone: '1-855-201-3695',
    website: 'https://www.plymouthrock.com',
    claim_portal: 'https://www.plymouthrock.com/claims',
    average_response_days: 6,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Northeast regional carrier.'
  },
  {
    name: 'National General',
    phone: '1-888-293-5108',
    website: 'https://www.nationalgeneral.com',
    claim_portal: 'https://www.nationalgeneral.com/claims',
    average_response_days: 7,
    prefers_digital_submission: true,
    requires_supplement_approval: true,
    notes: 'Allstate subsidiary. Budget-friendly option.'
  },
  {
    name: 'Hippo Insurance',
    phone: '1-833-321-4476',
    website: 'https://www.hippo.com',
    claim_portal: 'https://www.hippo.com/claims',
    average_response_days: 2,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'InsurTech company. Very fast digital claims process.'
  },
  {
    name: 'Lemonade',
    phone: '1-844-733-8666',
    website: 'https://www.lemonade.com',
    claim_portal: 'https://www.lemonade.com/claims',
    average_response_days: 1,
    prefers_digital_submission: true,
    requires_supplement_approval: false,
    notes: 'AI-powered claims. Instant payouts for approved claims.'
  }
];

async function populateInsuranceCompanies() {
  console.log('🏢 Populating insurance companies database...');
  console.log(`Total companies to import: ${INSURANCE_COMPANIES.length}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear existing data (optional)
    console.log('\n📊 Clearing existing insurance company data...');
    await client.query('DELETE FROM insurance_companies');

    let imported = 0;

    for (const company of INSURANCE_COMPANIES) {
      await client.query(`
        INSERT INTO insurance_companies (
          name,
          phone,
          website,
          claim_portal,
          average_response_days,
          prefers_digital_submission,
          requires_supplement_approval,
          notes,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
          phone = EXCLUDED.phone,
          website = EXCLUDED.website,
          claim_portal = EXCLUDED.claim_portal,
          average_response_days = EXCLUDED.average_response_days,
          prefers_digital_submission = EXCLUDED.prefers_digital_submission,
          requires_supplement_approval = EXCLUDED.requires_supplement_approval,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `, [
        company.name,
        company.phone,
        company.website,
        company.claim_portal,
        company.average_response_days,
        company.prefers_digital_submission,
        company.requires_supplement_approval,
        company.notes
      ]);

      imported++;
      console.log(`✅ Imported: ${company.name}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Insurance companies import complete!');
    console.log(`   Total imported: ${imported} companies`);

    // Show summary
    const summary = await client.query(`
      SELECT
        COUNT(*) as total,
        AVG(average_response_days) as avg_response,
        COUNT(*) FILTER (WHERE prefers_digital_submission = true) as digital_preferred,
        COUNT(*) FILTER (WHERE requires_supplement_approval = true) as requires_supplements
      FROM insurance_companies
    `);

    console.log('\n📊 Database Summary:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Total Companies: ${summary.rows[0].total}`);
    console.log(`Avg Response Time: ${summary.rows[0].avg_response.toFixed(1)} days`);
    console.log(`Digital Submission Preferred: ${summary.rows[0].digital_preferred}`);
    console.log(`Require Supplement Approval: ${summary.rows[0].requires_supplements}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error populating insurance companies:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the population
populateInsuranceCompanies()
  .then(() => {
    console.log('\n🎉 Insurance companies population completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Insurance companies population failed:', error);
    process.exit(1);
  });
