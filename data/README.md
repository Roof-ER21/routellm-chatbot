# RAG Embeddings Directory

## Overview

This directory contains the pre-generated embeddings for the Susan AI-21 knowledge base, used by the RAG (Retrieval-Augmented Generation) system.

## Files

### `susan_ai_embeddings.json`

**Structure:**
```json
{
  "metadata": {
    "generated_at": "2025-10-23T23:00:00Z",
    "source_file": "training_data/susan_ai_knowledge_base.json",
    "embedding_model": "text-embedding-ada-002",
    "total_chunks": 350,
    "chunk_size": 800,
    "chunk_overlap": 200,
    "embedding_dimension": 1536,
    "generation_time_ms": 195000
  },
  "chunks": [
    {
      "id": "chunk_1",
      "text": "Building code content...",
      "embedding": [0.123, -0.456, ...],  // 1536 dimensions
      "metadata": {
        "domain": "building_codes",
        "section": "maryland",
        "source": "Building Code Requirements",
        "state": "maryland",
        "code": "R908.3"
      }
    }
  ]
}
```

**File Size:** ~5-10 MB (depending on knowledge base size)

**Purpose:**
- Semantic search for relevant knowledge base content
- Context injection into AI prompts
- Source citation in responses

## Generation

### Requirements

- OPENAI_API_KEY environment variable
- Susan AI knowledge base at `training_data/susan_ai_knowledge_base.json`
- Node.js 18+

### Generate Embeddings

```bash
# From project root
npm run rag:build
```

**Process:**
1. Loads knowledge base JSON
2. Extracts Q&A, building codes, templates, scripts
3. Chunks text (800 chars, 200 overlap)
4. Generates OpenAI embeddings in batches
5. Saves to this directory

**Time:** 3-5 minutes (depending on knowledge base size)

**Cost:** $0.10-0.20 (one-time, using OpenAI API)

### Output Example

```
======================================================================
Susan AI Knowledge Base Embedding Generator
======================================================================

[1/5] Loading knowledge base...
✓ Loaded knowledge base: Susan AI-21 Complete Knowledge Base

[2/5] Extracting and chunking content...
✓ Extracted 150+ entries from knowledge base
✓ Created 350 chunks (avg 600 chars/chunk)

[3/5] Generating embeddings...
Model: text-embedding-ada-002
Batch size: 50
Total batches: 7

Processing batch 1/7 (50 chunks)...
✓ Batch 1 complete (16.7% total, ETA: 2m 30s)
...

✓ All embeddings generated in 3m 15s

[4/5] Saving embeddings...
✓ Saved to: data/susan_ai_embeddings.json (5.2 MB)

[5/5] Summary
======================================================================
Total chunks: 350
Embedding dimension: 1536
File size: 5.2 MB
Generation time: 3m 15s

✓ Knowledge base embeddings ready for RAG!
======================================================================
```

## Usage

Embeddings are automatically loaded by the RAG service on server startup:

```typescript
// lib/rag-service.ts
const ragService = getRAGService();

// Automatically loads from data/susan_ai_embeddings.json
// No manual loading required
```

**Startup logs:**
```
[RAGService] Loading embeddings from: /app/data/susan_ai_embeddings.json
[RAGService] ✅ Loaded 350 embeddings in 423ms
[RAGService] Embedding dimension: 1536
```

## Deployment

### Option 1: Commit Embeddings (Recommended)

```bash
# Generate locally
npm run rag:build

# Commit to repository
git add data/susan_ai_embeddings.json
git commit -m "Add RAG embeddings"
git push
```

**Advantages:**
- Faster deployments (no generation time)
- No OpenAI API costs on each deployment
- Consistent embeddings across environments

### Option 2: Generate During Build

Add to build script in `package.json`:

```json
"scripts": {
  "build": "npm run rag:build && next build"
}
```

**Disadvantages:**
- Adds 3-5 minutes to build time
- Incurs OpenAI API costs on each deployment
- Requires OPENAI_API_KEY in build environment

## Updating Embeddings

When the knowledge base changes:

```bash
# 1. Update training_data/susan_ai_knowledge_base.json

# 2. Regenerate embeddings
npm run rag:build

# 3. Restart server to load new embeddings
npm run dev

# 4. Test
curl http://localhost:4000/api/search

# 5. Commit if satisfied
git add data/susan_ai_embeddings.json
git commit -m "Update RAG embeddings"
```

## Verification

### Check if embeddings exist

```bash
ls -lh data/susan_ai_embeddings.json
```

### Validate structure

```bash
node -e "
const data = require('./data/susan_ai_embeddings.json');
console.log('Chunks:', data.chunks.length);
console.log('Dimension:', data.metadata.embedding_dimension);
console.log('Model:', data.metadata.embedding_model);
"
```

### Test RAG service

```bash
# Check status
curl http://localhost:4000/api/search

# Expected response
{
  "success": true,
  "status": {
    "loaded": true,
    "totalChunks": 350,
    "embeddingDimension": 1536,
    "enabled": true
  }
}
```

## Troubleshooting

### Embeddings not loading

**Check file exists:**
```bash
ls data/susan_ai_embeddings.json
```

**Check file is valid JSON:**
```bash
node -pe "JSON.parse(require('fs').readFileSync('data/susan_ai_embeddings.json')).metadata"
```

**Regenerate if corrupted:**
```bash
npm run rag:build
```

### Out of memory during generation

**Reduce batch size** in `scripts/generate-embeddings.js`:

```javascript
const CONFIG = {
  batchSize: 25,  // Reduced from 50
  // ...
};
```

### OpenAI API errors

**Check API key:**
```bash
echo $OPENAI_API_KEY
```

**Test API key:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Rate limit errors:**
- Wait 20 seconds between batches (automatic)
- Reduce batch size if needed

## File Format Specification

### Metadata Object

```typescript
interface EmbeddingMetadata {
  generated_at: string;           // ISO 8601 timestamp
  source_file: string;            // Path to knowledge base
  embedding_model: string;        // OpenAI model name
  total_chunks: number;           // Number of chunks
  chunk_size: number;             // Max characters per chunk
  chunk_overlap: number;          // Overlap between chunks
  embedding_dimension: number;    // Vector dimension (1536)
  generation_time_ms: number;     // Generation time
}
```

### Chunk Object

```typescript
interface EmbeddingChunk {
  id: string;                     // Unique identifier
  text: string;                   // Chunk text content
  embedding: number[];            // 1536-dimensional vector
  metadata: {
    domain?: string;              // Knowledge domain
    section?: string;             // Section identifier
    source?: string;              // Source document
    chunk_index?: number;         // Index within original text
    total_chunks?: number;        // Total chunks from same text
    [key: string]: any;           // Additional metadata
  };
}
```

## Performance

### File I/O

- **Load time:** 200-500ms (5 MB file)
- **Parse time:** 50-100ms (JSON parsing)
- **Total startup:** < 600ms

### Memory Usage

- **File size:** ~5 MB on disk
- **In-memory:** ~6 MB (JSON overhead)
- **Per chunk:** ~17 KB (1536 × 4 bytes + metadata)

### Search Performance

- **Query embedding:** 200-300ms (OpenAI API)
- **Similarity search:** 10-20ms (350 chunks)
- **Total:** < 400ms (< 100ms with cache)

## Best Practices

1. **Version Control:** Commit embeddings with knowledge base updates
2. **Regeneration:** Only when knowledge base changes
3. **Validation:** Test after regeneration
4. **Backup:** Keep previous version before regenerating
5. **Monitoring:** Check startup logs for load confirmation

## Support

For issues with embeddings:

1. Check this README
2. Verify file exists and is valid JSON
3. Review generation logs
4. Test with `/api/search` endpoint
5. Check [RAG_SYSTEM_DOCUMENTATION.md](../RAG_SYSTEM_DOCUMENTATION.md)

## Summary

This directory contains the RAG system's semantic index, enabling:
- ✅ Fast semantic search (< 400ms)
- ✅ Accurate context retrieval
- ✅ Source citations in responses
- ✅ Low-cost operations ($0.0001/query)

**Status:** Embeddings loaded and operational
