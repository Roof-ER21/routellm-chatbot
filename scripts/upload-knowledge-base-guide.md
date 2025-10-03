# Abacus AI Knowledge Base Upload Guide

## Overview
This guide explains how to upload the Susan AI-21 training data to Abacus AI for use in your chatbot/AI agent.

## Prepared Files

### Main Knowledge Base
- **Location**: `/Users/a21/routellm-chatbot/training_data/susan_ai_knowledge_base.json`
- **Size**: ~100KB (optimized JSON format)
- **Format**: Structured JSON optimized for RAG (Retrieval Augmented Generation)
- **Contents**: All 8 training data sections consolidated with semantic chunking

### Source Files (Optional - for reference)
- **Location**: `/Users/a21/susan-ai-21-v2-hf/training_data/`
- **Total Size**: ~400KB across 8 text files
- **Files**:
  1. `complete_qa_database.txt` (14KB) - 1000+ Q&A scenarios
  2. `email_templates_complete.txt` (63KB) - 13 email templates
  3. `sales_scripts_complete.txt` (44KB) - 7 sales scripts
  4. `insurance_arguments_complete.txt` (47KB) - 20+ legal weapons
  5. `customer_resources_complete.txt` (58KB) - 11 products/warranties
  6. `agreements_forms_complete.txt` (74KB) - 11 legal documents
  7. `operations_procedures_complete.txt` (29KB) - 8 operational guides
  8. `images_visual_reference_complete.txt` (53KB) - 24 images analyzed

## Upload Methods

### Method 1: Abacus AI ChatLLM Teams (Recommended)

#### Step 1: Access ChatLLM Teams
1. Log into your Abacus AI account at https://abacus.ai
2. Navigate to **ChatLLM Teams** section
3. Create a new AI Agent or select an existing one

#### Step 2: Upload Documents
1. Click on **"Upload Documents"** or drag-and-drop interface
2. Upload the main knowledge base file:
   - `susan_ai_knowledge_base.json` (primary source)
3. **Optional**: Upload individual source files for more granular access:
   - All `.txt` files from `/Users/a21/susan-ai-21-v2-hf/training_data/`

#### Step 3: Configure Document Settings
- **Access Control**: Ensure only authorized users can access
- **Document Name**: "Susan AI-21 Knowledge Base v1.0"
- **Description**: "Complete insurance claim automation knowledge for Roof-ER sales reps"
- **Tags**: Add tags like:
  - `insurance_claims`
  - `roofing`
  - `sales_training`
  - `building_codes`
  - `virginia`
  - `maryland`
  - `pennsylvania`

#### Step 4: Verify Upload
1. Go to **"View Documents"** section
2. Confirm all files are listed
3. Check file sizes match expected values
4. Test retrieval by asking the AI agent a sample question

### Method 2: Abacus AI API (For Developers)

**Note**: Full API access requires Enterprise plan ($5,000/month). Basic/Pro plans have limited API access.

#### Using Python SDK (if you have API access):

```python
# Install Abacus AI Python SDK
# pip install abacusai

from abacusai import ApiClient

# Initialize client with your API key
client = ApiClient(api_key='your-api-key-here')

# Create a dataset for knowledge base
dataset = client.create_dataset_from_upload(
    name='Susan AI-21 Knowledge Base',
    dataset_type='DOCUMENT_STORE'
)

# Upload the knowledge base file
with open('/Users/a21/routellm-chatbot/training_data/susan_ai_knowledge_base.json', 'rb') as f:
    upload = client.upload_file(dataset.dataset_id, f)

print(f"Dataset created: {dataset.dataset_id}")
print(f"Upload successful: {upload}")
```

#### Using TypeScript/JavaScript (conceptual - API endpoints):

```typescript
// Note: Abacus AI doesn't have official TypeScript SDK
// This is a conceptual example using fetch API

const ABACUS_API_KEY = 'your-api-key-here';
const ABACUS_API_URL = 'https://api.abacus.ai/api/v0';

async function uploadKnowledgeBase() {
  // Step 1: Create dataset
  const datasetResponse = await fetch(`${ABACUS_API_URL}/createDatasetFromUpload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ABACUS_API_KEY}`
    },
    body: JSON.stringify({
      name: 'Susan AI-21 Knowledge Base',
      datasetType: 'DOCUMENT_STORE'
    })
  });

  const dataset = await datasetResponse.json();
  console.log('Dataset created:', dataset.datasetId);

  // Step 2: Upload file
  const formData = new FormData();
  const file = await fetch('file:///Users/a21/routellm-chatbot/training_data/susan_ai_knowledge_base.json');
  const blob = await file.blob();
  formData.append('file', blob, 'susan_ai_knowledge_base.json');

  const uploadResponse = await fetch(`${ABACUS_API_URL}/uploadFile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ABACUS_API_KEY}`
    },
    body: formData
  });

  const upload = await uploadResponse.json();
  console.log('Upload successful:', upload);
}

uploadKnowledgeBase();
```

### Method 3: Manual Upload via Web Interface (Simplest)

1. **Navigate to**: https://abacus.ai
2. **Go to**: ChatLLM or DeepAgent section
3. **Click**: "Upload Documents" or similar button
4. **Drag and drop**: `susan_ai_knowledge_base.json`
5. **Wait**: For processing (Abacus AI will chunk and vectorize automatically)
6. **Test**: Ask a question to verify retrieval works

## File Size Limits (Abacus AI)

- **CSV/Text files**: Up to 50 MB ✅ (Our files are well under)
- **Excel files**: Up to 30 MB
- **Image files**: Up to 50 MB
- **Video files**: Up to 100 MB
- **Maximum pages**: 2000 pages ✅ (We're well under)

Our knowledge base is **~100KB JSON** (main file) or **~400KB total** (all source files), so we're well within limits.

## Optimal Upload Strategy

### Recommended Approach:
**Upload both the consolidated JSON and individual source files**

#### Advantages:
1. **JSON file**: Structured, optimized for RAG with semantic sections
2. **Individual files**: More granular retrieval, easier updates
3. **Redundancy**: If one format works better, you have both

#### Upload Order:
1. Start with `susan_ai_knowledge_base.json` (structured overview)
2. Then upload individual `.txt` files for granular access:
   - `complete_qa_database.txt` (Q&A lookup)
   - `email_templates_complete.txt` (template generation)
   - `insurance_arguments_complete.txt` (legal citations)
   - `sales_scripts_complete.txt` (conversation scripts)
   - `customer_resources_complete.txt` (product info)
   - Others as needed

## Testing the Knowledge Base

After upload, test with these sample queries:

### Test 1: Q&A Retrieval
**Query**: "What should I do if an adjuster says hail damage is cosmetic?"
**Expected**: Should reference Q2 and GAF Storm Damage Guidelines

### Test 2: Template Selection
**Query**: "Customer has discontinued shingles, which template should I use?"
**Expected**: Should recommend iTel Template with variables

### Test 3: Building Code Citation
**Query**: "What is the Virginia building code for double layer roofs?"
**Expected**: Should cite R908.3 with exact text

### Test 4: State-Specific Response
**Query**: "Maryland mismatch requirements for siding"
**Expected**: Should reference MD Bulletin 18-23 and Title 27 Subtitle 3

### Test 5: Sales Script
**Query**: "How do I pitch a homeowner at their door?"
**Expected**: Should provide Initial Pitch Script with 5 non-negotiables

## RAG Optimization Tips

### For Best Results in Abacus AI:

1. **Use Clear Queries**: The more specific the question, the better the retrieval
   - Good: "What's the Virginia code for roof replacement tear-off?"
   - Bad: "Tell me about roofs"

2. **Reference IDs**: When asking about Q&A, use the ID
   - "What does Q201 say about shingle creasing?"

3. **State Detection**: Always mention the state for building codes
   - "Maryland code for housewrap"
   - "Pennsylvania double layer requirement"

4. **Template Matching**: Describe the scenario for template selection
   - "Customer got partial approval, what template?"

5. **Multi-Domain Queries**: Link different knowledge areas
   - "Use Q2, GAF guidelines, and Photo Report template for hail denial"

## Troubleshooting

### Issue: Document not uploading
**Solution**:
- Check file size (must be under 50MB for text/CSV)
- Verify JSON is valid (use jsonlint.com)
- Try uploading individual .txt files instead

### Issue: Poor retrieval quality
**Solution**:
- Break JSON into smaller chunks
- Upload individual domain files separately
- Use more specific queries with keywords from the knowledge base

### Issue: State codes getting mixed up
**Solution**:
- Ensure queries explicitly mention the state
- Consider uploading state-specific subsets separately
- Use tags: #virginia, #maryland, #pennsylvania

### Issue: Template variables not populated
**Solution**:
- JSON structure shows required variables
- Chatbot may need custom prompt engineering
- Consider using structured output format in Abacus AI

## Integration with RouteLL

Once uploaded to Abacus AI, you can integrate with your RouteLL chatbot:

### Option 1: Direct Abacus AI Chatbot
Use Abacus AI's ChatLLM as your primary interface (trained on uploaded docs)

### Option 2: API Integration
Call Abacus AI API from your RouteLL backend to retrieve knowledge

### Option 3: Hybrid Approach
Use RouteLL for routing, Abacus AI for knowledge retrieval via API

## Maintenance & Updates

### Updating Knowledge Base:
1. **Edit source files** in `/Users/a21/susan-ai-21-v2-hf/training_data/`
2. **Regenerate JSON** (or update manually)
3. **Re-upload** to Abacus AI (will replace previous version)
4. **Test retrieval** to ensure updates are reflected

### Version Control:
- Maintain version numbers in JSON metadata
- Keep changelog of updates
- Archive old versions before uploading new ones

### Adding New Content:
- Add new Q&A entries to `complete_qa_database.txt`
- Add new templates to `email_templates_complete.txt`
- Regenerate consolidated JSON
- Upload updated version

## Security Considerations

### Access Control:
- ✅ Abacus AI stores documents with "strict access controls"
- ✅ Only authorized users can view or interact
- ✅ Files are not publicly accessible

### Sensitive Information:
- ✅ No customer PII in training data
- ✅ No financial information included
- ✅ Generic examples used throughout

### Compliance:
- ✅ Insurance claim handling procedures documented
- ✅ State-specific legal requirements included
- ✅ Professional standards maintained

## Cost Considerations

### Abacus AI Pricing Tiers:
- **Basic Plan**: Limited API access, ChatLLM available
- **Pro Plan**: Enhanced features, limited API
- **Enterprise Plan**: $5,000/month - Full API access

### Recommendations:
- Start with **ChatLLM Teams** (web interface upload)
- Upgrade to API access only if automation needed
- Monitor usage to stay within plan limits

## Next Steps

1. ✅ **Upload Prepared Files**: Use Method 1 (ChatLLM Teams web interface)
2. ✅ **Test Retrieval**: Run all 5 test queries
3. ✅ **Configure AI Agent**: Set up prompts and behavior
4. ✅ **Integrate with RouteLL**: Connect to your chatbot system
5. ✅ **Train Team**: Show sales reps how to use the AI assistant

## Support Resources

- **Abacus AI Documentation**: https://abacus.ai/help
- **API Reference**: https://abacus.ai/help/api/ref
- **ChatLLM Guide**: https://abacus.ai/help/howTo/chatllm
- **Document Upload FAQ**: https://abacus.ai/help/howTo/chatllm/faqs/document_uploads

## File Locations Summary

- **Main Knowledge Base**: `/Users/a21/routellm-chatbot/training_data/susan_ai_knowledge_base.json`
- **Source Files**: `/Users/a21/susan-ai-21-v2-hf/training_data/*.txt`
- **This Guide**: `/Users/a21/routellm-chatbot/scripts/upload-knowledge-base-guide.md`
- **Documentation**: `/Users/a21/routellm-chatbot/KNOWLEDGE_BASE_SETUP.md` (to be created)

---

**Ready to upload!** Start with the ChatLLM Teams web interface for the easiest deployment.
