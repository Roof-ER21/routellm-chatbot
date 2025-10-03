# Template Engine - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Start the Server
```bash
cd /Users/a21/routellm-chatbot
npm run dev
```

### 2. Access the UI
Open in browser: **http://localhost:4000/templates**

### 3. Generate Your First Document
- Choose "Auto-Select Template" mode
- Type: "I need to appeal a partial denial for my property at 123 Main St"
- Click "Generate Document"
- Copy or download your professional document!

## 📁 File Locations

| File | Path | Purpose |
|------|------|---------|
| **Core Engine** | `/Users/a21/routellm-chatbot/lib/template-engine.ts` | Main template system |
| **List API** | `/Users/a21/routellm-chatbot/app/api/templates/route.ts` | Get templates |
| **Generate API** | `/Users/a21/routellm-chatbot/app/api/templates/generate/route.ts` | Create documents |
| **UI Component** | `/Users/a21/routellm-chatbot/app/components/TemplateSelector.tsx` | React interface |
| **Demo Page** | `/Users/a21/routellm-chatbot/app/templates/page.tsx` | Full page UI |

## 📋 10 Available Templates

1. **Partial Denial Appeal** - Appeal partial claim denials
2. **Full Denial Appeal** - Appeal complete claim denials
3. **Supplemental Claim Request** - Request additional coverage
4. **Reinspection Request** - Request second inspection
5. **Adjuster Escalation Letter** - Escalate to supervisor
6. **Storm Damage Documentation** - Document storm damage
7. **Code Violation Notice** - Report code violations
8. **Settlement Negotiation** - Negotiate settlement amounts
9. **Manufacturer Warranty Claim** - File warranty claims
10. **Building Inspector Request** - Request inspections

## 🔌 API Examples

### List All Templates
```bash
curl http://localhost:4000/api/templates
```

### Auto-Generate Document
```bash
curl -X POST http://localhost:4000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "appeal partial denial at 123 Main St"}'
```

### Manual Template with Variables
```bash
curl -X POST http://localhost:4000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateKey": "partial_denial_appeal",
    "variables": {
      "property_address": "123 Main St",
      "adjuster_name": "Jane Smith",
      "denial_reason": "Insufficient evidence"
    }
  }'
```

## ⚙️ Configuration

Uses existing Abacus AI credentials from `/Users/a21/routellm-chatbot/.env.local`:
```env
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
```

## 🎯 Key Features

- ✅ **AI Auto-Select**: Automatically picks the right template
- ✅ **Smart Extraction**: Pulls data from your description
- ✅ **Quality Scoring**: Validates documents (0-100 score)
- ✅ **Professional Output**: Ready-to-send documents
- ✅ **Copy/Download**: Easy export options
- ✅ **Fallback Mode**: Works even without AI enhancement

## 📊 Validation Scores

- **85-100**: ✓ Ready to Send (green)
- **70-84**: ⚠ Needs Review (yellow)
- **0-69**: ✗ Needs Revision (red)

## 🔧 Troubleshooting

**Generation takes long?**
- Abacus AI calls take 10-30 seconds
- Be patient, it's generating professional content

**Low quality score?**
- Add more details to your input
- Use manual mode to fill key variables
- Check for missing placeholders

**API errors?**
- Verify .env.local has correct tokens
- Check server is running on port 4000
- Review console for detailed errors

## 📚 Full Documentation

See `/Users/a21/routellm-chatbot/TEMPLATE_SYSTEM_README.md` for complete API docs, architecture, and advanced usage.

---

**Need help?** Check the logs or review the comprehensive README.
