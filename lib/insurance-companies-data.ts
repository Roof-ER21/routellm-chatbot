/**
 * Complete Insurance Companies Database
 * 64 insurance companies with app names, websites, and contact info
 * Phone shortcuts intentionally excluded per requirements
 */

export interface InsuranceCompany {
  id: string;
  name: string;
  contact_email: string;
  phone?: string;
  app_name?: string;
  client_login_url?: string;
  guest_login_url?: string;
  responsiveness_score?: number;
  notes?: string;
}

export const insuranceCompanies: InsuranceCompany[] = [
  // A
  {
    id: '1',
    name: 'AAA (CSAA Insurance)',
    contact_email: 'myclaims@csaa.com',
    phone: '(800) 922-8228',
    app_name: 'AAA Mobile',
    client_login_url: 'https://www.mypolicy.csaa-insurance.aaa.com/',
    guest_login_url: 'https://account.app.ace.aaa.com/',
    responsiveness_score: 8,
    notes: 'MyPolicy platform for CSAA Insurance Group. Support: 888.980.5650'
  },
  {
    id: '2',
    name: 'ALLCAT Claims Service',
    contact_email: 'info@allcatclaims.com',
    phone: '(855) 925-5228',
    app_name: 'N/A (TPA)',
    client_login_url: 'https://dispatch.allcatclaims.com/user-management/auth/login',
    notes: 'Third Party Administrator - claims management TPA. Contact: (830) 996-3311'
  },
  {
    id: '3',
    name: 'Allstate',
    contact_email: 'claims@claims.allstate.com',
    phone: '(800) 326-0950',
    app_name: 'Allstate Mobile',
    client_login_url: 'https://myaccountrwd.allstate.com/anon/account/login',
    guest_login_url: 'https://www.allstate.com/help-support/account',
    responsiveness_score: 7,
    notes: 'MyAccount portal with multi-factor authentication'
  },
  {
    id: '4',
    name: 'American Family Insurance',
    contact_email: 'claims@amfam.com',
    phone: '(800) 692-6326',
    app_name: 'MyAmFam',
    client_login_url: 'https://www.amfam.com/login',
    guest_login_url: 'https://myaccount.amfam.com/',
    responsiveness_score: 8,
    notes: 'Fingerprint authentication supported'
  },
  {
    id: '5',
    name: 'American National',
    contact_email: 'Claims@AmericanNational.com',
    phone: '(800) 333-2860',
    app_name: 'AN Mobile',
    client_login_url: 'https://clientsite.americannational.com/',
    guest_login_url: 'https://payments.americannational.com/',
    responsiveness_score: 7,
    notes: 'Multi-factor authentication, roadside assistance available'
  },
  {
    id: '6',
    name: 'Ameriprise',
    contact_email: 'aahhome@ampf.com',
    phone: '(800) 872-5246',
    app_name: 'MyAmFam (CONNECT)',
    client_login_url: 'https://policyservice.connectbyamfam.com/',
    guest_login_url: 'https://www.ameriprise.com/client-login',
    responsiveness_score: 7,
    notes: 'Partners with CONNECT powered by American Family Insurance'
  },
  {
    id: '7',
    name: 'Amica Mutual',
    contact_email: 'claims@amica.com',
    phone: '(800) 242-6422',
    app_name: 'Amica',
    client_login_url: 'https://www.amica.com/customers/login',
    guest_login_url: 'https://www.amica.com/en/customer-service/create-online-account.html',
    responsiveness_score: 9,
    notes: 'J.D. Power #1 Digital Experience 2025. Biometric security (Touch ID/Face ID)'
  },
  {
    id: '8',
    name: 'Armed Forces Insurance (AFI)',
    contact_email: 'claims@afi.org',
    phone: '(800) 255-0187',
    app_name: 'Armed Forces Insurance Mobile',
    client_login_url: 'https://aficonnect.afi.org/aficonnect/signin',
    responsiveness_score: 8,
    notes: 'Founded 1887 for military members and families'
  },
  {
    id: '9',
    name: 'ASI Claims (American Strategic)',
    contact_email: 'claims@asicorp.org',
    phone: '(866) 274-5677',
    client_login_url: 'https://portal.asipolicy.com/',
    guest_login_url: 'https://policy.americanstrategic.com/Login.aspx',
    responsiveness_score: 7,
    notes: 'One of top 15 largest homeowners insurers in US. Support: (800) 492-5629'
  },
  {
    id: '10',
    name: 'Assurant',
    contact_email: 'supportemail@assurant.com',
    phone: '(800) 423-4403',
    client_login_url: 'https://manage.myassurantpolicy.com/',
    guest_login_url: 'https://manage.myassurantpolicy.com/app/registration/find-your-policy',
    responsiveness_score: 6,
    notes: 'Web-based management. Claims Center: w1.assurant.com/ACC/account/Login'
  },

  // C
  {
    id: '11',
    name: 'California Casualty',
    contact_email: 'myclaim@calcas.com',
    phone: '(800) 800-9410',
    app_name: 'Snap Appraisal (claims only)',
    client_login_url: 'https://www.calcas.com/sign-in',
    guest_login_url: 'https://calcas.com/create-account',
    responsiveness_score: 7,
    notes: 'Specializes in teachers, firefighters, police, nurses'
  },
  {
    id: '12',
    name: 'Chubb',
    contact_email: 'uspropertyclaims@chubb.com',
    phone: '(866) 324-8222',
    app_name: 'Chubb Mobile',
    client_login_url: 'https://www.chubb.com/securePersonal/login',
    guest_login_url: 'https://prsclientview.chubb.com/',
    responsiveness_score: 8,
    notes: 'One-time payments available without login'
  },

  // E
  {
    id: '13',
    name: 'Encompass',
    contact_email: 'claims@claims.encompassins.com',
    phone: '(800) 588-7400',
    app_name: 'Encompass Insurance',
    client_login_url: 'https://my.encompassinsurance.com/',
    guest_login_url: 'https://my.encompassinsurance.com/Registration',
    responsiveness_score: 7,
    notes: 'App not available in all states. Support: 888-293-5108'
  },
  {
    id: '14',
    name: 'Erie Insurance',
    contact_email: 'RichmondPropertySupport@erieinsurance.com',
    phone: '(800) 367-3743',
    app_name: 'Erie Insurance Mobile',
    client_login_url: 'https://www.erieinsurance.com/',
    guest_login_url: 'https://www.erieinsurance.com/support-center/online-account',
    responsiveness_score: 8,
    notes: 'Paperless options available. Touch ID login supported'
  },

  // F
  {
    id: '15',
    name: 'Farm Bureau (Virginia)',
    contact_email: 'claimsnewmail@vafb.com',
    phone: '(804) 290-1000',
    client_login_url: 'https://www.vafb.com/MemberLogin',
    guest_login_url: 'https://www.vafb.com/quick-pay',
    responsiveness_score: 6,
    notes: 'Quick Pay for Property/Vehicle, Life/Annuities, Business/Ag without login'
  },
  {
    id: '16',
    name: 'Farmers Insurance',
    contact_email: 'imaging@farmersinsurance.com',
    phone: '(800) 435-7764',
    app_name: 'Farmers Mobile App',
    client_login_url: 'https://eagentsaml.farmersinsurance.com/login.html',
    guest_login_url: 'https://www.farmers.com/',
    responsiveness_score: 7,
    notes: 'Multi-policy management supported'
  },
  {
    id: '17',
    name: 'Farmers of Salem',
    contact_email: 'claimsmail@fosnj.com',
    phone: '(856) 935-1851',
    client_login_url: 'https://www.farmersofsalem.com/paybill.aspx',
    responsiveness_score: 5,
    notes: 'Regional insurer (NJ, MD, PA, DE). Limited online self-service. Support: 800-498-0954'
  },
  {
    id: '18',
    name: 'Foremost Insurance',
    contact_email: 'myclaim@foremost.com',
    phone: '(800) 274-7865',
    app_name: 'Foremost Insurance Mobile',
    client_login_url: 'https://www.myforemostaccount.com/',
    guest_login_url: 'https://www.foremostpayonline.it.com/one-time-payment/',
    responsiveness_score: 7,
    notes: 'Part of Farmers Insurance. Touch ID login. Free guest payments 24/7'
  },
  {
    id: '19',
    name: 'Frederick Mutual',
    contact_email: 'irclaims@frederickmutual.com',
    phone: '(800) 544-8737',
    app_name: 'Frederick Mutual Insurance',
    client_login_url: 'https://my.frederickmutualinsurance.com/#/login',
    guest_login_url: 'https://policyholder.frederickmutualinsurance.com/',
    responsiveness_score: 7,
    notes: 'Upload photos for claims. Helpdesk: (800) 544-8737'
  },

  // G
  {
    id: '20',
    name: 'Grange Insurance',
    contact_email: 'property@grangeinsurance.com',
    phone: '(800) 686-0025',
    app_name: 'Grange Mobile',
    client_login_url: 'https://www.grangeinsurance.com/login',
    guest_login_url: 'https://guestpay.grange.com/',
    responsiveness_score: 7,
    notes: 'Live tow truck tracking for roadside. Guest payment fee: $9.99'
  },

  // H
  {
    id: '21',
    name: 'Hanover Insurance / Citizens',
    contact_email: 'firstreport@hanover.com',
    phone: '(800) 628-0250',
    app_name: 'Hanover Mobile',
    client_login_url: 'https://www.hanover.com/login',
    guest_login_url: 'https://www.hanover.com/pay-your-bill',
    responsiveness_score: 8,
    notes: 'Fingerprint/face ID login. Serves both Hanover and Citizens. Phone: 800-573-1187'
  },
  {
    id: '22',
    name: 'Hippo',
    contact_email: 'claims@hippo.com',
    phone: '(855) 999-9746',
    app_name: 'Hippo Home',
    client_login_url: 'https://www.hippo.com/',
    guest_login_url: 'https://www.hippo.com/contact-us',
    responsiveness_score: 8,
    notes: '24/7 claims reporting, app-based management'
  },
  {
    id: '23',
    name: 'HOAIC (Homeowners of America)',
    contact_email: 'claims@HOAIC.com',
    phone: '(866) 407-9896',
    client_login_url: 'https://hoaic.com/client-login/',
    responsiveness_score: 6,
    notes: 'Web portal only - 24/7 accessible. Support: (866) 407-9896 option 2'
  },
  {
    id: '24',
    name: 'Homesite Insurance',
    contact_email: 'claimdocuments@afics.com',
    phone: '(866) 621-4823',
    client_login_url: 'https://go.homesite.com/login',
    guest_login_url: 'https://www.homesitebusinessinsurance.com/paynow',
    responsiveness_score: 7,
    notes: 'SSL 2048-bit encryption. Support: 1-800-466-3748'
  },

  // I
  {
    id: '25',
    name: 'IAT Insurance Group',
    contact_email: 'new.loss@iatinsurance.com',
    phone: '(866) 576-7971',
    client_login_url: 'https://www.iatinsurancegroup.com/login',
    guest_login_url: 'https://www.iatinsurancegroup.com/make-a-payment/',
    responsiveness_score: 6,
    notes: 'Payment portal requires policy info. Billing: 800-821-8014. Recommend ACH'
  },

  // K
  {
    id: '26',
    name: 'Kemper Insurance',
    contact_email: 'NPSC@kemper.com',
    phone: '(800) 353-6737',
    app_name: 'Kemper Auto Insurance',
    client_login_url: 'https://www.kemper.com/my-policy/customer-login',
    guest_login_url: 'https://customer.aains.com/payment-guest',
    responsiveness_score: 6,
    notes: 'Alternative portal: customer.kemper.com/auto/cp. Phone: 877-488-7488'
  },

  // L
  {
    id: '27',
    name: 'Lemonade',
    contact_email: 'help@lemonade.com',
    phone: '(844) 733-8666',
    app_name: 'Lemonade Insurance',
    client_login_url: 'https://www.lemonade.com/login',
    guest_login_url: 'https://lemonade.homesite.com/auth/login',
    responsiveness_score: 9,
    notes: 'Digital-first, app-required for most operations. 4.9/5 rating on iOS'
  },
  {
    id: '28',
    name: 'Liberty Mutual',
    contact_email: 'imaging@libertymutual.com',
    phone: '(800) 225-2467',
    app_name: 'Liberty Mutual Mobile',
    client_login_url: 'https://www.libertymutual.com/log-in',
    guest_login_url: 'https://www.libertymutual.com/customer-support/manage-your-policy',
    responsiveness_score: 7,
    notes: 'Touch/face recognition login supported'
  },
  {
    id: '29',
    name: 'Loudoun Mutual',
    contact_email: 'claims@loudounmutual.com',
    phone: '(540) 882-3232',
    app_name: 'Loudoun Mutual Insurance',
    client_login_url: 'https://loudoun.briteapps.com/',
    responsiveness_score: 7,
    notes: 'Virginia-focused since 1849. 24/7 claims submission with photos'
  },

  // M
  {
    id: '30',
    name: 'Mercury Insurance',
    contact_email: 'myclaim@mercuryinsurance.com',
    phone: '(800) 503-3724',
    app_name: 'Mercury Insurance: Car & Home',
    client_login_url: 'https://www.mercuryinsurance.com/myaccount/',
    guest_login_url: 'https://www.mercuryinsurance.com/payment/one-time-payment.html',
    responsiveness_score: 7,
    notes: 'One-time payment requires only policy number. Phone: 800-503-3724'
  },
  {
    id: '31',
    name: 'MetLife Home Insurance',
    contact_email: 'metlifecatteam@metlife.com',
    phone: '(800) 422-4272',
    app_name: 'MetLife US App',
    client_login_url: 'https://online.metlife.com/',
    guest_login_url: 'https://online.metlife.com/paymentcenter/web/public/us/quickpay',
    responsiveness_score: 7,
    notes: 'Quick Pay for one-time payments. Phone: 800-638-5433'
  },
  {
    id: '32',
    name: 'MSI Insurance',
    contact_email: 'TPA.Support@alacritysolutions.com',
    phone: '(844) 306-0752',
    client_login_url: 'https://apps.msimga.com/login',
    guest_login_url: 'https://apps.msimga.com/paynow',
    responsiveness_score: 6,
    notes: 'Coastal insurance specialist (Atlantic/Gulf, FL, TX, MA). Coverage up to $1.5M'
  },

  // N
  {
    id: '33',
    name: 'National General Insurance',
    contact_email: 'claims@ngic.com',
    phone: '(888) 325-1190',
    app_name: 'National General',
    client_login_url: 'https://identity.nationalgeneral.com/customer/Account/Login',
    responsiveness_score: 6,
    notes: 'Mandatory 2FA security. Phone: 888-293-5108 or 866-468-3466'
  },
  {
    id: '34',
    name: 'Nationwide',
    contact_email: 'nationwide-claims@nationwide.com',
    phone: '(800) 421-3535',
    app_name: 'Nationwide Mobile',
    client_login_url: 'https://login.nationwide.com/access/web/login.htm',
    guest_login_url: 'https://customer-login.nationwide.com/',
    responsiveness_score: 9,
    notes: 'Face & Fingerprint login for Android'
  },

  // P
  {
    id: '35',
    name: 'Penn National Insurance',
    contact_email: 'clmmail@pnat.com',
    phone: '(800) 942-9715',
    app_name: 'Penn National Insurance',
    client_login_url: 'https://oic.pennnationalinsurance.com/',
    guest_login_url: 'https://www.pennnationalinsurance.com/make-a-payment/',
    responsiveness_score: 7,
    notes: 'Available in 12 states. Biometric login. Payments over $5k require phone'
  },
  {
    id: '36',
    name: 'Progressive',
    contact_email: 'PGRH_claims@progressive.com',
    phone: '(877) 828-9702',
    app_name: 'Progressive',
    client_login_url: 'https://www.progressive.com/manage-policy/',
    guest_login_url: 'https://progressivedirect.homesite.com/',
    responsiveness_score: 7,
    notes: 'Home insurance redirects to provider portal'
  },
  {
    id: '37',
    name: 'Pure Insurance',
    contact_email: 'claims@pureinsurance.com',
    phone: '(888) 813-7873',
    app_name: 'PURE Insurance',
    client_login_url: 'https://pureinsurance.my.site.com/LoginPage',
    responsiveness_score: 8,
    notes: 'High net worth insurance provider. Member-exclusive benefits'
  },

  // Q
  {
    id: '38',
    name: 'QBE Insurance',
    contact_email: 'MSIQBE.support@alacritysolutions.com',
    phone: '(800) 779-3269',
    client_login_url: 'https://selfservice.qbena.com/',
    responsiveness_score: 6,
    notes: 'Enhanced security with MFA required. Web-based portal only'
  },

  // S
  {
    id: '39',
    name: 'SafeCo Insurance',
    contact_email: 'imaging@safeco.com',
    phone: '(800) 332-3226',
    app_name: 'Safeco Mobile',
    client_login_url: 'https://customer.safeco.com/accountmanager/account/login',
    responsiveness_score: 7,
    notes: 'Biometric login (Touch ID/Face ID). Digital insurance cards'
  },
  {
    id: '40',
    name: 'Sagesure Insurance',
    contact_email: 'eclaims@sagesure.com',
    phone: '(877) 304-4785',
    client_login_url: 'https://www.MySageSure.com',
    responsiveness_score: 6,
    notes: 'Coastal homeowners specialist. Support: (800) 481-0661'
  },
  {
    id: '41',
    name: 'State Auto Insurance',
    contact_email: 'claims@stateauto.com',
    phone: '(800) 766-1853',
    app_name: 'State Auto Safety 360 Mobile',
    client_login_url: 'https://saconnect.stateauto.com/',
    responsiveness_score: 6,
    notes: 'Safety 360 tracks driving behavior. Support: 833-SAHelps (833-724-3577)'
  },
  {
    id: '42',
    name: 'State Farm',
    contact_email: 'statefarmfireclaims@statefarm.com',
    phone: '(844) 458-4300',
    app_name: 'State Farm',
    client_login_url: 'https://auth.proofing.statefarm.com/login-ui/login',
    guest_login_url: 'https://www.statefarm.com/customer-care/manage-your-accounts',
    responsiveness_score: 8,
    notes: 'Single login for all State Farm products'
  },
  {
    id: '43',
    name: 'Stillwater Insurance',
    contact_email: 'claims@stillwater.com',
    phone: '(800) 220-1351',
    app_name: 'Stillwater Insurance',
    client_login_url: 'https://stillwaterinsurance.com/ClientSelfService/',
    responsiveness_score: 7,
    notes: 'View coverages, documents, manage claims, contact agent'
  },
  {
    id: '44',
    name: 'SWBC Insurance',
    contact_email: 'info@swbc.com',
    phone: '(866) 476-8399',
    client_login_url: 'https://www.swbc.com/',
    responsiveness_score: 5,
    notes: 'NOTE: They take 24 hours to assign claim number. Contact SWBC directly'
  },

  // T
  {
    id: '45',
    name: 'The Philadelphia Contributionship',
    contact_email: 'claims@1752.com',
    phone: '(800) 269-1409',
    app_name: 'MyKey Mobile - TPC Insurance',
    client_login_url: 'https://mykey.contributionship.com/',
    responsiveness_score: 7,
    notes: "America's oldest property insurer (founded 1752). Support: 1-888-627-1752"
  },
  {
    id: '46',
    name: 'Travelers Insurance',
    contact_email: 'nccenter@travelers.com',
    phone: '(800) 238-6225',
    app_name: 'MyTravelers',
    client_login_url: 'https://signin.travelers.com/',
    guest_login_url: 'https://www.travelers.com/online-service',
    responsiveness_score: 8,
    notes: '24/7 claim filing and tracking. Alternative: 800-759-6194'
  },

  // U
  {
    id: '47',
    name: 'Universal Property Insurance',
    contact_email: 'claimpath@universalproperty.com',
    phone: '(800) 470-0599',
    app_name: 'UPCIC Mobile',
    client_login_url: 'https://universalproperty.com/account/login/',
    guest_login_url: 'https://universalproperty.com/account/visitorpayment/',
    responsiveness_score: 6,
    notes: 'ClaimPath portal for claims. Android app has poor ratings'
  },
  {
    id: '48',
    name: 'USAA',
    contact_email: 'claims@usaa.com',
    phone: '(800) 531-8722',
    app_name: 'USAA Mobile',
    client_login_url: 'https://www.usaa.com/',
    responsiveness_score: 9,
    notes: 'Military members only. Biometric login (Touch ID/Face ID) supported'
  },

  // W
  {
    id: '49',
    name: 'Westfield Insurance',
    contact_email: 'westfieldclaims@westfieldgrp.com',
    phone: '(800) 243-0210',
    client_login_url: 'https://www.westfieldinsurance.com/mywestfield',
    guest_login_url: 'https://payments.westfield.com/',
    responsiveness_score: 7,
    notes: 'MyWestfield web portal. Phone: 800.766.9133'
  }
];

export default insuranceCompanies;
