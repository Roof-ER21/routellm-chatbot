# Susan AI-21 Insurance Claims Assistant

Intelligent roofing insurance claims assistant powered by Abacus.AI.

## Features

- 💬 **AI Chat Assistant** - Roofing insurance expertise via Abacus.AI
- 📄 **Document Analysis** - PDF, Word, Excel analysis with native text extraction
- 📧 **Email Generator** - Smart email composition for claims
- 🏢 **Insurance Company Database** - Comprehensive company information
- 🌤️ **Weather Verification** - NOAA storm data validation
- 📸 **Photo Analysis** - Damage assessment from images
- 🎙️ **Voice Commands** - Hands-free operation
- 📋 **Templates** - Pre-built response templates

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Abacus.AI account ([sign up here](https://api.abacus.ai))
- Hugging Face API key (optional, for vision features)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open http://localhost:4000
```

### Environment Variables

```env
DEPLOYMENT_TOKEN=your_abacus_deployment_token
ABACUS_DEPLOYMENT_ID=6a1d18f38
HUGGINGFACE_API_KEY=your_hf_api_key
```

## Deployment

### Railway (Recommended)

Railway supports native PDF processing libraries:

```bash
# Install Railway CLI
npm install -g railway

# Login and deploy
railway login
railway link
railway up
```

Environment variables are automatically synced from your `.env.local`.

### Vercel (Limited PDF Support)

Note: PDF extraction may not work in Vercel's serverless environment.

```bash
vercel --prod
```

## Project Structure

```
/app
  /api              - API routes
    /chat           - Main chat endpoint
    /analyze        - Document analysis
    /email          - Email generation
    /weather        - NOAA weather data
    /vision         - Image analysis
  /components       - React components

/lib
  document-processor.ts      - PDF/Word/Excel processing
  client-pdf-extractor.ts    - Browser-based PDF extraction
  document-intelligence.ts   - AI document analysis
  noaa-weather-api.ts       - Weather verification
  vision-service.ts          - Image analysis

/db
  schema.sql                 - Database schema
  insurance_companies.sql    - Insurance company data
```

## Key Features Explained

### Document Analysis
- **Server-side**: Uses `pdf-parse` for PDFs (requires Railway/Docker)
- **Client-side**: Fallback browser-based extraction using PDF.js
- **Supported formats**: PDF, DOCX, XLSX, images

### Weather Verification
- Integrates with NOAA API for storm data
- Validates claim dates against historical weather events
- Location-based storm verification

### Insurance Companies
- Pre-loaded database of major insurers
- Contact information, claim processes
- Company-specific requirements

## Tech Stack

- **Framework**: Next.js 15.5.4
- **AI**: Abacus.AI
- **Database**: PostgreSQL (@vercel/postgres)
- **PDF Processing**: pdf-parse, pdfjs-dist, pdf-lib
- **Document Processing**: mammoth, xlsx
- **Image Processing**: sharp
- **Email**: Resend
- **Styling**: Tailwind CSS 4

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## License

ISC

## Support

For issues or questions, check the docs_archive folder for detailed guides.
