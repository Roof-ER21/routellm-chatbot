#!/usr/bin/env node
/**
 * Preload all 116 documents from embeddings file and save as JSON
 * This runs at build time to avoid fs module issues in browser
 */

const fs = require('fs')
const path = require('path')

// Category mapping
const FILENAME_TO_CATEGORY = {
  // Templates (7)
  "Danny_s Repair Attempt Video Template.docx": 'templates',
  "Estimate Request Template.docx": 'templates',
  "Photo Report Template.docx": 'templates',
  "Post AM Email Template.docx": 'templates',
  "Repair Attempt Template.docx": 'templates',
  "Template from Customer to Insurance.docx": 'templates',
  "iTel Shingle Template.docx": 'templates',

  // Reports (2)
  "Roof-ER Roof & Siding Claim Response Packet.docx": 'reports',
  "Roof-ER Siding Claim Response Packet.docx": 'reports',

  // Photo Reports (5)
  "EXAMPLE PHOTOS.pdf": 'photo_reports',
  "Sample Photo Report 1.pdf": 'photo_reports',
  "Sample Photo Report 2.pdf": 'photo_reports',
  "Sample Photo Report 3.pdf": 'photo_reports',
  "Sample Photo Report 4.pdf": 'photo_reports',

  // Certifications (15)
  "CERTIFIED_CERTIFICATE.pdf": 'certifications',
  "COI - General Liability.pdf": 'certifications',
  "COI - workers comp 2026.pdf": 'certifications',
  "Copy of MD License (Valid through 7_2025).pdf": 'certifications',
  "Form W-9 (Rev. March 2024) (1).pdf": 'certifications',
  "GAF Certification.PDF": 'certifications',
  "GAF Master Elite 2024.PDF": 'certifications',
  "GAF Master Elite 2025.pdf": 'certifications',
  "MD License (Valid through 7_2025).pdf": 'certifications',
  "MD License.pdf": 'certifications',
  "Maryland License Valid through 2027.pdf": 'certifications',
  "Master Elite Reference Letter for Customers.pdf": 'certifications',
  "PA license 2025 - 2027.pdf": 'certifications',
  "Pennsylvania License Valid Through 2027.pdf": 'certifications',
  "Roof-ER CertainTeed ShingleMaster.pdf": 'certifications',

  // Training Scripts (7)
  "Adjuster Meeting Outcome Script.pdf": 'training_scripts',
  "Contingency and Claim Authorization Script.docx": 'training_scripts',
  "Full Approval Estimate Phone Call.docx": 'training_scripts',
  "Initial Pitch Script.docx": 'training_scripts',
  "Inspection and Post Inspection Script.docx": 'training_scripts',
  "Partial Estimate Phone Call.docx": 'training_scripts',
  "Post Adjuster Meeting Script.docx": 'training_scripts',

  // Training Materials (14)
  "AM Outcome Process.pdf": 'training_materials',
  "Copy of BLANK RoofER - New Sales Hire Checklist.docx": 'training_materials',
  "Culture and Commitment.docx.pdf": 'training_materials',
  "Knowledge.docx": 'training_materials',
  "Mission, Values, & Commitment.docx": 'training_materials',
  "Post Sign Up Timeline.docx": 'training_materials',
  "Role+.docx": 'training_materials',
  "Roof-ER Sales Training (1).pptx": 'training_materials',
  "Roof-ER Sales Training.pptx": 'training_materials',
  "Roof-ER Sales Training.pptx.pdf": 'training_materials',
  "Sales Operations and Tasks.docx": 'training_materials',
  "Training Manual.docx": 'training_materials',
  "Training Timeline.docx": 'training_materials',
  "Training.docx": 'training_materials',

  // Agreements (7)
  "Claim Authorization Form.pdf": 'agreements',
  "DMV Blank Contingency.pdf": 'agreements',
  "PA Blank Contingency.pdf": 'agreements',
  "Project Agreement - Repair - MD.pdf": 'agreements',
  "Project Agreement - Repair - VA.pdf": 'agreements',
  "Repair Attempt Agreement.pdf": 'agreements',
  "iTel Agreement.pdf": 'agreements',

  // Building Codes (5)
  "Flashing Codes.docx": 'building_codes',
  "Low Roof_Flat Roof Code.docx": 'building_codes',
  "Maryland Exterior Wrap Code R703.docx": 'building_codes',
  "Virginia Residential Building Codes.docx": 'building_codes',
  "Virginia building codes Re-roofing Chapters.docx": 'building_codes',

  // Manufacturer Specs (6)
  "GAF Requirement - Slope Replacement.pdf": 'manufacturer_specs',
  "GAF Standard Warranty.pdf": 'manufacturer_specs',
  "GAF Storm Damage Guidelines .pdf": 'manufacturer_specs',
  "GAF Timberline HDZ Presentation.pptx": 'manufacturer_specs',
  "GAF Warranty Comparison.pdf": 'manufacturer_specs',
  "GAF_Storm.docx": 'manufacturer_specs',

  // Warranties (5)
  "Golden_Pledge_Limited_RESWT161_Legal_Sample.pdf": 'warranties',
  "Silver Pledge Legalese.pdf": 'warranties',
  "Silver Pledge Warranty Brochure.pdf": 'warranties',
  "Warranty Comparison Prsentation (1).pptx": 'warranties',
  "Warranty Comparison Prsentation.pptx": 'warranties',

  // Pushback Strategies (7)
  "Arbitration Information.docx": 'pushback_strategies',
  "Complaint Forms.docx": 'pushback_strategies',
  "Escal.docx": 'pushback_strategies',
  "PHILLY PARTIALS.docx": 'pushback_strategies',
  "Pushback.docx": 'pushback_strategies',
  "Request For Appraisal.docx": 'pushback_strategies',
  "Siding Argument.docx": 'pushback_strategies',

  // Process Guides (22)
  "Adjuster_Inspector Information Sheet1.pdf": 'process_guides',
  "Claim Filing Information Sheet.docx": 'process_guides',
  "Emergency Tarp.pdf": 'process_guides',
  "Engineers.docx": 'process_guides',
  "GAF Guidelines Template.docx": 'process_guides',
  "Generic Partial Template.docx": 'process_guides',
  "Hover ESX_XML_PDF Process.docx": 'process_guides',
  "How to do a Repair Attempt [EXAMPLE].docx": 'process_guides',
  "InsuranceAgrement_Updated.pdf": 'process_guides',
  "Maryland Insurance Administration Matching Requirement 1.pdf": 'process_guides',
  "Maryland Insurance Administration Matching Requirement 2.pdf": 'process_guides',
  "Maryland Insurance Administration Matching Requirement 3.pdf": 'process_guides',
  "Referral Bonus.docx": 'process_guides',
  "Required Mortgage Endorsement Companies.docx": 'process_guides',
  "RoofER Standard Materials.docx": 'process_guides',
  "RoofER_Master_Documents.pdf": 'process_guides',
  "RoofER_Master_Documents_Updated.pdf": 'process_guides',
  "RoofER_Top10_CheatSheet_Fixed.pdf": 'process_guides',
  "SP Exclusion Form.pdf": 'process_guides',
  "Stuck_do.docx": 'process_guides',
  "What is a Deductible_.pdf": 'process_guides',
  "📧 Email Generator .docx": 'process_guides',

  // Reference (14)
  "Discontinued-Shingle-List.pdf": 'reference',
  "Merged_PDFs_1.pdf": 'reference',
  "Merged_PDFs_2.pdf": 'reference',
  "Merged_PDFs_3.pdf": 'reference',
  "Merged_PDFs_4.pdf": 'reference',
  "Merged_PDFs_5.pdf": 'reference',
  "Merged_PDFs_6.pdf": 'reference',
  "RESIDENTIAL_BRAND_GUIDELINES.pdf": 'reference',
  "Roof-ER Quick Cheat Sheet.pdf": 'reference',
  "Roof-ER Quick Strike Guide.docx": 'reference',
  "Roof-ER.pdf": 'reference',
  "Untitled document.docx": 'reference',
  "docs_temps.docx": 'reference',
  "susan_ai.docx": 'reference'
}

function generateDocumentId(filename) {
  return filename
    .replace(/\.(pdf|docx?|pptx?|PDF)$/i, '')
    .replace(/[^a-zA-Z0-9_\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function extractTitle(filename) {
  return filename
    .replace(/\.(pdf|docx?|pptx?|PDF)$/i, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+\.\s*/, '')
    .trim()
}

function generateSummary(content, maxLength = 200) {
  if (!content) return 'Document content'

  const paragraphs = content.split('\n\n')
  let summary = paragraphs[0] || content

  summary = summary.split(/\s+/).join(' ')
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  return summary
}

function extractKeywords(content, filename) {
  const keywords = []

  // Filename-based keywords
  const nameParts = filename
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)

  keywords.push(...nameParts)

  // Common insurance terms
  const insuranceTerms = [
    'insurance', 'adjuster', 'claim', 'approval', 'denial', 'estimate',
    'roof', 'siding', 'shingles', 'GAF', 'warranty', 'code', 'IRC',
    'matching', 'replacement', 'repair', 'storm', 'damage', 'hail',
    'wind', 'flashing', 'slope', 'partial', 'full', 'inspection'
  ]

  const contentLower = content.toLowerCase()
  insuranceTerms.forEach(term => {
    if (contentLower.includes(term.toLowerCase()) && !keywords.includes(term.toLowerCase())) {
      keywords.push(term.toLowerCase())
    }
  })

  return keywords.slice(0, 10)
}

// Load embeddings file
const embeddingsPath = path.join(__dirname, '..', 'data', 'susan_ai_embeddings.json')
console.log('[KB] Loading embeddings from:', embeddingsPath)

const data = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'))
const chunks = data.chunks || []

// Group chunks by filename
const documentMap = new Map()
chunks.forEach(chunk => {
  if (chunk.metadata?.filename) {
    const filename = chunk.metadata.filename
    if (!documentMap.has(filename)) {
      documentMap.set(filename, [])
    }
    documentMap.get(filename).push(chunk.text || '')
  }
})

// Convert to document format
const documents = []
documentMap.forEach((textChunks, filename) => {
  const category = FILENAME_TO_CATEGORY[filename] || 'reference'
  const fullContent = textChunks.join('\n')
  const limitedContent = fullContent.substring(0, 100000)

  const doc = {
    id: generateDocumentId(filename),
    filename,
    category,
    title: extractTitle(filename),
    summary: generateSummary(fullContent),
    content: limitedContent,
    keywords: extractKeywords(fullContent, filename),
    metadata: {
      source_file: filename,
      applicable_to: ['roof', 'siding', 'insurance'],
      legal_weight: 'medium'
    }
  }

  documents.push(doc)
})

// Save to JSON file
const outputPath = path.join(__dirname, '..', 'public', 'kb-documents.json')
fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2))

console.log(`[KB] Preloaded ${documents.length} documents → ${outputPath}`)

// Print statistics
const categoryCount = {}
documents.forEach(doc => {
  categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1
})

console.log('[KB] Documents by category:')
Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}`)
})
