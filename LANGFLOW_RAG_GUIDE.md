# Langflow RAG Integration Guide

Complete guide for integrating your insurance knowledge base with Langflow for RAG, fine-tuning, and embeddings.

## Table of Contents

1. [Current Setup](#current-setup)
2. [Langflow OCR Pipeline](#langflow-ocr-pipeline)
3. [Langflow RAG Pipeline](#langflow-rag-pipeline)
4. [Fine-Tuning Pipeline](#fine-tuning-pipeline)
5. [Running the Complete System](#running-the-complete-system)

---

## Current Setup

### What We've Built

- **GPT-4 Vision OCR Engine** (`lib/gpt4-vision-ocr-engine.ts`)
  - Direct OpenAI GPT-4 Vision API integration
  - 5-checkpoint quality validation system
  - Technical term extraction for insurance/roofing domains
  - Comprehensive document structure analysis

- **OCR Integration Layer** (`lib/gpt4-vision-ocr-integration.ts`)
  - Batch processing support
  - Caching system
  - Preprocessing pipeline
  - Cost tracking

- **Batch Processing Script** (`scripts/batch-process-documents.ts`)
  - Process 134 KB documents
  - Progress tracking
  - Resume capability
  - JSON output for RAG ingestion

### Existing RAG Infrastructure

- **PostgreSQL + pgvector** on Railway
- **Embedding Generation** (app/api/admin/generate-embeddings/route.ts)
- **RAG Database Schema** (lib/db-schema-rag.sql)
- **Knowledge Base** (lib/insurance-argumentation-kb.ts) - 16 documents

---

## Langflow OCR Pipeline

### Option 1: Direct GPT-4 Vision (Recommended for Now)

Since you have Langflow installed locally, you can create a simple flow:

#### Flow Components:

```
[File Input] → [GPT-4 Vision Component] → [Text Output] → [Save to JSON]
```

#### Langflow Flow Configuration:

1. **Start Langflow**:
   ```bash
   langflow run
   ```

2. **Create New Flow**: "Insurance Document OCR"

3. **Add Components**:

   **Component 1: File Upload**
   - Type: File
   - Accepts: PDF, PNG, JPG

   **Component 2: GPT-4 Vision**
   - Type: OpenAI
   - Model: gpt-4-vision-preview
   - API Key: ${OPENAI_API_KEY}
   - System Prompt:
     ```
     You are a professional OCR system specialized in insurance and roofing documents.

     Extract ALL text from this document with exact formatting preserved.
     Include all technical terms, building codes, measurements, and tables.

     Return only the extracted text with no commentary.
     ```

   **Component 3: Text Processor**
   - Parse and validate extracted text
   - Run quality checks
   - Extract technical terms

   **Component 4: JSON Output**
   - Save to: `data/processed-kb/documents-ready/`
   - Format:
     ```json
     {
       "id": "doc_ID",
       "sourceFile": "filename.pdf",
       "extractedText": "...",
       "qualityScore": 85,
       "confidence": 90,
       "technicalTerms": [...],
       "status": "processed"
     }
     ```

### Option 2: Use Our TypeScript Engine via API

Create a simple API endpoint that Langflow can call:

#### Create API Route: `app/api/ocr/process/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { gpt4VisionOCRIntegration } from '@/lib/gpt4-vision-ocr-integration';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await gpt4VisionOCRIntegration.processDocument(
      file,
      file.name
    );

    return NextResponse.json({
      success: result.success,
      extractedText: result.extractedText,
      confidence: result.gpt4VisionResult?.confidence,
      qualityScore: result.gpt4VisionResult?.qualityMetrics.overallScore,
      technicalTerms: result.gpt4VisionResult?.technicalTerms,
      cost: result.costEstimate?.estimatedCost
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Langflow HTTP Request Component:

```
[File Input] → [HTTP Request to /api/ocr/process] → [Process Response] → [Save JSON]
```

---

## Langflow RAG Pipeline

### Complete RAG Flow

```
[User Query] → [Query Processing] → [Vector Search] → [Context Retrieval] → [LLM Response]
```

### Components:

#### 1. Vector Database Connection

**Component: PostgreSQL + pgvector**

```yaml
Type: PostgreSQL Vector Store
Connection:
  - Host: Railway PostgreSQL
  - Database: DATABASE_URL from Railway
  - Table: rag_chunks
  - Embedding Dimension: 1536
```

#### 2. Embedding Generation

**Component: OpenAI Embeddings**

```yaml
Type: OpenAI Embeddings
Model: text-embedding-3-small
API Key: ${OPENAI_API_KEY}
Dimensions: 1536
```

#### 3. Vector Search

**Component: Similarity Search**

```yaml
Type: Vector Search
Query Embedding: [From step 2]
Top K: 5
Min Similarity: 0.7
```

#### 4. Context Assembly

**Component: Prompt Template**

```
System: You are Susan21, an expert insurance sales representative.

Context from knowledge base:
{context}

User Question: {query}

Provide a detailed, accurate answer using the context above.
Include specific building codes, regulations, and technical details when relevant.
```

#### 5. LLM Response

**Component: Chat OpenAI**

```yaml
Model: gpt-4-turbo-preview
Temperature: 0.7
Max Tokens: 1500
```

### Langflow JSON Export

```json
{
  "name": "Insurance RAG Pipeline",
  "nodes": [
    {
      "id": "query-input",
      "type": "TextInput",
      "data": { "name": "User Query" }
    },
    {
      "id": "embeddings",
      "type": "OpenAIEmbeddings",
      "data": {
        "model": "text-embedding-3-small",
        "dimensions": 1536
      }
    },
    {
      "id": "vector-search",
      "type": "PostgresVectorStore",
      "data": {
        "connection_string": "${DATABASE_URL}",
        "table_name": "rag_chunks",
        "search_type": "similarity",
        "k": 5
      }
    },
    {
      "id": "prompt-template",
      "type": "PromptTemplate",
      "data": {
        "template": "System: You are Susan21...\n\nContext: {context}\n\nQuestion: {query}"
      }
    },
    {
      "id": "llm",
      "type": "ChatOpenAI",
      "data": {
        "model": "gpt-4-turbo-preview",
        "temperature": 0.7
      }
    }
  ],
  "edges": [
    { "source": "query-input", "target": "embeddings" },
    { "source": "embeddings", "target": "vector-search" },
    { "source": "vector-search", "target": "prompt-template" },
    { "source": "prompt-template", "target": "llm" }
  ]
}
```

---

## Fine-Tuning Pipeline

### Preparing Training Data

#### Step 1: Extract Q&A Pairs from Documents

**Script: `scripts/extract-qa-pairs.ts`**

```typescript
// Extract question-answer pairs from processed documents
// Format for OpenAI fine-tuning API

import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'data/processed-kb/documents';
const OUTPUT_FILE = 'data/fine-tuning/training-data.jsonl';

async function extractQAPairs() {
  const files = fs.readdirSync(DOCS_DIR);
  const trainingData = [];

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8')
    );

    // Generate Q&A pairs from document
    const pairs = generateQAPairs(content);
    trainingData.push(...pairs);
  }

  // Save in OpenAI fine-tuning format
  const jsonl = trainingData
    .map(pair => JSON.stringify(pair))
    .join('\n');

  fs.writeFileSync(OUTPUT_FILE, jsonl);
  console.log(`Generated ${trainingData.length} training examples`);
}

function generateQAPairs(doc: any) {
  // Example pairs - you'll want to expand this
  return [
    {
      messages: [
        { role: 'system', content: 'You are Susan21, an expert insurance sales rep.' },
        { role: 'user', content: `What does ${doc.title} cover?` },
        { role: 'assistant', content: doc.summary }
      ]
    },
    // Add more synthetic Q&A pairs
  ];
}
```

#### Step 2: Fine-Tune with Langflow

**Langflow Fine-Tuning Flow:**

```
[Training Data] → [OpenAI Fine-Tuning Component] → [Model ID Output]
```

**Component Configuration:**

```yaml
Type: OpenAI Fine-Tuning
Base Model: gpt-4-turbo-preview  # or gpt-3.5-turbo for cost savings
Training File: data/fine-tuning/training-data.jsonl
Validation File: data/fine-tuning/validation-data.jsonl
Epochs: 3
Learning Rate Multiplier: 0.1
```

#### Step 3: Use Fine-Tuned Model in RAG

Update your Langflow RAG pipeline to use the fine-tuned model:

```yaml
LLM Component:
  Model: ft:gpt-4-turbo:your-org:model-name:abc123
  # (Use the model ID from fine-tuning output)
```

---

## Running the Complete System

### Full Pipeline Execution

#### Phase 1: OCR Processing

1. **Process Documents with GPT-4 Vision**:
   ```bash
   # Using our TypeScript batch processor
   npm run process:batch

   # OR via Langflow (if you created the flow)
   # Upload documents to Langflow flow
   # Run OCR pipeline
   # Download processed JSON files
   ```

2. **Verify Output**:
   ```bash
   # Check processed documents
   ls -la data/processed-kb/documents-ready/

   # Inspect a sample
   cat data/processed-kb/documents-ready/sample-doc.json
   ```

#### Phase 2: Embedding Generation

1. **Initialize RAG Database** (if not done):
   ```bash
   curl -X POST https://s21.up.railway.app/api/admin/init-rag
   ```

2. **Generate Embeddings**:
   ```bash
   # Trigger embedding generation
   curl -X POST https://s21.up.railway.app/api/admin/generate-embeddings

   # Check status
   curl https://s21.up.railway.app/api/admin/generate-embeddings
   ```

   Expected output:
   ```json
   {
     "ready": true,
     "status": "ready",
     "documents": 142,
     "chunks": 800,
     "message": "RAG system ready to use"
   }
   ```

#### Phase 3: Langflow RAG Setup

1. **Import RAG Flow to Langflow**:
   - Copy the JSON configuration above
   - In Langflow UI: Import → Paste JSON
   - Configure environment variables:
     - `OPENAI_API_KEY`
     - `DATABASE_URL` (from Railway)

2. **Test RAG Query**:
   ```
   Query: "What building code requires matching shingles in Virginia?"

   Expected: Returns IRC R908.3 information with Virginia-specific details
   ```

#### Phase 4: Fine-Tuning (Optional)

1. **Generate Training Data**:
   ```bash
   npm run generate:training-data
   ```

2. **Upload to Langflow**:
   - Create fine-tuning flow
   - Upload training-data.jsonl
   - Start fine-tuning job

3. **Monitor Progress**:
   - Check Langflow UI for status
   - Wait for completion (usually 10-30 minutes)

4. **Update RAG Pipeline**:
   - Replace model ID in LLM component
   - Test with same queries
   - Compare responses (should be more specialized)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Langflow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐      ┌───────────────┐      ┌────────────┐ │
│  │   OCR      │      │     RAG       │      │ Fine-Tune  │ │
│  │  Pipeline  │─────▶│   Pipeline    │◀─────│  Pipeline  │ │
│  └────────────┘      └───────────────┘      └────────────┘ │
│        │                    │                      │        │
└────────┼────────────────────┼──────────────────────┼────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  GPT-4 Vision   │  │  PostgreSQL +   │  │  OpenAI Fine-    │
│  OCR Engine     │  │  pgvector       │  │  Tuning API      │
│  (TypeScript)   │  │  (Railway)      │  │                  │
└─────────────────┘  └─────────────────┘  └──────────────────┘
         │                    │                      │
         └────────────────────┴──────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Susan21 Chat    │
                    │  (s21.railway)   │
                    └──────────────────┘
```

---

## Environment Variables

Make sure these are configured:

```bash
# OpenAI API
OPENAI_API_KEY=sk-...

# Railway Database
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# Langflow (if using API mode)
LANGFLOW_API_URL=http://localhost:7860
LANGFLOW_API_KEY=your-langflow-key  # if secured
```

---

## Cost Estimates

### Per Document Processing:

- **OCR (GPT-4 Vision)**: ~$0.01 - $0.05 per document
- **Embedding Generation**: ~$0.0001 - $0.0005 per document
- **Fine-Tuning**: ~$8 - $50 for 142 documents (one-time)

### For 142 Documents:

- **Total OCR Cost**: ~$1.42 - $7.10
- **Total Embedding Cost**: ~$0.01 - $0.07
- **Fine-Tuning**: ~$8 - $50 (optional)

### Running Costs:

- **Per RAG Query**: ~$0.01 - $0.03 (depending on context size)
- **PostgreSQL (Railway)**: ~$5 - $20/month

---

## Next Steps

1. **Test GPT-4 Vision OCR** on a sample document
2. **Process all 134 documents** with batch script
3. **Generate embeddings** from processed content
4. **Set up Langflow RAG flow** and test queries
5. **(Optional) Create fine-tuning dataset** and train model
6. **Integrate with Susan21 chat** on s21.railway.app

---

## Troubleshooting

### OCR Issues:

- **Low quality scores**: Check source document quality
- **Missing text**: Ensure GPT-4 Vision has access
- **High costs**: Reduce batch size, use caching

### Embedding Issues:

- **Out of memory**: Process in smaller batches
- **Slow generation**: Check Railway instance limits
- **Database connection**: Verify DATABASE_URL

### Langflow Issues:

- **Flow not running**: Check all component connections
- **API errors**: Verify environment variables
- **Slow performance**: Use local Langflow instance

---

## Support

For issues:
1. Check Railway logs: `railway logs`
2. Check Langflow logs: Langflow UI → Logs tab
3. Test components individually
4. Verify API keys and environment variables

---

## Summary

You now have:

✅ GPT-4 Vision OCR engine (replaces DeepSeek)
✅ Batch processing script ready to go
✅ PostgreSQL + pgvector RAG database on Railway
✅ Embedding generation pipeline
✅ Langflow integration guide for RAG + fine-tuning
✅ Complete architecture for knowledge base processing

**Ready to process your 134 documents and build the RAG system!**
