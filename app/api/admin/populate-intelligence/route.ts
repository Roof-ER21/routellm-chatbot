/**
 * Admin API: Populate Insurance Intelligence Data
 * POST /api/admin/populate-intelligence
 *
 * Updates insurance companies with digital platform and deep dive intelligence data
 * Source: COMPLETE-INSURANCE-DIGITAL-PLATFORMS.md + INSURANCE-DEEP-DIVE-INTELLIGENCE.md
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/railway-db';

// Intelligence data for all 64 insurance companies
const INTELLIGENCE_DATA = [
  // TOP TIER - Most Responsive (Score 9-10)
  {
    name: 'Amica',
    app_name: 'Amica',
    client_login_url: 'https://www.amica.com/customers/login',
    guest_login_url: 'https://www.amica.com/en/customer-service/create-online-account.html',
    portal_notes: 'J.D. Power #1 Digital Experience 2025. Biometric security',
    best_call_times: 'Tue-Thu 8am-10am (1-2 min)',
    current_delays: 'None. Industry-leading response',
    proven_workarounds: 'App best in industry. Chat instant',
    alternative_channels: 'App (preferred), Chat (instant), Email (same-day)',
    social_escalation: '@Amica_Insurance',
    executive_escalation: 'CEO: corporate@amica.com',
    naic_complaint_index: 0.24,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 2,
    responsiveness_score: 10,
  },
  {
    name: 'State Farm',
    app_name: 'State Farm',
    client_login_url: 'https://auth.proofing.statefarm.com/login-ui/login',
    guest_login_url: 'https://www.statefarm.com/customer-care/manage-your-accounts',
    portal_notes: 'Single login for all products',
    best_call_times: 'Sun 7-9am (1-2min), Wed 8am-noon',
    current_delays: 'Minimal. Weekend availability',
    proven_workarounds: 'Call Sundays. Use claim# in IVR for adjuster voicemail',
    alternative_channels: 'App (excellent), Chat (biz hours), Email (24-48hr)',
    social_escalation: '@StateFarm (very responsive)',
    executive_escalation: 'corporate.responsibility@statefarm.com',
    naic_complaint_index: 0.43,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 2,
    responsiveness_score: 9,
  },
  {
    name: 'USAA',
    app_name: 'USAA Mobile',
    client_login_url: 'https://www.usaa.com/',
    guest_login_url: null,
    portal_notes: 'Military only. Biometric login',
    best_call_times: 'Tue-Thu 7-9am CST (<2min)',
    current_delays: 'Occasional during CAT season',
    proven_workarounds: 'Virtual chat better than phone. Active duty = faster',
    alternative_channels: 'Chat (instant, best), App (excellent), Email (12-24hr)',
    social_escalation: '@USAA_help (excellent)',
    executive_escalation: 'getclaimspecificnumber@usaa.com',
    naic_complaint_index: 0.31,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 2,
    responsiveness_score: 10,
  },
  {
    name: 'Erie',
    app_name: 'Erie Insurance Mobile',
    client_login_url: 'https://www.erieinsurance.com/',
    guest_login_url: 'https://www.erieinsurance.com/support-center/online-account',
    portal_notes: 'Touch ID, paperless options',
    best_call_times: 'Wed-Thu 7-10am (1-3min)',
    current_delays: 'Regional - slower in non-core states',
    proven_workarounds: 'Email RichmondPropertySupport@erieinsurance.com for VA/MD (faster)',
    alternative_channels: 'Email (regional same-day), App (good), Chat (biz hrs)',
    social_escalation: '@ErieInsurance',
    executive_escalation: 'RichmondPropertySupport@erieinsurance.com',
    naic_complaint_index: 0.38,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 2,
    responsiveness_score: 9,
  },
  {
    name: 'Farmers of Salem',
    app_name: null,
    client_login_url: null,
    guest_login_url: 'https://www.farmersofsalem.com/paybill.aspx',
    portal_notes: 'Regional (NJ,MD,PA,DE). Limited online',
    best_call_times: 'Tue-Thu 8-10am (<3min)',
    current_delays: 'Limited staff but responsive',
    proven_workarounds: 'Email claimsmail@fosnj.com faster than phone',
    alternative_channels: 'Email (preferred, same-day), Phone (direct)',
    social_escalation: 'Limited - use direct contacts',
    executive_escalation: 'claimsmail@fosnj.com',
    naic_complaint_index: null,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 3,
    responsiveness_score: 9,
  },

  // PROBLEM TIER - Most Difficult (Score 1-3)
  {
    name: 'Liberty Mutual',
    app_name: 'Liberty Mutual Mobile',
    client_login_url: 'https://www.libertymutual.com/log-in',
    guest_login_url: 'https://www.libertymutual.com/customer-support/manage-your-policy',
    portal_notes: 'Touch/face recognition',
    best_call_times: 'Wed 6-8am (still 10-15min)',
    current_delays: 'SEVERE: 2,519 BBB complaints. "Deny, Delay, Defend" strategy',
    proven_workarounds: 'Document EVERYTHING. Email imaging@libertymutual.com with "URGENT". Escalate to state commissioner. File BBB complaint',
    alternative_channels: 'Email (slow but documented), Attorney letter, State complaint',
    social_escalation: '@LibertyMutual (public pressure helps)',
    executive_escalation: 'CEO: corporate.communications@libertymutual.com, Legal: legal@libertymutual.com',
    complaints_pattern: 'Delay tactics, lowball offers, denials, poor communication',
    naic_complaint_index: 1.87,
    bbb_rating: 'F',
    avg_hold_time_minutes: 15,
    responsiveness_score: 1,
  },
  {
    name: 'SWBC',
    app_name: null,
    client_login_url: null,
    guest_login_url: null,
    portal_notes: 'Contact directly for digital access',
    best_call_times: 'Tue-Wed 7-9am (still slow)',
    current_delays: 'CRITICAL: 24hr to assign claim#. Contractors report "worst to get paid"',
    proven_workarounds: 'Plan 24hr delay. Certified mail all comms. Consider deposit before work. Attorney for claims >$10k',
    alternative_channels: 'Certified mail (legal trail), Attorney (only reliable)',
    social_escalation: 'Limited',
    executive_escalation: 'Legal dept via attorney only',
    complaints_pattern: 'Extreme delays, non-payment, no communication',
    naic_complaint_index: null,
    bbb_rating: 'C',
    avg_hold_time_minutes: 20,
    responsiveness_score: 1,
  },
  {
    name: 'Universal Property',
    app_name: 'UPCIC Mobile',
    client_login_url: 'https://universalproperty.com/account/login/',
    guest_login_url: 'https://universalproperty.com/account/visitorpayment/',
    portal_notes: 'ClaimPath portal. Android app poor ratings',
    best_call_times: 'Tue-Thu 7-9am (10-15min)',
    current_delays: 'SEVERE: Court sanctions for bad faith. High denials. FL regulatory scrutiny',
    proven_workarounds: 'ClaimPath for documentation. Public adjuster early. FL Insurance Dept complaint. Consider legal',
    alternative_channels: 'ClaimPath (required), Attorney (recommended), Public adjuster',
    social_escalation: '@UPCIC (limited)',
    executive_escalation: 'FL Dept of Insurance (more effective)',
    complaints_pattern: 'Bad faith denials, delays, court sanctions',
    naic_complaint_index: 3.24,
    bbb_rating: 'D',
    avg_hold_time_minutes: 15,
    responsiveness_score: 2,
  },
  {
    name: 'The Philadelphia Contributionship',
    app_name: 'MyKey Mobile - TPC Insurance',
    client_login_url: 'https://mykey.contributionship.com/',
    guest_login_url: null,
    portal_notes: 'Founded 1752 (oldest)',
    best_call_times: 'Wed 8-10am (5-10min)',
    current_delays: 'HIGH: BBB D-. Slow processing. Communication issues',
    proven_workarounds: 'Email claims@1752.com + certified mail. PA Insurance Dept for delays >30 days. Document everything',
    alternative_channels: 'Email (slow), Certified mail, PA Insurance Dept',
    social_escalation: 'Limited',
    executive_escalation: 'PA Insurance Dept: 877-881-6388',
    complaints_pattern: 'Slow processing, poor communication',
    naic_complaint_index: null,
    bbb_rating: 'D-',
    avg_hold_time_minutes: 10,
    responsiveness_score: 2,
  },
  {
    name: 'Lemonade',
    app_name: 'Lemonade Insurance',
    client_login_url: 'https://www.lemonade.com/login',
    guest_login_url: 'https://lemonade.homesite.com/auth/login',
    portal_notes: 'Digital-first, app-required. 4.9/5 iOS',
    best_call_times: 'App/chat only - no phone',
    current_delays: 'Moderate: NAIC 10.09. AI denials without human review',
    proven_workarounds: 'App for claim (required). Request human review if AI denies. NAIC complaint. Social media pressure',
    alternative_channels: 'App (required), Email: help@lemonade.com, Social media',
    social_escalation: '@Lemonade_Inc (very responsive to public complaints)',
    executive_escalation: 'CEO Daniel Schreiber (LinkedIn)',
    complaints_pattern: 'AI denials, limited human review, coverage disputes',
    naic_complaint_index: 10.09,
    bbb_rating: 'B',
    avg_hold_time_minutes: null,
    responsiveness_score: 3,
  },

  // ADDITIONAL MAJOR CARRIERS (Score 5-8)
  {
    name: 'Allstate',
    app_name: 'Allstate Mobile',
    client_login_url: 'https://myaccountrwd.allstate.com/anon/account/login',
    guest_login_url: 'https://www.allstate.com/help-support/account',
    portal_notes: 'MyAccount portal, MFA',
    best_call_times: 'Mon 7-9am (1-2min)',
    current_delays: 'Moderate. Can be slow during CAT season',
    proven_workarounds: 'App excellent. Direct dial claim# if known',
    alternative_channels: 'App (excellent), Email, Online portal',
    social_escalation: '@Allstate (responsive)',
    executive_escalation: 'CEO: tom.wilson@allstate.com',
    naic_complaint_index: 0.73,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 3,
    responsiveness_score: 8,
  },
  {
    name: 'Progressive',
    app_name: 'Progressive',
    client_login_url: 'https://www.progressive.com/manage-policy/',
    guest_login_url: 'https://progressivedirect.homesite.com/',
    portal_notes: 'Home redirects to provider portal',
    best_call_times: 'Tue-Thu 7-10am (3-5min)',
    current_delays: 'Moderate. Determine which company has claim first',
    proven_workarounds: 'Call to identify carrier (Homesite/ASI/Progressive). Use carrier-specific shortcuts',
    alternative_channels: 'App, Email, Provider portal',
    social_escalation: '@Progressive',
    executive_escalation: 'Claims.Service@progressive.com',
    naic_complaint_index: 0.89,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 5,
    responsiveness_score: 7,
  },
  {
    name: 'Nationwide',
    app_name: 'Nationwide Mobile',
    client_login_url: 'https://login.nationwide.com/access/web/login.htm',
    guest_login_url: 'https://customer-login.nationwide.com/',
    portal_notes: 'Face/Fingerprint Android',
    best_call_times: 'Wed-Thu 8-11am (3-7min)',
    current_delays: 'Moderate. Can have long holds',
    proven_workarounds: 'Type claim# in keypad for adjuster voicemail. Private ext: 21018180',
    alternative_channels: 'App, Email, Adjuster direct extension',
    social_escalation: '@Nationwide',
    executive_escalation: 'Customer Relations: 800-882-2822 x614-249-6985',
    naic_complaint_index: 0.67,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 5,
    responsiveness_score: 7,
  },
  {
    name: 'Farmers',
    app_name: 'Farmers Mobile App',
    client_login_url: 'https://eagentsaml.farmersinsurance.com/login.html',
    guest_login_url: 'https://www.farmers.com/',
    portal_notes: 'Multi-policy management',
    best_call_times: 'Tue-Thu 7-10am (3-5min)',
    current_delays: 'Moderate. Agent-driven model can slow claims',
    proven_workarounds: 'Contact local agent first. Email: imaging@farmersinsurance.com or myclaim@farmersinsurance.com',
    alternative_channels: 'Local agent (fastest), App, Email',
    social_escalation: '@WeAreFarmers',
    executive_escalation: 'Claims VP: corporate contact via agent',
    naic_complaint_index: 1.12,
    bbb_rating: 'A',
    avg_hold_time_minutes: 5,
    responsiveness_score: 6,
  },
  {
    name: 'Travelers',
    app_name: 'MyTravelers',
    client_login_url: 'https://signin.travelers.com/',
    guest_login_url: 'https://www.travelers.com/online-service',
    portal_notes: '24/7 claim filing',
    best_call_times: 'Wed-Thu 7-10am (2-4min)',
    current_delays: 'Low. Good response times',
    proven_workarounds: 'Use team number 800-759-6194 if main busy',
    alternative_channels: 'App (24/7), Email: nccenter@travelers.com, Team line',
    social_escalation: '@Travelers',
    executive_escalation: 'Claims Escalation: nccenter@travelers.com',
    naic_complaint_index: 0.52,
    bbb_rating: 'A+',
    avg_hold_time_minutes: 4,
    responsiveness_score: 8,
  },

  // Add more companies as needed - this covers the top priority ones
  // Remaining companies can be added in batches

];

export async function POST(request: NextRequest) {
  try {
    console.log('[Intelligence] Starting intelligence data population...');
    console.log(`[Intelligence] Total companies with intelligence: ${INTELLIGENCE_DATA.length}`);

    let updated = 0;
    let errors = 0;

    for (const company of INTELLIGENCE_DATA) {
      try {
        // Update company with intelligence data
        await sql`
          UPDATE insurance_companies
          SET
            app_name = ${company.app_name},
            client_login_url = ${company.client_login_url},
            guest_login_url = ${company.guest_login_url},
            portal_notes = ${company.portal_notes},
            best_call_times = ${company.best_call_times},
            current_delays = ${company.current_delays},
            proven_workarounds = ${company.proven_workarounds},
            alternative_channels = ${company.alternative_channels},
            social_escalation = ${company.social_escalation},
            executive_escalation = ${company.executive_escalation},
            complaints_pattern = ${company.complaints_pattern || null},
            naic_complaint_index = ${company.naic_complaint_index},
            bbb_rating = ${company.bbb_rating},
            avg_hold_time_minutes = ${company.avg_hold_time_minutes},
            responsiveness_score = ${company.responsiveness_score},
            last_intelligence_update = NOW()
          WHERE name = ${company.name}
        `;

        updated++;
        console.log(`[Intelligence] Updated: ${company.name} (Score: ${company.responsiveness_score})`);
      } catch (error: any) {
        console.error(`[Intelligence] Error updating ${company.name}:`, error.message);
        errors++;
      }
    }

    console.log('[Intelligence] Population complete!');

    return NextResponse.json({
      success: true,
      message: 'Insurance intelligence data populated successfully',
      updated,
      errors,
      totalProcessed: INTELLIGENCE_DATA.length,
    });
  } catch (error: any) {
    console.error('[Intelligence] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/populate-intelligence',
    method: 'POST',
    description: 'Populates insurance companies with digital platform and intelligence data',
    companies: INTELLIGENCE_DATA.length,
    fields: [
      'app_name',
      'client_login_url',
      'guest_login_url',
      'portal_notes',
      'best_call_times',
      'current_delays',
      'proven_workarounds',
      'alternative_channels',
      'social_escalation',
      'executive_escalation',
      'complaints_pattern',
      'naic_complaint_index',
      'bbb_rating',
      'avg_hold_time_minutes',
      'responsiveness_score',
    ],
  });
}
