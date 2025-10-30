# Data Pipeline Design
## Insurance KB Document Ingestion & Quality System

**Project:** RouteLL-M Insurance Argumentation Chatbot
**Version:** 1.0
**Date:** October 30, 2025
**Author:** Data Science Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Quality Gates](#quality-gates)
6. [Deduplication Strategy](#deduplication-strategy)
7. [Versioning System](#versioning-system)
8. [Metadata Enrichment](#metadata-enrichment)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Deployment Strategy](#deployment-strategy)
11. [Implementation Code](#implementation-code)

---

## Executive Summary

This document outlines the design for a comprehensive data pipeline that will:

- **Ingest** 60+ remaining unprocessed documents
- **Enrich** 132 existing documents with missing metadata
- **Validate** accuracy of code citations and content
- **Deduplicate** and establish version control
- **Monitor** quality metrics continuously
- **Deploy** updates seamlessly to production

### Key Objectives

1. **Automate** document processing to reduce manual effort by 80%
2. **Ensure Quality** through multi-checkpoint validation
3. **Enable Intelligence** via complete metadata for Susan AI
4. **Maintain Accuracy** with automated code citation validation
5. **Scale** to handle future document additions

### Success Criteria

- 95% metadata completeness within 3 weeks
- 100% processing of remaining source files within 1 week
- 90% search result accuracy
- Zero data loss or corruption during migration
- Seamless production deployment with <5 minutes downtime

---

## Pipeline Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SOURCE DOCUMENTS                            │
│  PDF • DOCX • PPTX • XLSX • Images • Videos                         │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INGESTION LAYER                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   PDF    │  │  DOCX    │  │  PPTX    │  │   OCR    │           │
│  │ Extractor│  │  Parser  │  │ Parser   │  │ Engine   │           │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘           │
│        └──────────────┴──────────────┴─────────────┘                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESSING LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Text      │  │   Content    │  │   Structure  │             │
│  │  Cleaning    │  │  Validation  │  │  Analysis    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         └──────────────────┴──────────────────┘                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 ENRICHMENT LAYER (LLM-Powered)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Metadata   │  │   Keyword    │  │    Code      │             │
│  │  Generation  │  │  Extraction  │  │  Citation    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         └──────────────────┴──────────────────┘                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VALIDATION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Quality     │  │    Code      │  │  Duplicate   │             │
│  │  Checks      │  │  Validation  │  │  Detection   │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         └──────────────────┴──────────────────┘                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                        ▼                 ▼
                  ┌──────────┐      ┌──────────┐
                  │  Manual  │      │   Auto   │
                  │  Review  │      │  Approve │
                  │  Queue   │      │  & Store │
                  └─────┬────┘      └─────┬────┘
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE & DEPLOYMENT                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    JSON      │  │   Vector     │  │  Production  │             │
│  │   Storage    │  │  Embeddings  │  │    Deploy    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Document Extraction | PyPDF2, python-docx, python-pptx | Parse various formats |
| OCR | Tesseract, Google Vision API | Extract text from images |
| Text Processing | spaCy, NLTK | NLP and text analysis |
| LLM Analysis | OpenAI GPT-4 or Anthropic Claude | Metadata generation |
| Code Validation | Custom IRC/IBC database | Validate building codes |
| Embeddings | sentence-transformers | Semantic search |
| Storage | JSON files + PostgreSQL | Document storage |
| Orchestration | Apache Airflow or Python scripts | Workflow management |
| Monitoring | Custom dashboard + logs | Quality tracking |

---

## Component Details

### 1. Ingestion Layer

#### 1.1 PDF Extractor

```python
class PDFExtractor:
    """
    Extract text and metadata from PDF files
    Handles multi-column layouts and embedded images
    """

    def __init__(self):
        self.pdf_reader = PyPDF2.PdfReader
        self.ocr_engine = OCREngine()

    def extract(self, pdf_path: str) -> Document:
        """
        Extract all content from PDF
        """
        try:
            # Standard text extraction
            text = self._extract_text(pdf_path)

            # If text is minimal, try OCR
            if len(text.strip()) < 100:
                text = self.ocr_engine.extract_from_pdf(pdf_path)

            # Extract metadata
            metadata = self._extract_pdf_metadata(pdf_path)

            # Detect structure (headings, lists, tables)
            structure = self._analyze_structure(text)

            return Document(
                content=text,
                source_file=Path(pdf_path).name,
                metadata=metadata,
                structure=structure,
                extraction_method='pdf' if len(text) > 100 else 'ocr'
            )

        except Exception as e:
            logging.error(f"Failed to extract {pdf_path}: {e}")
            return None

    def _extract_text(self, pdf_path: str) -> str:
        """Extract text using PyPDF2"""
        with open(pdf_path, 'rb') as file:
            pdf = self.pdf_reader(file)
            text = ""
            for page in pdf.pages:
                text += page.extract_text()
        return text

    def _extract_pdf_metadata(self, pdf_path: str) -> dict:
        """Extract PDF metadata (author, date, etc.)"""
        with open(pdf_path, 'rb') as file:
            pdf = self.pdf_reader(file)
            return {
                'author': pdf.metadata.get('/Author', ''),
                'created': pdf.metadata.get('/CreationDate', ''),
                'pages': len(pdf.pages)
            }

    def _analyze_structure(self, text: str) -> dict:
        """
        Detect document structure
        - Headings (lines in all caps, short lines followed by content)
        - Lists (lines starting with bullets, numbers)
        - Tables (aligned columns)
        """
        lines = text.split('\n')
        structure = {
            'headings': [],
            'lists': [],
            'sections': []
        }

        for i, line in enumerate(lines):
            # Detect headings (all caps, short lines)
            if line.isupper() and 5 < len(line) < 100:
                structure['headings'].append((i, line))

            # Detect lists
            if line.strip().startswith(('•', '-', '*', '1.', '2.', 'a.', 'A.')):
                structure['lists'].append((i, line))

        return structure
```

#### 1.2 DOCX Parser

```python
class DOCXParser:
    """
    Extract text, formatting, and structure from DOCX files
    Preserves headings, lists, tables, and styles
    """

    def __init__(self):
        self.docx_reader = docx.Document

    def extract(self, docx_path: str) -> Document:
        """
        Extract all content from DOCX with structure preservation
        """
        try:
            doc = self.docx_reader(docx_path)

            # Extract text with formatting
            content = self._extract_formatted_text(doc)

            # Extract tables separately
            tables = self._extract_tables(doc)

            # Detect document structure
            structure = self._analyze_docx_structure(doc)

            # Extract metadata
            metadata = self._extract_docx_metadata(doc, docx_path)

            return Document(
                content=content,
                tables=tables,
                source_file=Path(docx_path).name,
                metadata=metadata,
                structure=structure,
                extraction_method='docx'
            )

        except Exception as e:
            logging.error(f"Failed to parse {docx_path}: {e}")
            return None

    def _extract_formatted_text(self, doc) -> str:
        """
        Extract text preserving structure markers
        """
        text_parts = []

        for paragraph in doc.paragraphs:
            # Detect heading levels
            if paragraph.style.name.startswith('Heading'):
                level = paragraph.style.name[-1]
                text_parts.append(f"\n{'#' * int(level)} {paragraph.text}\n")
            else:
                text_parts.append(paragraph.text)

        return '\n'.join(text_parts)

    def _extract_tables(self, doc) -> list:
        """Extract all tables with structure"""
        tables = []
        for table in doc.tables:
            table_data = []
            for row in table.rows:
                row_data = [cell.text for cell in row.cells]
                table_data.append(row_data)
            tables.append(table_data)
        return tables

    def _analyze_docx_structure(self, doc) -> dict:
        """
        Analyze document structure
        """
        structure = {
            'sections': [],
            'headings': [],
            'has_tables': len(doc.tables) > 0,
            'has_images': len(doc.inline_shapes) > 0
        }

        for i, paragraph in enumerate(doc.paragraphs):
            if paragraph.style.name.startswith('Heading'):
                structure['headings'].append({
                    'level': int(paragraph.style.name[-1]),
                    'text': paragraph.text,
                    'position': i
                })

        return structure

    def _extract_docx_metadata(self, doc, path: str) -> dict:
        """Extract document metadata"""
        core_props = doc.core_properties
        return {
            'author': core_props.author or '',
            'created': core_props.created.isoformat() if core_props.created else '',
            'modified': core_props.modified.isoformat() if core_props.modified else '',
            'title': core_props.title or '',
            'file_size': Path(path).stat().st_size
        }
```

#### 1.3 OCR Engine

```python
class OCREngine:
    """
    Optical Character Recognition for scanned documents and images
    Uses Tesseract as primary engine with Google Vision API fallback
    """

    def __init__(self):
        self.tesseract_cmd = '/usr/local/bin/tesseract'
        pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd

    def extract_from_pdf(self, pdf_path: str) -> str:
        """
        Convert PDF to images and OCR each page
        """
        images = convert_from_path(pdf_path)
        text_parts = []

        for i, image in enumerate(images):
            try:
                # Preprocess image for better OCR
                processed_image = self._preprocess_image(image)

                # OCR with Tesseract
                text = pytesseract.image_to_string(
                    processed_image,
                    config='--psm 6'  # Assume uniform block of text
                )

                # If confidence is low, try Google Vision API
                if self._is_low_quality(text):
                    text = self._google_vision_ocr(image)

                text_parts.append(text)

            except Exception as e:
                logging.error(f"OCR failed for page {i} of {pdf_path}: {e}")
                text_parts.append("")

        return '\n\n'.join(text_parts)

    def _preprocess_image(self, image):
        """
        Enhance image for better OCR results
        - Convert to grayscale
        - Increase contrast
        - Remove noise
        - Binarization
        """
        img = np.array(image)

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Increase contrast
        contrast = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)

        # Denoise
        denoised = cv2.fastNlMeansDenoising(contrast)

        # Binarization (adaptive threshold)
        binary = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        return binary

    def _is_low_quality(self, text: str) -> bool:
        """
        Detect if OCR output is likely incorrect
        - Too many special characters
        - Very short output
        - High ratio of non-alphanumeric characters
        """
        if len(text) < 50:
            return True

        alphanumeric = sum(c.isalnum() for c in text)
        ratio = alphanumeric / len(text)

        return ratio < 0.7  # If less than 70% alphanumeric, likely poor OCR

    def _google_vision_ocr(self, image):
        """
        Use Google Vision API for difficult images
        (Requires API key setup)
        """
        # Placeholder - implement if budget allows
        # from google.cloud import vision
        # client = vision.ImageAnnotatorClient()
        # ...
        pass
```

---

### 2. Processing Layer

#### 2.1 Text Cleaning

```python
class TextCleaner:
    """
    Clean and normalize extracted text
    - Remove OCR artifacts
    - Fix common errors
    - Normalize whitespace
    - Standardize formatting
    """

    def __init__(self):
        self.replacements = {
            # Common OCR errors
            '|': 'I',  # Pipe often mistaken for I
            'l ': 'I ',  # Lowercase L for I
            ' rn': ' m',  # rn often mistaken for m
            '0': 'O',  # In all-caps words, 0 is likely O

            # Special characters
            '\u2018': "'",  # Left single quote
            '\u2019': "'",  # Right single quote
            '\u201c': '"',  # Left double quote
            '\u201d': '"',  # Right double quote
            '\u2013': '-',  # En dash
            '\u2014': '--', # Em dash
        }

    def clean(self, text: str) -> str:
        """
        Apply all cleaning steps
        """
        # Remove null bytes and control characters
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')

        # Fix common OCR errors
        for old, new in self.replacements.items():
            text = text.replace(old, new)

        # Normalize whitespace
        text = self._normalize_whitespace(text)

        # Fix broken words (words split by newlines)
        text = self._fix_broken_words(text)

        # Remove page numbers and headers/footers
        text = self._remove_artifacts(text)

        return text

    def _normalize_whitespace(self, text: str) -> str:
        """
        Standardize whitespace
        - Multiple spaces to single space
        - Multiple newlines to max 2
        - Remove trailing whitespace
        """
        # Multiple spaces to single
        text = re.sub(r' +', ' ', text)

        # Multiple newlines to max 2
        text = re.sub(r'\n{3,}', '\n\n', text)

        # Remove trailing whitespace from each line
        lines = [line.rstrip() for line in text.split('\n')]

        return '\n'.join(lines)

    def _fix_broken_words(self, text: str) -> str:
        """
        Fix words broken across lines with hyphens
        Example: "insur-\nance" -> "insurance"
        """
        pattern = r'(\w+)-\s*\n\s*(\w+)'
        text = re.sub(pattern, r'\1\2', text)
        return text

    def _remove_artifacts(self, text: str) -> str:
        """
        Remove page numbers, headers, footers
        Common patterns:
        - "Page X of Y"
        - "Page X"
        - Document title repeated on each page
        """
        lines = text.split('\n')
        cleaned_lines = []

        for line in lines:
            # Skip page numbers
            if re.match(r'^\s*Page\s+\d+', line, re.IGNORECASE):
                continue

            # Skip lines that are just numbers (page numbers)
            if re.match(r'^\s*\d+\s*$', line):
                continue

            cleaned_lines.append(line)

        return '\n'.join(cleaned_lines)
```

#### 2.2 Content Validation

```python
class ContentValidator:
    """
    Validate extracted content meets minimum quality standards
    """

    def __init__(self):
        self.min_content_length = 100
        self.min_word_count = 20
        self.max_special_char_ratio = 0.3

    def validate(self, document: Document) -> ValidationResult:
        """
        Run all validation checks
        """
        checks = {
            'min_length': self._check_min_length(document.content),
            'readable': self._check_readability(document.content),
            'structure': self._check_structure(document),
            'encoding': self._check_encoding(document.content),
            'completeness': self._check_completeness(document)
        }

        passed = all(check['passed'] for check in checks.values())

        return ValidationResult(
            passed=passed,
            checks=checks,
            score=sum(check['passed'] for check in checks.values()) / len(checks),
            recommendations=self._generate_recommendations(checks)
        )

    def _check_min_length(self, content: str) -> dict:
        """Check if content meets minimum length requirements"""
        length = len(content.strip())
        words = len(content.split())

        passed = length >= self.min_content_length and words >= self.min_word_count

        return {
            'passed': passed,
            'length': length,
            'words': words,
            'message': f"Content has {length} characters and {words} words"
        }

    def _check_readability(self, content: str) -> dict:
        """
        Check if text is readable
        - Not too many special characters
        - Has proper sentence structure
        - Has English words
        """
        # Count special characters
        special_chars = sum(not c.isalnum() and not c.isspace() for c in content)
        ratio = special_chars / len(content) if content else 1

        # Check for English words
        words = content.split()
        english_words = sum(self._is_english_word(word) for word in words[:100])
        english_ratio = english_words / min(len(words), 100) if words else 0

        passed = ratio < self.max_special_char_ratio and english_ratio > 0.7

        return {
            'passed': passed,
            'special_char_ratio': ratio,
            'english_word_ratio': english_ratio,
            'message': f"Readability: {english_ratio:.0%} English words, {ratio:.1%} special chars"
        }

    def _check_structure(self, document: Document) -> dict:
        """Check if document has clear structure"""
        has_headings = bool(document.structure.get('headings'))
        has_sections = bool(document.structure.get('sections'))
        has_lists = bool(document.structure.get('lists'))

        structure_score = sum([has_headings, has_sections, has_lists]) / 3

        return {
            'passed': structure_score >= 0.33,  # At least one structural element
            'has_headings': has_headings,
            'has_sections': has_sections,
            'has_lists': has_lists,
            'message': f"Document structure score: {structure_score:.0%}"
        }

    def _check_encoding(self, content: str) -> dict:
        """Check for encoding issues"""
        # Look for common encoding error patterns
        encoding_errors = [
            '\ufffd',  # Replacement character
            '?????',   # Multiple question marks (encoding failure)
            '\x00',    # Null bytes
        ]

        has_errors = any(error in content for error in encoding_errors)

        return {
            'passed': not has_errors,
            'message': "Encoding errors detected" if has_errors else "Encoding OK"
        }

    def _check_completeness(self, document: Document) -> dict:
        """Check if document seems complete"""
        content = document.content

        # Check for truncation indicators
        truncation_indicators = [
            content.endswith('...'),
            '[continued]' in content.lower(),
            'see page' in content.lower() and not any(x in content for x in ['Page 1', 'Page 2']),
        ]

        is_truncated = any(truncation_indicators)

        return {
            'passed': not is_truncated,
            'message': "Document may be truncated" if is_truncated else "Document appears complete"
        }

    def _is_english_word(self, word: str) -> bool:
        """Simple English word check"""
        # Remove punctuation
        word = ''.join(c for c in word if c.isalpha())

        # English words typically have vowels
        has_vowel = any(v in word.lower() for v in 'aeiou')

        # Reasonable length
        reasonable_length = 1 < len(word) < 20

        return has_vowel and reasonable_length

    def _generate_recommendations(self, checks: dict) -> list:
        """Generate recommendations based on failed checks"""
        recommendations = []

        if not checks['min_length']['passed']:
            recommendations.append("Document content is too short. Check if extraction was complete.")

        if not checks['readable']['passed']:
            if checks['readable']['special_char_ratio'] > 0.3:
                recommendations.append("High special character ratio. May need OCR re-processing.")
            if checks['readable']['english_word_ratio'] < 0.7:
                recommendations.append("Low English word ratio. Verify extraction language settings.")

        if not checks['structure']['passed']:
            recommendations.append("No clear document structure detected. May need manual formatting.")

        if not checks['encoding']['passed']:
            recommendations.append("Encoding errors detected. Re-extract with different encoding.")

        if not checks['completeness']['passed']:
            recommendations.append("Document may be truncated. Verify source file is complete.")

        return recommendations
```

---

### 3. Enrichment Layer

#### 3.1 Metadata Generation (LLM-Powered)

```python
class MetadataGenerator:
    """
    Generate comprehensive metadata using LLM analysis
    """

    def __init__(self, llm_client):
        self.llm = llm_client
        self.prompt_template = self._load_prompt_template()

    def generate(self, document: Document) -> DocumentMetadata:
        """
        Generate all metadata fields using LLM
        """
        # Prepare document context
        context = self._prepare_context(document)

        # Call LLM with structured prompt
        response = self.llm.generate(
            prompt=self.prompt_template.format(
                filename=document.source_file,
                content=context['content'][:4000],  # First 4000 chars
                structure=context['structure']
            ),
            temperature=0.3,  # Lower temperature for consistency
            max_tokens=1000
        )

        # Parse LLM response into structured metadata
        metadata = self._parse_llm_response(response)

        # Validate and refine metadata
        metadata = self._validate_metadata(metadata, document)

        return metadata

    def _load_prompt_template(self) -> str:
        """
        Prompt template for metadata generation
        """
        return """
You are an expert in insurance claim documentation analysis. Analyze the following document and generate structured metadata.

**Document:** {filename}

**Content:**
{content}

**Structure:**
{structure}

Generate the following metadata in JSON format:

1. **category**: Choose ONE from:
   - building_codes (IRC, IBC, state codes)
   - manufacturer_specs (GAF, warranties)
   - pushback (insurance arguments)
   - pushback_strategies (escalation, complaints)
   - email_templates (email templates)
   - sales_scripts (call scripts, pitches)
   - agreements (contracts, forms)
   - warranties (product warranties)
   - training (training materials, scripts)
   - templates (document templates)
   - reference (quick references, guides)
   - certifications (licenses, insurance certificates)
   - photo_reports (sample photos and reports)
   - reports (inspection reports, packets)
   - process_guides (how-to guides, workflows)

2. **title**: Clear, descriptive title (50-80 characters)

3. **summary**: Concise summary (100-150 characters) describing purpose and key content

4. **keywords**: Array of 8-12 relevant keywords including:
   - Technical terms
   - Code citations (if applicable)
   - Scenarios covered
   - Key concepts

5. **metadata.states**: Array of applicable states
   - "VA", "MD", "PA" for state-specific
   - ["VA", "MD", "PA"] if applies to all three
   - ["All states"] if nationally applicable
   - ["All IRC jurisdictions"] if based on IRC

6. **metadata.scenarios**: Array of applicable scenarios (choose all that apply):
   - partial_replacement
   - full_denial
   - matching_dispute
   - double_layer
   - low_slope
   - creased_shingles
   - discontinued_shingles
   - siding_damage
   - flashing_code
   - warranty_void

7. **metadata.applicable_to**: Array of project types:
   - roof, siding, gutters, windows, etc.

8. **metadata.code_citations**: Array of building code citations found (e.g., ["IRC R908.3", "MD Bulletin 18-23"])

9. **metadata.success_rate**: Estimated success rate (50-100) based on:
   - Strength of arguments
   - Code/regulation backing
   - Specificity of guidance
   - Leave null if not applicable (templates, reference docs)

10. **metadata.confidence_level**: "high", "medium", or "low" based on content quality and completeness

Return ONLY the JSON object, no additional text.
"""

    def _prepare_context(self, document: Document) -> dict:
        """
        Prepare document context for LLM
        """
        return {
            'content': document.content,
            'structure': json.dumps(document.structure, indent=2),
            'filename': document.source_file
        }

    def _parse_llm_response(self, response: str) -> DocumentMetadata:
        """
        Parse LLM JSON response into metadata object
        """
        try:
            # Extract JSON from response (in case LLM adds extra text)
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                metadata_dict = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in LLM response")

            return DocumentMetadata(**metadata_dict)

        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"Failed to parse LLM response: {e}")
            logging.error(f"Response was: {response}")
            return None

    def _validate_metadata(self, metadata: DocumentMetadata, document: Document) -> DocumentMetadata:
        """
        Validate and refine LLM-generated metadata
        """
        if not metadata:
            return None

        # Validate category is in allowed list
        valid_categories = [
            'building_codes', 'manufacturer_specs', 'pushback', 'pushback_strategies',
            'email_templates', 'sales_scripts', 'agreements', 'warranties', 'training',
            'templates', 'reference', 'certifications', 'photo_reports', 'reports',
            'process_guides', 'training_materials', 'training_scripts'
        ]
        if metadata.category not in valid_categories:
            logging.warning(f"Invalid category '{metadata.category}', defaulting to 'reference'")
            metadata.category = 'reference'

        # Validate states
        valid_states = ['VA', 'MD', 'PA', 'All states', 'All IRC jurisdictions']
        if metadata.metadata.get('states'):
            metadata.metadata['states'] = [
                s for s in metadata.metadata['states'] if s in valid_states
            ]

        # Validate success rate range
        if metadata.metadata.get('success_rate'):
            rate = metadata.metadata['success_rate']
            if not (50 <= rate <= 100):
                logging.warning(f"Success rate {rate} out of range, capping")
                metadata.metadata['success_rate'] = max(50, min(100, rate))

        # Validate code citations format
        if metadata.metadata.get('code_citations'):
            metadata.metadata['code_citations'] = [
                self._normalize_code_citation(c)
                for c in metadata.metadata['code_citations']
            ]

        return metadata

    def _normalize_code_citation(self, citation: str) -> str:
        """
        Normalize code citation format
        Example: "IRC R908.3" or "MD IRC R703.2"
        """
        # Basic normalization
        citation = citation.strip().upper()

        # Ensure proper spacing
        citation = re.sub(r'([A-Z]+)([R\d])', r'\1 \2', citation)

        return citation
```

#### 3.2 Keyword Extraction

```python
class KeywordExtractor:
    """
    Extract relevant keywords using NLP and domain knowledge
    """

    def __init__(self):
        # Load spaCy model for NLP
        self.nlp = spacy.load('en_core_web_sm')

        # Domain-specific keyword lists
        self.code_keywords = self._load_code_keywords()
        self.scenario_keywords = self._load_scenario_keywords()
        self.technical_keywords = self._load_technical_keywords()

    def extract(self, document: Document, min_keywords=8, max_keywords=12) -> list:
        """
        Extract keywords using multiple methods and combine
        """
        # Method 1: Domain-specific keyword matching
        domain_keywords = self._extract_domain_keywords(document.content)

        # Method 2: NLP-based extraction (nouns, proper nouns, technical terms)
        nlp_keywords = self._extract_nlp_keywords(document.content)

        # Method 3: Code citation extraction
        code_keywords = self._extract_code_citations(document.content)

        # Method 4: TF-IDF based extraction
        tfidf_keywords = self._extract_tfidf_keywords(document.content)

        # Combine and rank
        all_keywords = self._combine_and_rank(
            domain_keywords,
            nlp_keywords,
            code_keywords,
            tfidf_keywords
        )

        # Return top N keywords
        return all_keywords[:max_keywords]

    def _extract_domain_keywords(self, content: str) -> list:
        """
        Match against domain-specific keyword lists
        """
        content_lower = content.lower()
        found_keywords = []

        # Check code keywords
        for keyword in self.code_keywords:
            if keyword.lower() in content_lower:
                found_keywords.append((keyword, 3))  # High weight

        # Check scenario keywords
        for keyword in self.scenario_keywords:
            if keyword.lower() in content_lower:
                found_keywords.append((keyword, 2))  # Medium weight

        # Check technical keywords
        for keyword in self.technical_keywords:
            if keyword.lower() in content_lower:
                found_keywords.append((keyword, 1))  # Normal weight

        return found_keywords

    def _extract_nlp_keywords(self, content: str) -> list:
        """
        Use spaCy NLP to extract keywords
        """
        doc = self.nlp(content[:10000])  # Limit to first 10k chars for performance
        keywords = []

        # Extract noun chunks (multi-word concepts)
        for chunk in doc.noun_chunks:
            # Filter out common words and short chunks
            if len(chunk.text.split()) > 1 and chunk.text.lower() not in ['the roof', 'the insurance']:
                keywords.append((chunk.text, 1))

        # Extract named entities (ORG, PRODUCT, LAW)
        for ent in doc.ents:
            if ent.label_ in ['ORG', 'PRODUCT', 'LAW', 'GPE']:
                keywords.append((ent.text, 2))

        return keywords

    def _extract_code_citations(self, content: str) -> list:
        """
        Extract building code citations
        """
        patterns = [
            r'IRC\s+[RS]?\d+(?:\.\d+)*',
            r'IBC\s+\d+(?:\.\d+)*',
            r'(?:VA|MD|PA)\s+(?:IRC\s+)?[RS]?\d+(?:\.\d+)*',
            r'(?:Maryland|Virginia|Pennsylvania)\s+(?:Code|Bulletin)\s+[\d-]+',
        ]

        citations = []
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            citations.extend([(m, 3) for m in matches])  # High weight for codes

        return citations

    def _extract_tfidf_keywords(self, content: str) -> list:
        """
        Extract keywords using TF-IDF
        """
        from sklearn.feature_extraction.text import TfidfVectorizer

        # Simple TF-IDF on document
        vectorizer = TfidfVectorizer(max_features=20, stop_words='english', ngram_range=(1, 3))

        try:
            tfidf_matrix = vectorizer.fit_transform([content])
            feature_names = vectorizer.get_feature_names_out()

            # Get scores for each term
            scores = tfidf_matrix.toarray()[0]

            # Combine terms and scores
            keywords = [(feature_names[i], scores[i]) for i in range(len(feature_names))]

            return keywords

        except:
            return []

    def _combine_and_rank(self, *keyword_lists) -> list:
        """
        Combine keywords from multiple sources and rank by total weight
        """
        keyword_weights = {}

        for kw_list in keyword_lists:
            for keyword, weight in kw_list:
                # Normalize keyword
                keyword = keyword.strip()

                if keyword in keyword_weights:
                    keyword_weights[keyword] += weight
                else:
                    keyword_weights[keyword] = weight

        # Sort by weight descending
        ranked_keywords = sorted(
            keyword_weights.items(),
            key=lambda x: x[1],
            reverse=True
        )

        # Return just the keywords (not weights)
        return [kw for kw, weight in ranked_keywords]

    def _load_code_keywords(self) -> list:
        """Load building code related keywords"""
        return [
            'IRC R908.3', 'IRC R908.5', 'IRC 1511.3.1.1', 'IRC R905.2.2',
            'IRC R703.2', 'IRC R703.4', 'IBC', 'building code', 'code requirement',
            'mandatory code', 'code compliance', 'building permit', 'inspection',
            'Maryland Bulletin 18-23', 'MD Code § 27-303', 'unfair settlement',
        ]

    def _load_scenario_keywords(self) -> list:
        """Load insurance scenario keywords"""
        return [
            'partial replacement', 'full denial', 'matching dispute', 'double layer',
            'low slope', 'creased shingles', 'discontinued shingles', 'siding damage',
            'flashing code', 'warranty void', 'insurance argument', 'adjuster',
            'escalation', 'complaint', 'arbitration',
        ]

    def _load_technical_keywords(self) -> list:
        """Load technical roofing keywords"""
        return [
            'GAF', 'shingles', 'flashing', 'drip edge', 'underlayment', 'valley',
            'ridge cap', 'starter strip', 'ice and water shield', 'IWS',
            'slope', 'pitch', 'tear-off', 'recover', 'weatherproofing',
            'Silver Pledge', 'Golden Pledge', 'warranty', 'manufacturer',
        ]
```

#### 3.3 Code Citation Extractor & Validator

```python
class CodeCitationValidator:
    """
    Extract and validate building code citations
    """

    def __init__(self):
        # Load IRC/IBC code database (2025 edition)
        self.irc_codes = self._load_irc_codes()
        self.ibc_codes = self._load_ibc_codes()
        self.state_codes = self._load_state_codes()

    def extract_and_validate(self, content: str) -> list:
        """
        Extract all code citations and validate them
        """
        # Extract citations
        citations = self._extract_citations(content)

        # Validate each citation
        validated_citations = []
        for citation in citations:
            validation = self._validate_citation(citation)
            if validation['valid']:
                validated_citations.append({
                    'citation': citation,
                    'normalized': validation['normalized'],
                    'title': validation['title'],
                    'verified': True
                })
            else:
                validated_citations.append({
                    'citation': citation,
                    'normalized': citation,
                    'title': 'Unknown',
                    'verified': False,
                    'suggestion': validation.get('suggestion', '')
                })

        return validated_citations

    def _extract_citations(self, content: str) -> list:
        """
        Extract code citations using regex patterns
        """
        patterns = {
            'irc': r'IRC\s+[RS]?\d+(?:\.\d+)*(?:\.\d+)*',
            'ibc': r'IBC\s+\d+(?:\.\d+)*(?:\.\d+)*',
            'va_code': r'(?:VA|Virginia)\s+(?:Residential\s+)?Code\s+[RS]?\d+(?:\.\d+)*',
            'md_code': r'(?:MD|Maryland)\s+(?:IRC\s+)?[RS]?\d+(?:\.\d+)*',
            'md_bulletin': r'Maryland\s+(?:Insurance\s+Administration\s+)?Bulletin\s+[\d-]+',
            'md_law': r'MD\s+Code\s+§\s+[\d-]+',
            'pa_code': r'(?:PA|Pennsylvania)\s+(?:UCC|Code)\s+[RS]?\d+(?:\.\d+)*',
        }

        citations = set()
        for pattern_type, pattern in patterns.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            citations.update(matches)

        return list(citations)

    def _validate_citation(self, citation: str) -> dict:
        """
        Validate citation against code database
        """
        # Normalize citation
        normalized = self._normalize_citation(citation)

        # Check IRC codes
        if 'IRC' in normalized:
            code_num = self._extract_code_number(normalized)
            if code_num in self.irc_codes:
                return {
                    'valid': True,
                    'normalized': normalized,
                    'title': self.irc_codes[code_num]['title'],
                    'description': self.irc_codes[code_num]['description']
                }
            else:
                # Try to find similar code
                suggestion = self._find_similar_code(code_num, self.irc_codes)
                return {
                    'valid': False,
                    'normalized': normalized,
                    'suggestion': suggestion
                }

        # Check IBC codes
        if 'IBC' in normalized:
            code_num = self._extract_code_number(normalized)
            if code_num in self.ibc_codes:
                return {
                    'valid': True,
                    'normalized': normalized,
                    'title': self.ibc_codes[code_num]['title']
                }

        # Check state-specific codes
        for state in ['VA', 'MD', 'PA']:
            if state in normalized:
                if normalized in self.state_codes.get(state, {}):
                    return {
                        'valid': True,
                        'normalized': normalized,
                        'title': self.state_codes[state][normalized]['title']
                    }

        # If not found, return as unverified
        return {
            'valid': False,
            'normalized': normalized,
            'suggestion': 'Could not verify code citation. Please check manually.'
        }

    def _normalize_citation(self, citation: str) -> str:
        """
        Normalize citation format
        """
        # Convert to uppercase
        citation = citation.upper().strip()

        # Standardize spacing
        citation = re.sub(r'\s+', ' ', citation)

        # Ensure space after IRC/IBC
        citation = re.sub(r'(IRC|IBC)([RS\d])', r'\1 \2', citation)

        return citation

    def _extract_code_number(self, citation: str) -> str:
        """
        Extract just the code number part
        Example: "IRC R908.3" -> "R908.3"
        """
        match = re.search(r'[RS]?\d+(?:\.\d+)*(?:\.\d+)*', citation)
        return match.group() if match else ''

    def _find_similar_code(self, code_num: str, code_db: dict) -> str:
        """
        Find similar code if exact match not found
        """
        # Simple similarity check
        for known_code in code_db.keys():
            if code_num[:4] == known_code[:4]:  # Same section
                return f"Did you mean {known_code}?"
        return "Code not found in database. Verify against current IRC/IBC."

    def _load_irc_codes(self) -> dict:
        """
        Load IRC code database
        """
        # This would load from a JSON file or database
        # For now, hardcode key codes used in insurance arguments
        return {
            'R908.3': {
                'title': 'Re-Roofing Material Matching Requirement',
                'description': 'Roof repair or replacement materials shall match the existing roof in composition, color, and size.',
                'section': 'Chapter 9: Roof Assemblies'
            },
            'R908.5': {
                'title': 'Flashing Requirements',
                'description': 'Roof valley flashing and sidewall flashing shall be replaced when re-roofing.',
                'section': 'Chapter 9: Roof Assemblies'
            },
            'R1511.3.1.1': {
                'title': 'Roof Recover Prohibition',
                'description': 'Roof recover is prohibited when two or more applications of any type of roofing exist.',
                'section': 'Chapter 15: Roof Assemblies and Rooftop Structures'
            },
            'R905.2.2': {
                'title': 'Asphalt Shingle Slope Requirements',
                'description': 'Asphalt shingles shall be used only on roof slopes of 2:12 or greater.',
                'section': 'Chapter 9: Roof Assemblies'
            },
            'R703.2': {
                'title': 'Water-Resistive Barrier',
                'description': 'A water-resistive barrier shall be applied over studs or sheathing of all exterior walls.',
                'section': 'Chapter 7: Wall Covering'
            },
            'R703.4': {
                'title': 'Flashing Requirements (Walls)',
                'description': 'Flashing shall be installed to prevent entry of water into the wall cavity.',
                'section': 'Chapter 7: Wall Covering'
            },
        }

    def _load_ibc_codes(self) -> dict:
        """Load IBC code database"""
        # Similar structure to IRC
        return {}

    def _load_state_codes(self) -> dict:
        """Load state-specific codes and regulations"""
        return {
            'MD': {
                'MD BULLETIN 18-23': {
                    'title': 'Clarification of Coverage for Mismatch Claims',
                    'description': 'Requires matching "like kind and quality"',
                    'date': '2018-10-30',
                    'status': 'Active'
                },
                'MD CODE § 27-303': {
                    'title': 'Unfair Claim Settlement Practices',
                    'description': 'Defines unfair practices with penalties up to $2,500',
                    'status': 'Active'
                }
            },
            'VA': {},
            'PA': {}
        }
```

---

## Continued in next message...

This is a comprehensive data pipeline design. Would you like me to continue with:
- Part 2: Quality Gates, Deduplication, Versioning
- Part 3: Implementation Code Examples
- Part 4: Monitoring and Deployment Strategy

Let me know if you'd like me to proceed or if you need any clarification on the components already documented!
