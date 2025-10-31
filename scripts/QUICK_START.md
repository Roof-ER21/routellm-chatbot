# Quick Start Guide - Batch Embedding Processing

## 5-Minute Setup

### 1. Set Environment Variables

```bash
export DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"
export OPENAI_API_KEY="sk-..."
```

### 2. Install Dependencies

```bash
pip install openai psycopg2-binary
```

### 3. Run Test Batch (5 documents)

```bash
cd /Users/a21/routellm-chatbot/scripts

python3 batch_embeddings_processor.py \
  --batch-size 5 \
  --reset-state
```

**Expected output:**
```
Processing Batch 1
Documents in batch: 5
Generating embeddings...
Inserted 150 chunks into database
Transaction committed
Progress: 3.8% (5/132 documents)
```

### 4. Verify Test Results

```bash
# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_documents;"
# Expected: 5

psql $DATABASE_URL -c "SELECT COUNT(*) FROM rag_chunks;"
# Expected: ~150-200

# Check progress
./verify_batch_progress.sh
```

### 5. Run Full Processing (All 132 Documents)

```bash
python3 batch_embeddings_processor.py \
  --batch-size 15 \
  --reset-state
```

**This will process 9 batches:**
- Time: 20-40 minutes
- Cost: ~$0.10-0.20
- Chunks: ~4000-6000

### 6. Monitor Progress

```bash
# Terminal 1: Watch logs
tail -f batch_embeddings.log

# Terminal 2: Check progress
watch -n 10 ./verify_batch_progress.sh
```

---

## Common Commands

### Check Progress
```bash
./verify_batch_progress.sh
```

### Resume After Interruption
```bash
python3 batch_embeddings_processor.py --batch-size 15
# Automatically resumes from last completed batch
```

### Process in Stages (for Railway timeouts)
```bash
# Stage 1: First 3 batches
python3 batch_embeddings_processor.py --batch-size 15 --reset-state

# Wait 5 minutes, then resume
python3 batch_embeddings_processor.py --batch-size 15

# Continue until complete
```

### Reset Everything
```bash
./reset_batch_processing.sh
```

### Test Vector Search
```bash
psql $DATABASE_URL < test_vector_search.sql
```

---

## Batch Size Guidelines

| Batch Size | Use Case | Time per Batch | Memory Usage |
|------------|----------|----------------|--------------|
| 5 | Testing | 1-2 min | Low |
| 10 | Railway (strict limits) | 2-3 min | Medium |
| 15 | **Recommended** | 3-5 min | Medium |
| 20 | Powerful server | 4-6 min | High |

---

## Troubleshooting Quick Fixes

### Problem: "Database connection failed"
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check SSL mode
export DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

### Problem: "Rate limit exceeded"
```bash
# Use smaller batches
python3 batch_embeddings_processor.py --batch-size 10
```

### Problem: "Out of memory"
```bash
# Use smaller batches
python3 batch_embeddings_processor.py --batch-size 5
```

### Problem: Script crashed mid-batch
```bash
# Just re-run - it will resume automatically
python3 batch_embeddings_processor.py --batch-size 15
```

---

## File Locations

| File | Location |
|------|----------|
| Batch processor | `/Users/a21/routellm-chatbot/scripts/batch_embeddings_processor.py` |
| Progress state | `/Users/a21/routellm-chatbot/scripts/.batch_progress.json` |
| Logs | `/Users/a21/routellm-chatbot/scripts/batch_embeddings.log` |
| Documents | `/Users/a21/routellm-chatbot/data/processed-kb/documents-ready/` |
| Full guide | `/Users/a21/routellm-chatbot/scripts/BATCH_PROCESSING_GUIDE.md` |

---

## Next Steps After Processing

1. **Verify completion:**
   ```bash
   ./verify_batch_progress.sh
   ```

2. **Test vector search:**
   ```bash
   psql $DATABASE_URL < test_vector_search.sql
   ```

3. **Integrate with RAG system:**
   - Update your app to use `rag_chunks` table
   - Implement vector similarity search
   - Add metadata filtering by category

4. **Monitor costs:**
   ```bash
   cat .batch_progress.json | jq '.total_cost_usd'
   ```

---

## Production Checklist

- [ ] DATABASE_URL set and verified
- [ ] OPENAI_API_KEY set and valid
- [ ] Test batch (5 docs) completed successfully
- [ ] Database schema deployed (rag_documents, rag_chunks)
- [ ] All 132 documents in documents-ready folder
- [ ] Monitoring setup (logs, database queries)

---

## Support

For detailed documentation, see:
- **Full Guide:** `BATCH_PROCESSING_GUIDE.md`
- **Logs:** `batch_embeddings.log`
- **State:** `.batch_progress.json`

Run into issues? Check the logs first:
```bash
tail -50 batch_embeddings.log
```
