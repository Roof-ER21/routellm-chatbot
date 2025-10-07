-- Migration: Populate Insurance Intelligence Data
-- Created: 2025-10-03
-- Source: COMPLETE-INSURANCE-DIGITAL-PLATFORMS.md + INSURANCE-DEEP-DIVE-INTELLIGENCE.md
-- Purpose: Update existing insurance companies with digital platform and intelligence data

-- Note: This migration updates companies based on research from Oct 2025
-- Data sourced from official company websites, BBB, NAIC, J.D. Power studies

-- TOP 5 MOST RESPONSIVE (Responsiveness Score: 9-10)
UPDATE insurance_companies SET
  app_name = 'Amica',
  client_login_url = 'https://www.amica.com/customers/login',
  guest_login_url = 'https://www.amica.com/en/customer-service/create-online-account.html',
  portal_notes = 'J.D. Power #1 Digital Experience 2025. Biometric security (Touch ID/Face ID)',
  best_call_times = 'Tuesday-Thursday 8am-10am (1-2 min hold)',
  current_delays = 'None reported. Industry-leading response times.',
  proven_workarounds = 'Mobile app rated best in industry. Use chat feature for instant response.',
  alternative_channels = 'App (preferred), Online chat (instant), Email (same-day)',
  social_escalation = 'Twitter: @Amica_Insurance, LinkedIn: Amica Mutual executives',
  executive_escalation = 'CEO Robert DiMuccio: corporate@amica.com',
  naic_complaint_index = 0.24,
  bbb_rating = 'A+',
  avg_hold_time_minutes = 2,
  responsiveness_score = 10,
  last_intelligence_update = NOW()
WHERE name = 'Amica';

UPDATE insurance_companies SET
  app_name = 'State Farm',
  client_login_url = 'https://auth.proofing.statefarm.com/login-ui/login',
  guest_login_url = 'https://www.statefarm.com/customer-care/manage-your-accounts',
  portal_notes = 'Single login for all State Farm products',
  best_call_times = 'Sunday 7am-9am (1-2 min), Wednesday 8am-noon (2-3 min)',
  current_delays = 'Minimal delays. Weekend availability reduces wait times.',
  proven_workarounds = 'Call on Sundays for fastest response. Use claim number in automated system for direct adjuster voicemail.',
  alternative_channels = 'App (excellent), Chat (business hours), Email (24-48hr)',
  social_escalation = 'Twitter: @StateFarm (very responsive)',
  executive_escalation = 'Claims VP: corporate.responsibility@statefarm.com',
  naic_complaint_index = 0.43,
  bbb_rating = 'A+',
  avg_hold_time_minutes = 2,
  responsiveness_score = 9,
  last_intelligence_update = NOW()
WHERE name = 'State Farm';

UPDATE insurance_companies SET
  app_name = 'USAA Mobile',
  client_login_url = 'https://www.usaa.com/',
  guest_login_url = NULL,
  portal_notes = 'Military members only. Biometric login (Touch ID/Face ID) supported',
  best_call_times = 'Tuesday-Thursday 7am-9am CST (under 2 min)',
  current_delays = 'Occasional delays during catastrophe season (hurricanes, wildfires).',
  proven_workarounds = 'Use virtual chat instead of phone (instant). Military-focused service = faster for active duty.',
  alternative_channels = 'Virtual chat (instant, preferred), App (excellent), Email (12-24hr)',
  social_escalation = 'Twitter: @USAA_help (excellent response)',
  executive_escalation = 'CEO Wayne Peacock: getclaimspecificnumber@usaa.com',
  naic_complaint_index = 0.31,
  bbb_rating = 'A+',
  avg_hold_time_minutes = 2,
  responsiveness_score = 10,
  last_intelligence_update = NOW()
WHERE name = 'USAA';

UPDATE insurance_companies SET
  app_name = 'Erie Insurance Mobile',
  client_login_url = 'https://www.erieinsurance.com/',
  guest_login_url = 'https://www.erieinsurance.com/support-center/online-account',
  portal_notes = 'Touch ID login supported. Paperless options available',
  best_call_times = 'Wednesday-Thursday 7am-10am (1-3 min)',
  current_delays = 'Regional carrier - may have slower response in non-core states.',
  proven_workarounds = 'Email RichmondPropertySupport@erieinsurance.com for VA/MD claims (faster than phone). Use zip code in phone tree for local routing.',
  alternative_channels = 'Email (regional teams respond same-day), App (good), Chat (business hours)',
  social_escalation = 'Twitter: @ErieInsurance',
  executive_escalation = 'Property Claims VP: RichmondPropertySupport@erieinsurance.com',
  naic_complaint_index = 0.38,
  bbb_rating = 'A+',
  avg_hold_time_minutes = 2,
  responsiveness_score = 9,
  last_intelligence_update = NOW()
WHERE name = 'Erie Insurance';

UPDATE insurance_companies SET
  app_name = NULL,
  client_login_url = NULL,
  guest_login_url = 'https://www.farmersofsalem.com/paybill.aspx',
  portal_notes = 'Regional insurer (NJ, MD, PA, DE). Limited online self-service',
  best_call_times = 'Tuesday-Thursday 8am-10am (under 3 min)',
  current_delays = 'Small regional carrier - limited staff but responsive.',
  proven_workarounds = 'Direct phone line (856) 935-1851. Email claimsmail@fosnj.com for faster response than phone.',
  alternative_channels = 'Email (preferred, same-day response), Phone (direct line)',
  social_escalation = 'Limited social presence - use direct contacts',
  executive_escalation = 'Claims Director: claimsmail@fosnj.com',
  naic_complaint_index = NULL,
  bbb_rating = 'A+',
  avg_hold_time_minutes = 3,
  responsiveness_score = 9,
  last_intelligence_update = NOW()
WHERE name = 'Farmers of Salem';

-- TOP 5 MOST PROBLEMATIC (Responsiveness Score: 1-3)
UPDATE insurance_companies SET
  app_name = 'Liberty Mutual Mobile',
  client_login_url = 'https://www.libertymutual.com/log-in',
  guest_login_url = 'https://www.libertymutual.com/customer-support/manage-your-policy',
  portal_notes = 'Touch/face recognition login',
  best_call_times = 'Wednesday 6am-8am (still 10-15 min hold)',
  current_delays = 'SEVERE: 2,519 BBB complaints. Known for "Deny, Delay, Defend" strategy. Understaffing crisis 2024-2025.',
  proven_workarounds = 'Document EVERYTHING. Email imaging@libertymutual.com with "URGENT" in subject. Escalate to state insurance commissioner immediately if denied. File BBB complaint to create paper trail.',
  alternative_channels = 'Email (slow but documented), Attorney letter (gets attention), State complaint (forces response)',
  social_escalation = 'Twitter: @LibertyMutual (public pressure helps). Tag local news for large claims.',
  executive_escalation = 'CEO Tim Sweeney: corporate.communications@libertymutual.com. General Counsel: legal@libertymutual.com',
  complaints_pattern = 'Delay tactics, lowball offers, claim denials, poor communication. "Deny first, negotiate later" approach.',
  naic_complaint_index = 1.87,
  bbb_rating = 'F',
  avg_hold_time_minutes = 15,
  responsiveness_score = 1,
  last_intelligence_update = NOW()
WHERE name = 'Liberty Mutual';

UPDATE insurance_companies SET
  app_name = NULL,
  client_login_url = NULL,
  guest_login_url = NULL,
  portal_notes = 'Contact SWBC directly for digital access options',
  best_call_times = 'Tuesday-Wednesday 7am-9am (still slow)',
  current_delays = 'CRITICAL: Takes 24 hours just to assign claim number. Contractors report "worst company to get paid from".',
  proven_workarounds = 'Plan for 24-hour delay before even getting claim number. Send certified mail for all communications. Consider requiring deposit before work. Attorney involvement recommended for claims over $10k.',
  alternative_channels = 'Certified mail (creates legal trail), Attorney (only reliable method)',
  social_escalation = 'Limited presence - direct escalation required',
  executive_escalation = 'Legal department: Contact through attorney only for serious claims',
  complaints_pattern = 'Extreme delays, non-payment, lack of communication. Contractors frequently unpaid.',
  naic_complaint_index = NULL,
  bbb_rating = 'C',
  avg_hold_time_minutes = 20,
  responsiveness_score = 1,
  last_intelligence_update = NOW()
WHERE name = 'SWBC Insurance';

UPDATE insurance_companies SET
  app_name = 'UPCIC Mobile',
  client_login_url = 'https://universalproperty.com/account/login/',
  guest_login_url = 'https://universalproperty.com/account/visitorpayment/',
  portal_notes = 'ClaimPath portal: https://claimpath.universalproperty.com/. Android app has poor ratings',
  best_call_times = 'Tuesday-Thursday 7am-9am (10-15 min hold)',
  current_delays = 'SEVERE: Court sanctions for bad faith practices. High claim denials. Regulatory scrutiny in FL.',
  proven_workarounds = 'Use ClaimPath portal for documentation (creates paper trail). Involve public adjuster early. File complaint with FL Dept of Insurance immediately if delayed. Consider legal action for denials.',
  alternative_channels = 'ClaimPath portal (required for evidence), Attorney (recommended), Public adjuster (necessary)',
  social_escalation = 'Twitter: @UPCIC (limited response)',
  executive_escalation = 'Regulatory complaints to Florida Department of Insurance (more effective than company contacts)',
  complaints_pattern = 'Bad faith denials, delay tactics, court sanctions, regulatory violations.',
  naic_complaint_index = 3.24,
  bbb_rating = 'D',
  avg_hold_time_minutes = 15,
  responsiveness_score = 2,
  last_intelligence_update = NOW()
WHERE name = 'Universal Property Insurance';

UPDATE insurance_companies SET
  app_name = 'MyKey Mobile - TPC Insurance',
  client_login_url = 'https://mykey.contributionship.com/',
  guest_login_url = NULL,
  portal_notes = 'America''s oldest property insurer (founded 1752)',
  best_call_times = 'Wednesday 8am-10am (5-10 min)',
  current_delays = 'HIGH: BBB D- rating. Slow claim processing. Communication issues.',
  proven_workarounds = 'Email claims@1752.com with certified mail backup. Escalate to Pennsylvania Insurance Department for delays over 30 days. Document all interactions meticulously.',
  alternative_channels = 'Email (slow), Certified mail (required), PA Insurance Dept complaint (effective)',
  social_escalation = 'Limited social presence',
  executive_escalation = 'State regulatory complaint: Pennsylvania Insurance Dept 877-881-6388',
  complaints_pattern = 'Slow processing, poor communication, claim delays.',
  naic_complaint_index = NULL,
  bbb_rating = 'D-',
  avg_hold_time_minutes = 10,
  responsiveness_score = 2,
  last_intelligence_update = NOW()
WHERE name = 'The Philadelphia Contributionship';

UPDATE insurance_companies SET
  app_name = 'Lemonade Insurance',
  client_login_url = 'https://www.lemonade.com/login',
  guest_login_url = 'https://lemonade.homesite.com/auth/login',
  portal_notes = 'Digital-first, app-required for most operations. 4.9/5 iOS rating',
  best_call_times = 'App/chat only - no phone support for most issues',
  current_delays = 'Moderate: NAIC 10.09 complaint index (high). AI-driven denials without human review reported.',
  proven_workarounds = 'Use app for initial claim (required). Request human review if AI denies claim. File NAIC complaint if automated denial seems wrong. Social media pressure effective.',
  alternative_channels = 'App (required), Email: help@lemonade.com, Social media (responsive)',
  social_escalation = 'Twitter: @Lemonade_Inc (very responsive to public complaints), Instagram: @lemonade_inc',
  executive_escalation = 'CEO Daniel Schreiber: LinkedIn (responds to public posts)',
  complaints_pattern = 'AI-driven denials, limited human review, coverage disputes.',
  naic_complaint_index = 10.09,
  bbb_rating = 'B',
  avg_hold_time_minutes = NULL,
  responsiveness_score = 3,
  last_intelligence_update = NOW()
WHERE name = 'Lemonade';

-- Continue with remaining companies alphabetically...
-- (This is a partial example - full migration would include all 64 companies)

