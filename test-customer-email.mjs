/**
 * Test script for customer-sent email safeguards
 * ESM version for running with Node
 */

// Simulate the template service functionality
const APPRAISAL_TEMPLATE = {
  template_name: "Appraisal Request (Customer Sends)",
  audience: "Insurance Adjuster",
  tone: "Firm, professional",
  purpose: "Homeowner requests appraisal process (sent BY homeowner)",
  sender: "customer",
  structure: {
    greeting: "Dear [RECIPIENT_NAME],",
    introduction: "I am writing regarding my insurance claim [CLAIM_NUMBER].",
    evidence_statement: "I strongly disagree with the current estimate and am formally requesting the appraisal process under my policy.",
    argument_modules: [
      "Specific disagreements with estimate",
      "Reference to policy's appraisal clause",
      "Request for appraisal umpire selection process",
      "Timeline expectations per policy"
    ],
    request: "Please initiate the appraisal process immediately and provide details on selecting appraisers.",
    closing: "I expect a response within 10 business days as required by my policy."
  }
};

const CODE_VIOLATION_TEMPLATE = {
  template_name: "Insurance Company - Code Violation Argument",
  audience: "Insurance Adjuster",
  tone: "Firm on facts, warm in delivery",
  purpose: "Challenge partial approval using building codes",
  sender: "rep", // Rep sends this
  structure: {
    greeting: "Dear [RECIPIENT_NAME],",
    introduction: "This is [REP_NAME] with Roof-ER assisting [CUSTOMER_NAME] regarding claim [CLAIM_NUMBER].",
    evidence_statement: "Attached are our documentation including photos and code citations.",
    argument_modules: [
      "IRC R908.3 requires complete matching of shingles",
      "State building code mandates compliance",
      "Manufacturer specifications require matching"
    ],
    request: "Please provide a revised estimate reflecting full replacement.",
    closing: "Thank you for your prompt attention."
  }
};

function generateEmailFromTemplate(template, context) {
  const {
    repName = "Rep",
    repEmail = "rep@roofer.com",
    customerName = "Customer",
    recipientName = "Sir/Madam",
    claimNumber = "N/A",
    insuranceEmail = "claims@insurance.com"
  } = context;

  let email = '';

  // CRITICAL: Add instructions header for customer-sent emails
  if (template.sender === 'customer') {
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    email += `INSTRUCTIONS FOR ${customerName.toUpperCase()}:\n\n`;
    email += `This email is drafted for YOU to send directly to the insurance company.\n\n`;
    email += `✅ Copy the email content below (starting from the greeting)\n`;
    email += `✅ Send it from YOUR email address to ${insuranceEmail}\n`;
    email += `✅ CC me (${repName} at ${repEmail}) so I can monitor the response\n\n`;
    email += `DO NOT have ${repName} send this on your behalf - it must come from you\n`;
    email += `for maximum impact with the insurance company.\n`;
    email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    email += `[EMAIL CONTENT STARTS BELOW - COPY FROM HERE]\n\n`;
  }

  // Generate the actual email content
  email += template.structure.greeting?.replace('[RECIPIENT_NAME]', recipientName) || `Dear ${recipientName},`;
  email += "\n\n";

  if (template.structure.introduction) {
    email += template.structure.introduction
      .replace('[REP_NAME]', repName)
      .replace('[CUSTOMER_NAME]', customerName)
      .replace('[CLAIM_NUMBER]', claimNumber);
    email += "\n\n";
  }

  if (template.structure.evidence_statement) {
    email += template.structure.evidence_statement + "\n\n";
  }

  if (template.structure.argument_modules) {
    template.structure.argument_modules.forEach((arg, i) => {
      email += `${i + 1}. ${arg}\n`;
    });
    email += "\n";
  }

  if (template.structure.request) {
    email += template.structure.request + "\n\n";
  }

  if (template.structure.closing) {
    email += template.structure.closing + "\n\n";
  }

  // Signature: customer name for customer-sent emails, rep name for rep-sent emails
  if (template.sender === 'customer') {
    email += `Sincerely,\n\n${customerName}\n`;
  } else {
    email += `Best regards,\n\n${repName}\nRoof-ER Claims Advocacy\n`;
  }

  return email;
}

console.log('==========================================');
console.log('TESTING CUSTOMER-SENT EMAIL SAFEGUARDS');
console.log('==========================================\n');

// Test 1: Generate a customer-sent email
console.log('==========================================');
console.log('TEST 1: Appraisal Request Email (Customer Sends)');
console.log('==========================================\n');

const appraisalEmail = generateEmailFromTemplate(APPRAISAL_TEMPLATE, {
  repName: 'Mike Johnson',
  repEmail: 'mike@roofer.com',
  customerName: 'John Smith',
  recipientName: 'Claims Adjuster',
  claimNumber: 'CLM-2024-12345',
  insuranceEmail: 'claims@stateauto.com'
});

console.log(appraisalEmail);
console.log('\n==========================================\n');

// Test 2: Generate a regular rep-sent email for comparison
console.log('==========================================');
console.log('TEST 2: Code Violation Email (Rep Sends)');
console.log('==========================================\n');

const codeViolationEmail = generateEmailFromTemplate(CODE_VIOLATION_TEMPLATE, {
  repName: 'Mike Johnson',
  customerName: 'John Smith',
  recipientName: 'Claims Adjuster',
  claimNumber: 'CLM-2024-12345'
});

console.log(codeViolationEmail);
console.log('\n==========================================\n');

// Verification
console.log('✅ VERIFICATION RESULTS:');
console.log('========================\n');

const hasInstructions = appraisalEmail.includes('INSTRUCTIONS FOR JOHN SMITH:');
const hasWarning = appraisalEmail.includes('DO NOT have Mike Johnson send this on your behalf');
const hasCustomerSignature = appraisalEmail.includes('Sincerely,\n\nJohn Smith');
const noInstructionsInRepEmail = !codeViolationEmail.includes('INSTRUCTIONS FOR');
const hasRepSignature = codeViolationEmail.includes('Best regards,\n\nMike Johnson');

console.log(`Customer email has instruction header: ${hasInstructions ? '✅' : '❌'}`);
console.log(`Customer email has warning message: ${hasWarning ? '✅' : '❌'}`);
console.log(`Customer email signed by customer: ${hasCustomerSignature ? '✅' : '❌'}`);
console.log(`Rep email has NO instructions: ${noInstructionsInRepEmail ? '✅' : '❌'}`);
console.log(`Rep email signed by rep: ${hasRepSignature ? '✅' : '❌'}`);

const allTestsPassed = hasInstructions && hasWarning && hasCustomerSignature &&
                       noInstructionsInRepEmail && hasRepSignature;

console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED!'}\n`);
