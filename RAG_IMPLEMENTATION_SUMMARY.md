# RAG Implementation Summary - Quick Reference

## Executive Summary

**Replace:** 123 hardcoded documents (1865 lines) in `insurance-argumentation-kb.ts`
**With:** Dynamic RAG system processing 151 source documents
**Result:** 95%+ accuracy, <$1/month cost, <500ms response time

---

## Architecture at a Glance

```
Documents (151) → Parser → Chunker → Embeddings → PostgreSQL + pgvector
                                                            ↓
User Query → Cache? → OpenAI Embed → Hybrid Search → Re-rank → LLM → Response
```

---

## Technology Stack (No New Dependencies!)

**Already Installed:**
- `pdf-parse` - PDF parsing
- `mammoth` - DOCX parsing
- `tesseract.js` - OCR fallback
- `@vercel/postgres` - Database with pgvector
- `pg` - PostgreSQL client

**External APIs:**
- OpenAI (embeddings): $0.0001 per 1K tokens
- DeepSeek OCR (via Ollama Cloud): FREE

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Document parser (`lib/document-parser.ts`)
- [ ] Chunking strategy (`lib/chunking-strategy.ts`)
- [ ] Metadata enrichment (`lib/metadata-enrichment.ts`)
- [ ] Embedding generation (`scripts/generate-embeddings-v2.js`)

**Deliverable:** Processed documents with embeddings in JSON

### Phase 2: Vector Database (Week 2-3)
- [ ] PostgreSQL schema (`lib/db-schema-rag.sql`)
- [ ] Database service (`lib/rag-database.ts`)
- [ ] Data migration (`scripts/migrate-to-pgvector.js`)

**Deliverable:** Indexed vectors in PostgreSQL

### Phase 3: Enhanced Retrieval (Week 3-4)
- [ ] RAG service v2 (`lib/rag-service-v2.ts`)
- [ ] Hybrid search (vector + keyword)
- [ ] Re-ranking algorithm
- [ ] Performance optimization

**Deliverable:** <500ms query response time

### Phase 4: Integration (Week 4-5)
- [ ] Chat API integration (`app/api/chat/route.ts`)
- [ ] Feature flag (RAG_ENABLED)
- [ ] Fallback to hardcoded KB
- [ ] A/B testing

**Deliverable:** Production RAG in live system

### Phase 5: Monitoring (Week 5-6)
- [ ] Analytics dashboard
- [ ] User feedback loop
- [ ] Auto-update pipeline
- [ ] Documentation

**Deliverable:** Production-ready with monitoring

---

## Cost Breakdown

```
Initial Setup:
- Embedding generation: $0.06 (one-time)

Monthly Costs:
- Query embeddings: $0.002
- Document updates: $0.002
- PostgreSQL: $0.00 (FREE on Vercel)
- Storage: $0.00 (FREE)
─────────────────────────────
TOTAL: <$1/month

Savings vs. alternatives:
- Pinecone: $70/month → 98% cheaper
- Weaviate: $50/month → 98% cheaper
- Current system: ~$5/month → 80% cheaper
```

---

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Query Latency (P95) | <500ms | Caching + HNSW index |
| Embedding Accuracy | >95% | DeepSeek OCR verification |
| Retrieval Precision@5 | >0.85 | Hybrid search + re-ranking |
| Cache Hit Rate | >70% | 15min TTL, 1000 item cache |
| Concurrent Users | 50+ | Connection pooling |
| Uptime | 99.9% | Multi-tier fallbacks |

---

## Deployment Strategy

### Gradual Rollout
1. **Shadow Mode (Week 4):** Run alongside hardcoded KB, compare results
2. **Canary (Week 5):** 10% → 25% → 50% of users
3. **Full Rollout (Week 6):** 100% with fallback
4. **Cleanup (Week 7):** Remove hardcoded KB

### Rollback Plan
- Feature flag: `RAG_ENABLED=false` (instant rollback)
- Zero downtime: Automatic fallback to hardcoded KB
- Trigger: Latency >1000ms OR Error rate >5%

---

## Key Files to Create

### Phase 1
- `/lib/document-parser.ts` - Parse PDFs, DOCX, images
- `/lib/chunking-strategy.ts` - Intelligent chunking (500-1000 tokens)
- `/lib/metadata-enrichment.ts` - Extract categories, states, keywords
- `/scripts/generate-embeddings-v2.js` - OpenAI embedding generation

### Phase 2
- `/lib/db-schema-rag.sql` - PostgreSQL schema with pgvector
- `/lib/rag-database.ts` - Database service (CRUD + search)
- `/scripts/migrate-to-pgvector.js` - Migration script

### Phase 3
- `/lib/rag-service-v2.ts` - Enhanced RAG service
- `/lib/rag-monitoring.ts` - Monitoring and analytics

### Phase 4
- Modify `/app/api/chat/route.ts` - Integrate RAG context injection

### Phase 5
- `/app/api/rag/analytics/route.ts` - Analytics dashboard
- `/scripts/watch-documents.js` - Auto-update pipeline

---

## Testing Checklist

### Unit Tests
- [ ] Document parsing (PDF, DOCX, OCR)
- [ ] Chunking strategy (boundaries, overlap)
- [ ] Metadata extraction (accuracy >90%)
- [ ] Embedding generation (quality check)
- [ ] Vector search (relevance >0.8)
- [ ] Cache performance (hit rate >70%)

### Integration Tests
- [ ] End-to-end document processing
- [ ] RAG-powered chat response
- [ ] Fallback mechanisms
- [ ] Database migrations

### Performance Tests
- [ ] Cold start query (<200ms)
- [ ] Cached query (<10ms)
- [ ] Concurrent load (50 users, <500ms P95)
- [ ] Database query optimization (<50ms)

### Quality Tests
- [ ] Accuracy on 100 golden queries (>90%)
- [ ] Relevance scoring (top-1 >0.85)
- [ ] A/B test: RAG vs. hardcoded KB

---

## Environment Variables

```bash
# Add to .env
RAG_ENABLED=true
RAG_TOP_K=5
RAG_MIN_SCORE=0.7
RAG_HYBRID_SEARCH=true
RAG_VECTOR_WEIGHT=0.7
RAG_KEYWORD_WEIGHT=0.3
RAG_CACHE_TTL=900000
RAG_CACHE_MAX_SIZE=1000

# OpenAI (required)
OPENAI_API_KEY=sk-...

# Ollama Cloud (optional, for OCR)
OLLAMA_CLOUD_URL=https://cloud.ollama.ai
OLLAMA_CLOUD_MODEL=deepseek-v3.1:671b-cloud

# PostgreSQL (already configured)
POSTGRES_URL=postgres://...
```

---

## Quick Start Commands

```bash
# Phase 1: Process documents and generate embeddings
npm run rag:process-documents
npm run rag:generate-embeddings

# Phase 2: Setup database and migrate
npm run rag:setup-db
npm run rag:migrate

# Phase 3: Test retrieval
npm run rag:test-search

# Phase 4: Deploy with feature flag
export RAG_ENABLED=true
npm run build
npm run deploy

# Phase 5: Monitor
npm run rag:analytics
npm run rag:health-check
```

---

## Success Criteria

### Accuracy Improvement
- Current system: 70-75% accuracy (subjective)
- Target: 90-95% accuracy with RAG
- Measurement: User feedback, golden query set

### Performance
- Query latency: <500ms (P95)
- Cache hit rate: >70%
- Error rate: <0.1%
- Uptime: 99.9%

### Cost
- Monthly cost: <$1
- One-time setup: $0.06
- Savings: 80-95% vs. alternatives

### User Satisfaction
- Thumbs up rate: >90%
- Support tickets: -50%
- Response quality: +20-25%

---

## Monitoring Dashboard Metrics

### Real-Time
- Active queries per minute
- Average query latency
- Cache hit rate
- Error rate
- Database connection pool usage

### Daily
- Total queries
- Unique users
- Average relevance score
- Top queries
- Failed queries

### Weekly
- Cost tracking (OpenAI API usage)
- Accuracy trends
- User feedback summary
- Knowledge gap report

### Monthly
- System health report
- Cost analysis
- Performance trends
- Improvement recommendations

---

## Common Issues & Solutions

### Issue: High Latency (>1000ms)
**Cause:** Database slow queries or cold start
**Solution:**
1. Check cache hit rate (target: >70%)
2. Optimize database indexes (HNSW)
3. Scale database connections
4. Review query complexity

### Issue: Low Relevance Scores
**Cause:** Poor query expansion or chunking
**Solution:**
1. Review chunking strategy (boundaries)
2. Enhance query expansion (synonyms)
3. Tune re-ranking weights
4. Add more training examples

### Issue: OpenAI API Errors
**Cause:** Rate limits or API downtime
**Solution:**
1. Automatic fallback to Ollama Cloud
2. Check rate limits (60 RPM for Ada-002)
3. Implement request batching
4. Use exponential backoff

### Issue: Database Connection Pool Exhausted
**Cause:** Too many concurrent queries
**Solution:**
1. Increase max connections (default: 20)
2. Optimize query patterns
3. Implement query queuing
4. Scale database tier

---

## Migration Path from Hardcoded KB

### Week 4: Shadow Mode
- Run RAG alongside hardcoded KB
- Log both results for comparison
- Don't return RAG results to users yet
- Tune parameters based on comparison

### Week 5: Canary Release
- Enable RAG for 10% of users
- Monitor metrics closely
- Rollback if issues detected
- Gradually increase to 50%

### Week 6: Full Rollout
- Enable RAG for 100% of users
- Keep hardcoded KB as fallback
- Monitor for 1 week

### Week 7: Cleanup
- Archive `insurance-argumentation-kb.ts`
- Remove legacy code
- Document lessons learned

---

## Next Steps

1. **Review Architecture:** Read `RAG_ARCHITECTURE_DESIGN.md` in full
2. **Approve Budget:** Confirm <$1/month cost acceptable
3. **Allocate Resources:** 5-6 weeks development time
4. **Start Phase 1:** Begin document processing pipeline
5. **Set Up Monitoring:** Prepare analytics infrastructure

---

**Quick Links:**
- Full Architecture: `/Users/a21/routellm-chatbot/RAG_ARCHITECTURE_DESIGN.md`
- Current KB: `/Users/a21/routellm-chatbot/lib/insurance-argumentation-kb.ts`
- Source Documents: `/Users/a21/Desktop/Sales Rep Resources 2 copy/`
- Existing RAG Service: `/Users/a21/routellm-chatbot/lib/rag-service.ts`

---

**Status:** Ready for Implementation
**Timeline:** 5-6 weeks to production
**Cost:** <$1/month
**Risk:** Low (feature flag + fallbacks)
**ROI:** +20-25% accuracy improvement
