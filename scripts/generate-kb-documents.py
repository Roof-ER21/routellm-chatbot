#!/usr/bin/env python3
"""
Generate InsuranceKBDocument entries from embeddings file
Reads susan_ai_embeddings.json and creates TypeScript document definitions
"""

import json
import re
from collections import defaultdict

# Category mapping based on filename patterns
CATEGORY_MAP = {
    # Templates
    'templates': [
        "Danny_s Repair Attempt Video Template.docx",
        "Estimate Request Template.docx",
        "Photo Report Template.docx",
        "Post AM Email Template.docx",
        "Repair Attempt Template.docx",
        "Template from Customer to Insurance.docx",
        "iTel Shingle Template.docx"
    ],
    # Reports
    'reports': [
        "Roof-ER Roof & Siding Claim Response Packet.docx",
        "Roof-ER Siding Claim Response Packet.docx"
    ],
    # Photo Reports
    'photo_reports': [
        "EXAMPLE PHOTOS.pdf",
        "Sample Photo Report 1.pdf",
        "Sample Photo Report 2.pdf",
        "Sample Photo Report 3.pdf",
        "Sample Photo Report 4.pdf"
    ],
    # Certifications
    'certifications': [
        "CERTIFIED_CERTIFICATE.pdf",
        "COI - General Liability.pdf",
        "COI - workers comp 2026.pdf",
        "Copy of MD License (Valid through 7_2025).pdf",
        "Form W-9 (Rev. March 2024) (1).pdf",
        "GAF Certification.PDF",
        "GAF Master Elite 2024.PDF",
        "GAF Master Elite 2025.pdf",
        "MD License (Valid through 7_2025).pdf",
        "MD License.pdf",
        "Maryland License Valid through 2027.pdf",
        "Master Elite Reference Letter for Customers.pdf",
        "PA license 2025 - 2027.pdf",
        "Pennsylvania License Valid Through 2027.pdf",
        "Roof-ER CertainTeed ShingleMaster.pdf"
    ],
    # Training Scripts
    'training_scripts': [
        "Adjuster Meeting Outcome Script.pdf",
        "Contingency and Claim Authorization Script.docx",
        "Full Approval Estimate Phone Call.docx",
        "Initial Pitch Script.docx",
        "Inspection and Post Inspection Script.docx",
        "Partial Estimate Phone Call.docx",
        "Post Adjuster Meeting Script.docx"
    ],
    # Training Materials
    'training_materials': [
        "AM Outcome Process.pdf",
        "Copy of BLANK RoofER - New Sales Hire Checklist.docx",
        "Culture and Commitment.docx.pdf",
        "Knowledge.docx",
        "Mission, Values, & Commitment.docx",
        "Post Sign Up Timeline.docx",
        "Role+.docx",
        "Roof-ER Sales Training (1).pptx",
        "Roof-ER Sales Training.pptx",
        "Roof-ER Sales Training.pptx.pdf",
        "Sales Operations and Tasks.docx",
        "Training Manual.docx",
        "Training Timeline.docx",
        "Training.docx"
    ],
    # Agreements
    'agreements': [
        "Claim Authorization Form.pdf",
        "DMV Blank Contingency.pdf",
        "PA Blank Contingency.pdf",
        "Project Agreement - Repair - MD.pdf",
        "Project Agreement - Repair - VA.pdf",
        "Repair Attempt Agreement.pdf",
        "iTel Agreement.pdf"
    ],
    # Building Codes
    'building_codes': [
        "Flashing Codes.docx",
        "Low Roof_Flat Roof Code.docx",
        "Maryland Exterior Wrap Code R703.docx",
        "Virginia Residential Building Codes.docx",
        "Virginia building codes Re-roofing Chapters.docx"
    ],
    # Manufacturer Specs
    'manufacturer_specs': [
        "GAF Requirement - Slope Replacement.pdf",
        "GAF Standard Warranty.pdf",
        "GAF Storm Damage Guidelines .pdf",
        "GAF Timberline HDZ Presentation.pptx",
        "GAF Warranty Comparison.pdf",
        "GAF_Storm.docx"
    ],
    # Warranties
    'warranties': [
        "Golden_Pledge_Limited_RESWT161_Legal_Sample.pdf",
        "Silver Pledge Legalese.pdf",
        "Silver Pledge Warranty Brochure.pdf",
        "Warranty Comparison Prsentation (1).pptx",
        "Warranty Comparison Prsentation.pptx"
    ],
    # Pushback Strategies
    'pushback_strategies': [
        "Arbitration Information.docx",
        "Complaint Forms.docx",
        "Escal.docx",
        "PHILLY PARTIALS.docx",
        "Pushback.docx",
        "Request For Appraisal.docx",
        "Siding Argument.docx"
    ],
    # Process Guides
    'process_guides': [
        "Adjuster_Inspector Information Sheet1.pdf",
        "Claim Filing Information Sheet.docx",
        "Emergency Tarp.pdf",
        "Engineers.docx",
        "GAF Guidelines Template.docx",
        "Generic Partial Template.docx",
        "Hover ESX_XML_PDF Process.docx",
        "How to do a Repair Attempt [EXAMPLE].docx",
        "InsuranceAgrement_Updated.pdf",
        "Maryland Insurance Administration Matching Requirement 1.pdf",
        "Maryland Insurance Administration Matching Requirement 2.pdf",
        "Maryland Insurance Administration Matching Requirement 3.pdf",
        "Referral Bonus.docx",
        "Required Mortgage Endorsement Companies.docx",
        "RoofER Standard Materials.docx",
        "RoofER_Master_Documents.pdf",
        "RoofER_Master_Documents_Updated.pdf",
        "RoofER_Top10_CheatSheet_Fixed.pdf",
        "SP Exclusion Form.pdf",
        "Stuck_do.docx",
        "What is a Deductible_.pdf",
        "📧 Email Generator .docx"
    ],
    # Reference
    'reference': [
        "Discontinued-Shingle-List.pdf",
        "Merged_PDFs_1.pdf",
        "Merged_PDFs_2.pdf",
        "Merged_PDFs_3.pdf",
        "Merged_PDFs_4.pdf",
        "Merged_PDFs_5.pdf",
        "Merged_PDFs_6.pdf",
        "RESIDENTIAL_BRAND_GUIDELINES.pdf",
        "Roof-ER Quick Cheat Sheet.pdf",
        "Roof-ER Quick Strike Guide.docx",
        "Roof-ER.pdf",
        "Untitled document.docx",
        "docs_temps.docx",
        "susan_ai.docx"
    ]
}

# Reverse mapping
FILENAME_TO_CATEGORY = {}
for category, filenames in CATEGORY_MAP.items():
    for filename in filenames:
        FILENAME_TO_CATEGORY[filename] = category

def clean_text(text):
    """Clean text for TypeScript string"""
    if not text:
        return ""
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Escape backticks
    text = text.replace('`', '\\`')
    # Escape ${} template literals
    text = re.sub(r'\$\{', '\\${', text)
    return text.strip()

def generate_document_id(filename):
    """Generate a clean ID from filename"""
    # Remove extension
    name = re.sub(r'\.(pdf|docx?|pptx?|PDF)$', '', filename)
    # Remove special characters
    name = re.sub(r'[^a-zA-Z0-9_\s-]', '', name)
    # Replace spaces with underscores
    name = re.sub(r'\s+', '_', name)
    # Remove leading/trailing underscores
    name = name.strip('_')
    # Uppercase
    return name.upper()

def extract_title(filename, content):
    """Extract a clean title from filename or content"""
    # Remove extension
    title = re.sub(r'\.(pdf|docx?|pptx?|PDF)$', '', filename)
    # Clean up common patterns
    title = re.sub(r'_+', ' ', title)
    title = re.sub(r'\s+', ' ', title)
    # Remove numbers at start
    title = re.sub(r'^\d+\.\s*', '', title)
    return title.strip()

def generate_summary(content, max_length=200):
    """Generate a summary from content"""
    if not content:
        return "Document content"

    # Take first paragraph or first N characters
    paragraphs = content.split('\n\n')
    summary = paragraphs[0] if paragraphs else content

    # Clean and truncate
    summary = ' '.join(summary.split())
    if len(summary) > max_length:
        summary = summary[:max_length].rsplit(' ', 1)[0] + '...'

    return summary

def extract_keywords(content, filename):
    """Extract keywords from content and filename"""
    keywords = []

    # Add filename-based keywords
    name_parts = re.sub(r'[^a-zA-Z0-9\s]', ' ', filename).lower().split()
    keywords.extend([word for word in name_parts if len(word) > 3])

    # Common insurance terms
    insurance_terms = [
        'insurance', 'adjuster', 'claim', 'approval', 'denial', 'estimate',
        'roof', 'siding', 'shingles', 'GAF', 'warranty', 'code', 'IRC',
        'matching', 'replacement', 'repair', 'storm', 'damage', 'hail',
        'wind', 'flashing', 'slope', 'partial', 'full', 'inspection'
    ]

    content_lower = content.lower()
    for term in insurance_terms:
        if term.lower() in content_lower and term.lower() not in keywords:
            keywords.append(term.lower())

    return keywords[:10]  # Limit to 10 keywords

def main():
    # Load embeddings file
    print("Loading embeddings file...")
    with open('/Users/a21/Desktop/routellm-chatbot-railway/data/susan_ai_embeddings.json', 'r') as f:
        data = json.load(f)

    # Group chunks by filename
    documents = defaultdict(list)
    for chunk in data.get('chunks', []):
        if 'metadata' in chunk and 'filename' in chunk['metadata']:
            filename = chunk['metadata']['filename']
            documents[filename].append(chunk['text'])

    print(f"Found {len(documents)} unique documents\n")

    # Generate TypeScript code
    ts_entries = []

    for filename in sorted(documents.keys()):
        # Get category
        category = FILENAME_TO_CATEGORY.get(filename, 'reference')

        # Combine all chunks for this document
        full_content = '\n'.join(documents[filename])

        # Generate fields
        doc_id = generate_document_id(filename)
        title = extract_title(filename, full_content)
        summary = generate_summary(full_content)
        keywords = extract_keywords(full_content, filename)
        clean_content = clean_text(full_content[:2000])  # Limit content length

        # Generate TypeScript entry
        ts_entry = f'''  {{
    id: '{doc_id}',
    filename: '{filename}',
    category: '{category}',
    title: '{title}',
    summary: `{summary}`,
    content: `{clean_content}`,
    keywords: {json.dumps(keywords)},
    metadata: {{
      source_file: '{filename}',
      applicable_to: ['roof', 'siding', 'insurance'],
      legal_weight: 'medium'
    }}
  }}'''

        ts_entries.append(ts_entry)
        print(f"Generated: {filename} -> {category}")

    # Output TypeScript code
    output = ",\n\n".join(ts_entries)

    print(f"\n\nGenerated {len(ts_entries)} document entries")
    print("\n" + "="*80)
    print("TYPESCRIPT OUTPUT (copy and paste into insurance-argumentation-kb.ts):")
    print("="*80)
    print("\n// GENERATED DOCUMENTS FROM EMBEDDINGS FILE")
    print(output)

    # Save to file
    output_file = '/Users/a21/Desktop/routellm-chatbot-railway/scripts/generated-kb-documents.ts.txt'
    with open(output_file, 'w') as f:
        f.write("// GENERATED DOCUMENTS FROM EMBEDDINGS FILE\n\n")
        f.write(output)

    print(f"\n\nSaved to: {output_file}")

if __name__ == '__main__':
    main()
