# Debugging: Why Only 6 Documents Found

## Problem Statement

Previous attempts found only 6 documents instead of the expected 142 (or 132 in documents-ready).

## Possible Root Causes

### 1. Wrong Directory Path

**Symptom:** Script looking in wrong location

**Check:**
```bash
# Verify documents exist
ls -lh /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/ | wc -l
# Should show 132

# Check if script is looking elsewhere
grep "documents_dir" batch_embeddings_processor.py
```

**Fix:**
```python
# In batch_embeddings_processor.py, line 595
parser.add_argument('--documents-dir', type=str,
    default='/Users/a21/routellm-chatbot/data/processed-kb/documents-ready',  # Correct path
    help='Directory containing processed documents')
```

---

### 2. Missing extractedText Field

**Symptom:** Documents loaded but skipped due to missing text

**Check:**
```bash
# Check if documents have extractedText
for file in /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/*.json; do
  echo "$file:"
  cat "$file" | jq 'has("extractedText")'
done | grep -c "true"
# Should show 132

# Check what fields exist
cat "/Users/a21/routellm-chatbot/data/processed-kb/documents-ready/Claim Authorization Form.json" | jq 'keys'
```

**Common Issue:** Documents have status "ready_for_ocr" but no extracted text yet

**Fix:**
- Run OCR/text extraction first
- Or modify script to check multiple fields:
```python
# Line 339 in batch_embeddings_processor.py
text = doc.get('extractedText') or doc.get('content') or doc.get('text') or ''
```

---

### 3. JSON Parsing Errors

**Symptom:** Some JSON files fail to parse, silently skipped

**Check:**
```bash
# Validate all JSON files
for file in /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/*.json; do
  if ! python3 -m json.tool "$file" > /dev/null 2>&1; then
    echo "❌ Invalid JSON: $file"
  fi
done
```

**Fix:** Re-export invalid JSON files or fix parsing errors

---

### 4. File Extension Mismatch

**Symptom:** Files exist but don't end with .json

**Check:**
```bash
# List all files
ls /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/

# Count .json files specifically
ls /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/*.json | wc -l
```

**Fix:** Ensure all files have .json extension

---

### 5. Filtering Logic Too Strict

**Symptom:** Documents loaded but filtered out due to size/content checks

**Check in code:**
```python
# Line 344 in batch_embeddings_processor.py
if not text or len(text.strip()) < 50:
    logger.warning(f"Skipping document {doc['id']} - insufficient text")
    continue
```

**Debug:**
```python
# Add more verbose logging
logger.info(f"Document {doc['id']}: text length = {len(text)}")
```

---

### 6. Old Processed Data vs New Data

**Symptom:** Previously found 6 docs from old location, now using new location

**Check:**
```bash
# Check multiple possible locations
ls -ld /Users/a21/Desktop/routellm-chatbot-railway/data/
ls -ld /Users/a21/routellm-chatbot/data/
ls -ld /Users/a21/routellm-chatbot/data/processed-kb/documents-ready/
```

**Fix:** Use the correct, most recent location

---

## Diagnostic Script

Run this to diagnose the issue:

```bash
#!/bin/bash
# diagnose_documents.sh

echo "🔍 Diagnosing Document Discovery Issue"
echo "======================================="
echo ""

# 1. Check directory exists
DOCS_DIR="/Users/a21/routellm-chatbot/data/processed-kb/documents-ready"

if [ ! -d "$DOCS_DIR" ]; then
    echo "❌ Directory not found: $DOCS_DIR"
    exit 1
fi

echo "✅ Directory exists: $DOCS_DIR"
echo ""

# 2. Count files
TOTAL_FILES=$(ls "$DOCS_DIR" | wc -l)
JSON_FILES=$(ls "$DOCS_DIR"/*.json 2>/dev/null | wc -l)

echo "📊 File Count:"
echo "  Total files: $TOTAL_FILES"
echo "  JSON files: $JSON_FILES"
echo ""

# 3. Check JSON validity
echo "🔍 Validating JSON files..."
INVALID=0
for file in "$DOCS_DIR"/*.json; do
    if ! python3 -m json.tool "$file" > /dev/null 2>&1; then
        echo "  ❌ Invalid: $(basename "$file")"
        INVALID=$((INVALID + 1))
    fi
done

if [ $INVALID -eq 0 ]; then
    echo "  ✅ All JSON files are valid"
else
    echo "  ❌ Found $INVALID invalid JSON files"
fi
echo ""

# 4. Check for extractedText field
echo "🔍 Checking for extractedText field..."
WITH_TEXT=0
WITHOUT_TEXT=0

for file in "$DOCS_DIR"/*.json; do
    HAS_TEXT=$(cat "$file" | jq -r 'has("extractedText")' 2>/dev/null)
    if [ "$HAS_TEXT" == "true" ]; then
        WITH_TEXT=$((WITH_TEXT + 1))
    else
        WITHOUT_TEXT=$((WITHOUT_TEXT + 1))
        echo "  ⚠️  No extractedText: $(basename "$file")"
    fi
done

echo "  ✅ With extractedText: $WITH_TEXT"
echo "  ⚠️  Without extractedText: $WITHOUT_TEXT"
echo ""

# 5. Sample document structure
echo "📄 Sample Document Structure:"
SAMPLE_FILE=$(ls "$DOCS_DIR"/*.json | head -1)
echo "  File: $(basename "$SAMPLE_FILE")"
cat "$SAMPLE_FILE" | jq 'keys' 2>/dev/null
echo ""

# 6. Check text length distribution
echo "📏 Text Length Distribution:"
for file in "$DOCS_DIR"/*.json; do
    TEXT_LEN=$(cat "$file" | jq -r '.extractedText // .content // "" | length' 2>/dev/null)
    echo "  $(basename "$file"): $TEXT_LEN chars"
done | sort -t: -k2 -n | tail -10
echo ""

# Summary
echo "======================================="
echo "Summary:"
echo "  Total JSON files: $JSON_FILES"
echo "  Valid JSON: $((JSON_FILES - INVALID))"
echo "  With extractedText: $WITH_TEXT"
echo "  Ready for processing: $WITH_TEXT"
echo ""

if [ $WITH_TEXT -gt 100 ]; then
    echo "✅ Documents look good! Ready to process."
elif [ $WITH_TEXT -eq 6 ]; then
    echo "⚠️  Only 6 documents have extractedText!"
    echo "   This matches your previous issue."
    echo "   You may need to run OCR/extraction first."
else
    echo "⚠️  Found $WITH_TEXT documents with text."
    echo "   Expected: 132"
fi
```

Save as `/Users/a21/routellm-chatbot/scripts/diagnose_documents.sh` and run:

```bash
chmod +x diagnose_documents.sh
./diagnose_documents.sh
```

---

## Quick Fixes

### Fix 1: Use Different Text Field

If documents use `content` instead of `extractedText`:

```python
# In batch_embeddings_processor.py, line 339
text = doc.get('extractedText') or doc.get('content') or doc.get('text') or ''
```

### Fix 2: Lower Minimum Text Threshold

If documents are small but valid:

```python
# In batch_embeddings_processor.py, line 344
if not text or len(text.strip()) < 10:  # Lower from 50 to 10
    logger.warning(f"Skipping document {doc['id']} - insufficient text")
    continue
```

### Fix 3: Add Debug Logging

```python
# In batch_embeddings_processor.py, line 194 (in load_documents)
logger.info(f"Loaded document {filename}: {len(doc_data.get('extractedText', ''))} chars")
```

Then re-run and check logs:
```bash
python3 batch_embeddings_processor.py --batch-size 5
grep "Loaded document" batch_embeddings.log
```

---

## Recommended Solution

1. **Run the diagnostic script** to identify the exact issue
2. **Check if documents need OCR** - status might be "ready_for_ocr" not "processed"
3. **Verify correct directory** - use absolute path
4. **Modify script** to handle multiple text field names
5. **Test with 5 documents** to verify fix works

```bash
# Full diagnostic workflow
cd /Users/a21/routellm-chatbot/scripts

# 1. Diagnose
./diagnose_documents.sh

# 2. If OCR needed, run text extraction first
# python3 extract_text_from_documents.py  # (if you have this script)

# 3. Estimate costs
python3 estimate_cost.py

# 4. Test batch
python3 batch_embeddings_processor.py --batch-size 5 --reset-state

# 5. Check how many were processed
./verify_batch_progress.sh
```

---

## Expected vs Actual

| Metric | Expected | Actual (Bug) | Fixed |
|--------|----------|--------------|-------|
| Documents in folder | 132 | 132 | 132 |
| Documents with JSON | 132 | 132 | 132 |
| Documents with text | 132 | 6 | 132 |
| Documents processed | 132 | 6 | 132 |

The most likely issue is that only 6 documents have been fully extracted/OCR'd, while the rest have status "ready_for_ocr" but no actual text yet.
