# RouteLLM Chatbot - Roofing Assistant

A specialized AI chatbot for roofing professionals, powered by Abacus.AI's Susan AI-21 model. Designed for field teams to access on mobile devices for damage assessment, insurance claims, and professional communication.

## Features

- 📸 **Photo Analyzer**: Analyze roof damage from photos
- ✉️ **Email Generator**: Create professional emails for insurance claims
- 🏢 **Insurance Finder**: Access insurance company details and processes
- ⛈️ **Weather Data**: Get storm history and damage correlation
- 📱 **Mobile-First Design**: Optimized for field team usage
- 🚀 **Progressive Web App**: Can be installed on phone home screens
- 💬 **Real-time Chat Interface**: Instant AI responses
- 🎨 **Professional UI**: Clean, modern design for roofing teams

## Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1
- **AI Backend**: Abacus.AI (Susan AI-21)
- **Deployment**: Vercel (recommended)

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Abacus.AI credentials to .env.local
# DEPLOYMENT_TOKEN=your_token_here
# ABACUS_DEPLOYMENT_ID=6a1d18f38

# Run development server
npm run dev

# Open http://localhost:4000
```

## Deployment

### Recommended: Vercel (Free)

**Quick Deploy:**
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

**Manual Deploy:**
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed step-by-step instructions.

### Cost-Effective Options:

1. **Vercel** (Recommended) - $0/month
   - Native Next.js support
   - Automatic HTTPS
   - Global CDN
   - Perfect for 5-10 users

2. **Railway** - $5/month
   - Simple deployment
   - Good for teams
   - PostgreSQL included

3. **Netlify** - $0/month
   - Good free tier
   - CDN included

## Project Structure

```
routellm-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # Chat API endpoint
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main chat interface
├── public/                     # Static assets
├── .env.example               # Environment template
├── .env.local                 # Local environment (not committed)
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── vercel.json                # Vercel deployment config
├── deploy.sh                  # Quick deployment script
├── DEPLOYMENT_GUIDE.md        # Detailed deployment instructions
└── README.md                  # This file
```

## Mobile Access

### Add to iPhone Home Screen:
1. Open Safari and navigate to your deployed URL
2. Tap Share button
3. Select "Add to Home Screen"
4. Name it "Roofer AI"

### Add to Android Home Screen:
1. Open Chrome and navigate to your deployed URL
2. Tap menu (three dots)
3. Select "Add to Home Screen"
4. Name it "Roofer AI"

## Environment Variables

Required environment variables:

```bash
DEPLOYMENT_TOKEN=your_abacus_ai_token
ABACUS_DEPLOYMENT_ID=6a1d18f38  # Susan AI-21 deployment
```

## API Endpoints

### POST /api/chat

Chat with the AI assistant.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "How do I assess hail damage?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "AI response here...",
  "model": "Susan AI-21",
  "usage": {...}
}
```

## Development

### Available Scripts:

```bash
# Start development server on port 4000
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Adding New Features:

1. **New Quick Link**: Edit `/app/page.tsx` and add button to quick links section
2. **New API Route**: Create file in `/app/api/`
3. **Styling Changes**: Modify Tailwind classes in components

## Security

- API keys stored securely as environment variables
- Server-side API calls only (client never sees tokens)
- HTTPS enforced on deployment
- No sensitive data stored locally

## Troubleshooting

### Build Fails:
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Environment Variables Not Working:
```bash
# Check .env.local exists and has correct format
cat .env.local

# Restart dev server
npm run dev
```

### API Errors:
- Verify Abacus.AI token is valid
- Check deployment ID is correct
- Review server logs in Vercel dashboard

## Support

For deployment issues, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

For feature requests or bugs, contact your development team.

## License

Proprietary - Internal use only

---

**Built for roofing professionals, optimized for field team usage.**
