-- Seed data for insurance companies
-- Based on the comprehensive list of 50+ insurance companies provided

INSERT INTO insurance_companies (name, claim_handler_type, phone, phone_instructions, email, additional_email, notes) VALUES
-- A
('AAA', 'Team', '(800) 922-8228', NULL, 'myclaims@csaa.com', NULL, NULL),
('Ace Property & Casualty', 'Team', '(800) 945-2921', NULL, 'acepc_claims@chubb.com', NULL, NULL),
('ALFA', 'Team', '(800) 964-2532', NULL, 'claims@alfains.com', NULL, NULL),
('Allied', 'Team', '(800) 282-1446', NULL, 'alliedclaims@alliedinsurance.com', NULL, NULL),
('Allstate', 'Team', '(800) 255-7828', 'Option 2', 'claimscenter@allstate.com', 'catastropheteam@allstate.com', 'Catastrophe email: catastropheteam@allstate.com'),
('American Family', 'Team', '(800) 692-6326', NULL, 'claimservice@amfam.com', NULL, NULL),
('American Modern', 'Team', '(800) 375-2075', NULL, 'claims@amig.com', NULL, NULL),
('American National', 'Team', '(800) 899-6403', NULL, 'PropertyClaims@anico.com', NULL, NULL),
('American Strategic (ASI)', 'Team', '(866) 274-3863', NULL, 'claims@assurant.com', NULL, NULL),
('Ameriprise', 'Team', '(800) 842-8236', NULL, 'claimsassist@ameriprise.com', NULL, NULL),
('Amica', 'Team', '(800) 242-6422', NULL, 'claims@amica.com', NULL, NULL),
('Arch', 'Team', '(877) 234-2724', NULL, 'claims@archinsurance.com', NULL, NULL),
('ASI (American Strategic)', 'Team', '(866) 274-3863', NULL, 'claims@assurant.com', NULL, NULL),
('Assurant', 'Team', '(888) 260-7736', NULL, 'claims@assurant.com', NULL, NULL),
('Auto Owners', 'Team', '(888) 252-4626', NULL, 'claims@auto-owners.com', NULL, NULL),

-- B-C
('Bankers', 'Team', '(800) 348-7500', NULL, 'claims@bankersinsurance.com', NULL, NULL),
('Berkshire Hathaway', 'Team', '(866) 243-4272', NULL, 'claims@guard.com', NULL, NULL),
('Brotherhood Mutual', 'Team', '(800) 333-3735', NULL, 'claims@brotherhoodmutual.com', NULL, NULL),
('CenStar', 'Team', '(800) 727-4436', NULL, 'claims@censtarinc.com', NULL, NULL),
('Chubb', 'Team', '(800) 252-4670', NULL, 'claims@chubb.com', NULL, NULL),
('Church Mutual', 'Team', '(800) 554-2642', NULL, 'claims@churchmutual.com', NULL, NULL),
('Cincinnati', 'Team', '(877) 242-2544', NULL, 'claims_service@cinfin.com', NULL, NULL),
('Citizens', 'Team', '(866) 411-2742', NULL, 'claims@citizensfla.com', NULL, NULL),
('Continental Western', 'Team', '(515) 473-3000', NULL, 'claims@cwgins.com', NULL, NULL),
('Country Financial', 'Team', '(866) 268-6879', NULL, 'claims@countryfinancial.com', NULL, NULL),
('CSAA', 'Team', '(800) 922-8228', NULL, 'myclaims@csaa.com', NULL, 'Also known as AAA'),

-- D-G
('EMC', 'Team', '(800) 362-4362', NULL, 'claims@emcins.com', NULL, NULL),
('Encompass', 'Team', '(800) 262-9993', NULL, 'encompassclaims@allstate.com', NULL, NULL),
('Erie', 'Team', '(800) 458-0811', NULL, 'claims@erieinsurance.com', NULL, NULL),
('Esurance', 'Team', '(800) 378-7262', NULL, 'claims@esurance.com', NULL, NULL),
('Farmers', 'Team', '(800) 435-7764', NULL, 'claimsreport@farmersinsurance.com', NULL, NULL),
('Foremost', 'Team', '(800) 527-3905', NULL, 'claims@foremost.com', NULL, NULL),
('Geico', 'Team', '(800) 841-3000', NULL, 'homeownersclaims@geico.com', NULL, NULL),
('Grange', 'Team', '(800) 445-3030', NULL, 'claims@grangeinsurance.com', NULL, NULL),
('Grinnell Mutual', 'Team', '(800) 328-9678', NULL, 'claims@grinnellmutual.com', NULL, NULL),
('GulfStream', 'Team', '(800) 234-0023', NULL, 'claims@gulfstreampc.com', NULL, NULL),

-- H-L
('Hanover', 'Team', '(800) 628-0250', NULL, 'claims@hanover.com', NULL, NULL),
('Hartford', 'Team', '(800) 243-5860', NULL, 'claims@thehartford.com', NULL, NULL),
('Heritage', 'Team', '(877) 252-4674', NULL, 'claims@heritagepci.com', NULL, NULL),
('Homesite', 'Team', '(888) 494-6835', NULL, 'claims@homesite.com', NULL, NULL),
('Horace Mann', 'Team', '(800) 999-1030', NULL, 'claims@horacemann.com', NULL, NULL),
('IMT', 'Team', '(800) 257-4820', NULL, 'claims@imtins.com', NULL, NULL),
('Kemper', 'Team', '(800) 833-0355', NULL, 'claims@kemper.com', NULL, NULL),
('Liberty Mutual', 'Team', '(800) 362-0000', NULL, 'claims@libertymutual.com', NULL, NULL),
('LM Insurance', 'Team', '(800) 362-0000', NULL, 'claims@libertymutual.com', NULL, 'Liberty Mutual Group'),

-- M-N
('Mercury', 'Team', '(800) 503-3724', NULL, 'claims@mercuryinsurance.com', NULL, NULL),
('MetLife', 'Team', '(800) 854-6011', NULL, 'homeclaims@metlife.com', NULL, NULL),
('Narragansett Bay', 'Team', '(800) 462-0912', NULL, 'claims@nbic.com', NULL, NULL),
('National General', 'Team', '(866) 467-5469', NULL, 'claims@nationalgeneral.com', NULL, NULL),
('Nationwide', 'Team', '(800) 421-3535', NULL, 'claims@nationwide.com', NULL, NULL),

-- O-S
('Oregon Mutual', 'Team', '(800) 452-0089', NULL, 'claims@oregonmutual.com', NULL, NULL),
('Pekin', 'Team', '(800) 322-0160', NULL, 'claims@pekininsurance.com', NULL, NULL),
('Plymouth Rock', 'Team', '(855) 766-5949', NULL, 'claims@plymouthrock.com', NULL, NULL),
('Progressive', 'Team', '(800) 776-4737', NULL, 'homeclaims@progressive.com', NULL, NULL),
('QBE', 'Team', '(800) 274-1444', NULL, 'claims@us.qbe.com', NULL, NULL),
('Safeco', 'Team', '(800) 332-3226', NULL, 'claims@safeco.com', NULL, NULL),
('Safeway', 'Team', '(800) 723-3929', NULL, 'claims@safewayinsurance.com', NULL, NULL),
('State Auto', 'Team', '(800) 766-2766', NULL, 'claims@stateauto.com', NULL, NULL),
('State Farm', 'Team', '(844) 458-4300', NULL, 'statefarmfireclaims@statefarm.com', NULL, NULL),
('Stillwater', 'Team', '(800) 220-1351', NULL, 'claims@stillwaterinsurance.com', NULL, NULL),
('Swyfft', 'Team', '(844) 799-3381', NULL, 'claims@swyfft.com', NULL, NULL),

-- T-Z
('The General', 'Team', '(800) 280-1466', NULL, 'claims@thegeneral.com', NULL, NULL),
('Travelers', 'Team', '(800) 252-4633', NULL, 'claimhelp@travelers.com', NULL, NULL),
('Tower Hill', 'Team', '(888) 315-0828', NULL, 'claims@thig.com', NULL, NULL),
('Universal Property', 'Team', '(800) 417-9023', NULL, 'claims@universalproperty.com', NULL, NULL),
('USAA', 'Team', '(800) 531-8722', 'dial 1,1,1,1,2,2', 'getclaimspecificnumber@usaa.com', NULL, 'Phone instructions: dial 1,1,1,1,2,2'),
('Utica National', 'Team', '(800) 274-1914', NULL, 'claims@uticanational.com', NULL, NULL),
('Vermont Mutual', 'Team', '(800) 639-4298', NULL, 'claims@vermontmutual.com', NULL, NULL),
('West Bend', 'Team', '(866) 933-2281', NULL, 'claims@westbendmutual.com', NULL, NULL),
('Western National', 'Team', '(800) 769-0355', NULL, 'claims@wnins.com', NULL, NULL),
('Zurich', 'Team', '(800) 987-3373', NULL, 'claims@zurichna.com', NULL, NULL)

ON CONFLICT (name) DO UPDATE SET
  claim_handler_type = EXCLUDED.claim_handler_type,
  phone = EXCLUDED.phone,
  phone_instructions = EXCLUDED.phone_instructions,
  email = EXCLUDED.email,
  additional_email = EXCLUDED.additional_email,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Add some common alternative names/aliases
INSERT INTO insurance_companies (name, claim_handler_type, phone, phone_instructions, email, notes) VALUES
('CSAA Insurance Group', 'Team', '(800) 922-8228', NULL, 'myclaims@csaa.com', 'Same as AAA/CSAA'),
('Allstate Fire and Casualty', 'Team', '(800) 255-7828', 'Option 2', 'claimscenter@allstate.com', 'Part of Allstate'),
('Liberty Mutual Group', 'Team', '(800) 362-0000', NULL, 'claims@libertymutual.com', 'Same as Liberty Mutual')
ON CONFLICT (name) DO NOTHING;
