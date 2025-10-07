/**
 * API Endpoint to Populate Insurance Companies
 *
 * Populates comprehensive list of insurance companies with claim handler info
 *
 * Usage: POST /api/setup/populate-insurance
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/railway-db';

const INSURANCE_COMPANIES = [
  { name: 'AAA', handler: 'Team', phone: '(800) 922-8228', ext_instructions: 'use also (888) 335 - 2722', email: 'myclaims@csaa.com' },
  { name: 'ALLCAT', handler: 'Team', phone: '(855) 925-5228', ext_instructions: 'n/a', email: 'n/a' },
  { name: 'Allstate', handler: 'Team', phone: '(800) 326-0950', ext_instructions: '2,"Existing claim","I don\'t have it", "Property Claim"', email: 'claims@claims.allstate.com' },
  { name: 'American National', handler: 'Team', phone: '(800) 333-2860', ext_instructions: 'Dial when prompted to', email: 'Claims@AmericanNational.com' },
  { name: 'Ameriprise', handler: 'Team', phone: '(800) 872-5246', ext_instructions: '2,2,remain on line, No, I don\'t have it', email: 'aahhome@ampf.com' },
  { name: 'Amica', handler: 'Adjuster', phone: '(800) 242-6422', ext_instructions: '2,2,3', email: 'claims@amica.com' },
  { name: 'Armed Forces', handler: 'Team', phone: '(800) 255-0187', ext_instructions: '2 - existing claim', email: 'claims@afi.org' },
  { name: 'ASI Claims', handler: 'Adjuster', phone: '(866) 274-5677', ext_instructions: '1, 2, 2, 3 . ASI now apart of progressive.', email: 'claims@asicorp.org & rdsup@asicorp.org' },
  { name: 'Assurant', handler: 'Team', phone: '(800) 423-4403', ext_instructions: 'option 3 for claims, then option 2 for new claim', email: 'supportemail@assurant.com' },
  { name: 'California Casuality', handler: 'Team', phone: '(800) 800-9410', ext_instructions: '0 for operator, ask for Home Claims, can then ask for adjuster info', email: 'myclaim@calcas.com' },
  { name: 'Chubb', handler: 'Adjuster', phone: '(866) 324-8222', ext_instructions: '9,4,1,4,1, claim#', email: 'uspropertyclaims@chubb.com' },
  { name: 'Encompass', handler: 'Team', phone: '(800) 588-7400', ext_instructions: '3,2,2,3', email: 'claims@claims.encompassins.com' },
  { name: 'Erie', handler: 'Adjuster', phone: '(800) 367-3743', ext_instructions: '5,2,zip code,5', email: 'RichmondPropertySupport@erieinsurance.com & HagerstownPropertyEmail@erieinsuranc' },
  { name: 'Farm Bureau (VA)', handler: 'Team', phone: '(804) 290-1000', ext_instructions: '5, 4', email: 'claimsnewmail@vafb.com' },
  { name: 'Farmers', handler: 'Adjuster', phone: '(800) 435-7764', ext_instructions: '4, Continue, Continue, Homeowners', email: 'imaging@farmersinsurance.com/myclaim@farmersinsurance.com' },
  { name: 'Farmers of Salem', handler: 'Team', phone: '(856) 935-1851', ext_instructions: 'N/A', email: 'claimsmail@fosnj.com' },
  { name: 'Foremost', handler: 'Team', phone: '(800) 274-7865', ext_instructions: 'Follow the prompts until you can speak with a live representative', email: 'myclaim@foremost.com' },
  { name: 'Frederick Mutual', handler: 'Adjuster', phone: '1', ext_instructions: '-', email: 'irclaims@frederickmutual.com' },
  { name: 'Grange', handler: 'Team', phone: '(800) 686-0025', ext_instructions: '1, 2, claim number,', email: 'property@grangeinsurance.com' },
  { name: 'Hanover/Citizens', handler: 'Team', phone: '(800) 628-0250', ext_instructions: 'N/A', email: 'firstreport@hanover.com' },
  { name: 'Hippo', handler: 'Team', phone: '(855) 999-9746', ext_instructions: 'n/a', email: 'claims@hippo.com' },
  { name: 'HOAIC', handler: 'Team', phone: '(866) 407-9896', ext_instructions: 'Homeowners of America Insurance Company', email: 'claims@HOAIC.com' },
  { name: 'Homesite', handler: 'Team', phone: '(866) 621-4823', ext_instructions: '1,3,claim number. Addt number = (866)960-8609', email: 'claimdocuments@afics.com' },
  { name: 'IAT Insurance Group', handler: 'Adjuster', phone: '(866) 576-7971', ext_instructions: '1,2', email: 'new.loss@iatinsurance.com' },
  { name: 'Kemper', handler: 'Team', phone: '(800) 353-6737', ext_instructions: '4,2', email: 'NPSC@kemper.com' },
  { name: 'Lemonade', handler: 'Team', phone: '(844) 733-8666', ext_instructions: '2, 4, 2', email: 'help@lemonade.com' },
  { name: 'Liberty Mutual', handler: 'Team', phone: '(800) 225-2467', ext_instructions: '1, 2, I don\'t have it, No, I don\'t have it, No, No, No', email: 'imaging@libertymutual.com' },
  { name: 'Loudoun Mutual', handler: 'Team', phone: '(540) 882-3232', ext_instructions: '', email: 'claims@loudounmutual.com' },
  { name: 'Mercury', handler: 'Team', phone: '(800) 503-3724', ext_instructions: '4 for home claims. Claim email formula below, include the letters and numbers of the claim number', email: 'myclaim+FULLCLAIMNUMBER@mercuryinsurance.com' },
  { name: 'MetLife', handler: 'Team', phone: '(800) 422-4272', ext_instructions: '"Existing Claim", 2,1', email: 'metlifecatteam@metlife.com' },
  { name: 'MSI', handler: 'Team', phone: '(844) 306-0752', ext_instructions: '.', email: 'TPA.Support@alacritysolutions.com' },
  { name: 'National General', handler: 'Team', phone: '(888) 325-1190', ext_instructions: 'Act like you want to report a home claim, you\'ll get a human.', email: 'claims@ngic.com' },
  { name: 'Nationwide', handler: 'Team', phone: '(800) 421-3535', ext_instructions: 'Follow the prompts until you can speak with a live person. ONLY type claim number into keypad to get directly to the adjuster\'s voicemail.', email: 'nationwide-claims@nationwide.com' },
  { name: 'Nationwide (Adjuster)', handler: 'Adjuster', phone: '(800) 421-3535', ext_instructions: '5,1,2, Private claim extension = 21018180', email: 'nationwide-claims@nationwide.com' },
  { name: 'Nationwide - Office of Customer Relations', handler: 'Team', phone: '(800) 882-2822', ext_instructions: 'ext: 614-249-6985, to be used only to file formal complaints.', email: '' },
  { name: 'Penn National', handler: 'Team', phone: '(800) 942-9715', ext_instructions: 'n/a', email: 'clmmail@pnat.com' },
  { name: 'Progressive', handler: 'Team', phone: '(877) 828-9702', ext_instructions: 'Call to figure out who has the claim (homesite/ASI/progressive Home etc) (866) 274 - 5677 (1,2,2,3)', email: 'PGRH_claims@progressive.com' },
  { name: 'Progressive (Alt)', handler: 'Team', phone: '(800) 274-4641', ext_instructions: 'Follow the prompts until you can speak with a live representative.', email: 'claims@email.progressive.com' },
  { name: 'Pure', handler: 'Team', phone: '(888) 813-7873', ext_instructions: 'Unknown', email: 'claims@pureinsurance.com' },
  { name: 'QBE', handler: 'Team', phone: '(800) 779-3269', ext_instructions: '1', email: 'MSIQBE.support@alacritysolutions.com' },
  { name: 'SafeCo', handler: 'Adjuster', phone: '(800) 332-3226', ext_instructions: '2, 1, 2, "I don\'t have it", "No", "I don\'t have it", "No", "No", "No"', email: 'imaging@safeco.com' },
  { name: 'Sagesure', handler: 'Team', phone: '(877) 304-4785', ext_instructions: 'N/A', email: 'eclaims@sagesure.com' },
  { name: 'State Auto', handler: 'Team', phone: '(800) 766-1853', ext_instructions: 'claims, status of existing claim, 4, home', email: 'claims@stateauto.com' },
  { name: 'State Farm', handler: 'Team', phone: '(844) 458-4300', ext_instructions: '1,0,1,66#, first 2 of claim#, 1,0,', email: 'statefarmfireclaims@statefarm.com' },
  { name: 'Stillwater', handler: 'Team', phone: '(800) 220-1351', ext_instructions: '4, extension, #', email: 'claims@stillwater.com' },
  { name: 'SWBC', handler: 'Team', phone: '(866) 476-8399', ext_instructions: 'They take 24 hours to give claim number.', email: 'N/A' },
  { name: 'The Philadelphia Contributionship', handler: 'Team', phone: '(800) 269-1409', ext_instructions: '1, 2', email: 'claims@1752.com' },
  { name: 'Travelers', handler: 'Adjuster', phone: '(800) 238-6225', ext_instructions: '2,2,5 "I don\'t have it" 800-759-6194 team number', email: 'nccenter@travelers.com' },
  { name: 'Universal Property', handler: 'Team', phone: '(800) 470-0599', ext_instructions: '2, star, 2, 3', email: 'claimpath@universalproperty.com' },
  { name: 'USAA', handler: 'Team', phone: '(800) 531-8722', ext_instructions: 'Dial 1,1,1,1,2,2, contractor (1), state', email: 'getclaimspecificnumber@usaa.com' },
  { name: 'Westfield', handler: 'Team', phone: '(800) 243-0210', ext_instructions: '.', email: 'westfieldclaims@westfieldgrp.com' }
];

export async function POST(request: NextRequest) {
  try {
    console.log('[Insurance Setup] Starting insurance companies population...');
    console.log(`[Insurance Setup] Total companies to import: ${INSURANCE_COMPANIES.length}`);

    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS insurance_companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        claim_handler VARCHAR(50),
        phone VARCHAR(30),
        ext_instructions TEXT,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('[Insurance Setup] Table created or already exists');

    // Clear existing data
    await sql`DELETE FROM insurance_companies`;
    console.log('[Insurance Setup] Cleared existing data');

    let imported = 0;

    for (const company of INSURANCE_COMPANIES) {
      await sql`
        INSERT INTO insurance_companies (
          name,
          claim_handler,
          phone,
          ext_instructions,
          email,
          created_at,
          updated_at
        ) VALUES (
          ${company.name},
          ${company.handler},
          ${company.phone},
          ${company.ext_instructions},
          ${company.email},
          NOW(),
          NOW()
        )
      `;

      imported++;
      console.log(`[Insurance Setup] Imported: ${company.name} - ${company.handler} - ${company.phone}`);
    }

    // Get summary
    const summary = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE claim_handler = 'Team') as team_handlers,
        COUNT(*) FILTER (WHERE claim_handler = 'Adjuster') as adjuster_handlers
      FROM insurance_companies
    `;

    console.log('[Insurance Setup] Population complete!');

    return NextResponse.json({
      success: true,
      message: 'Insurance companies populated successfully',
      imported: imported,
      summary: summary.rows[0]
    });

  } catch (error: any) {
    console.error('[Insurance Setup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/setup/populate-insurance',
    method: 'POST',
    description: 'Populates insurance companies database with claim handler information',
    companies: INSURANCE_COMPANIES.length,
    fields: ['name', 'claim_handler', 'phone', 'ext_instructions', 'email']
  });
}
