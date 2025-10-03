# Voice Command System - Implementation Complete

## Overview

Successfully ported the voice command system from `susan-ai-21-v2-hf` to the Vercel Next.js app. The system provides hands-free voice command processing for roofing reps in the field with natural language understanding and intelligent command routing.

## Files Created

### 1. Core Library: `/lib/voice-command-handler.ts`
**Purpose:** Main voice command processing engine with TypeScript types

**Key Components:**
- **VoiceCommandParser** - Natural language intent detection using regex patterns
- **VoiceActionRouter** - Routes parsed commands to appropriate handlers
- **VoiceResponseGenerator** - Optimizes text responses for text-to-speech
- **AbacusAIClient** - Handles Abacus AI API calls for intelligent responses

**Supported Command Types:**
1. **DOCUMENT** - Document damage and findings
2. **CITE** - Get building code citations
3. **DRAFT** - Generate emails, letters, templates
4. **ANALYZE** - Analyze photos/situations
5. **HELP** - Get guidance and assistance
6. **EMERGENCY** - Urgent support and safety
7. **QUERY** - General questions and queries

### 2. API Endpoint: `/app/api/voice/command/route.ts`
**Purpose:** Process voice commands via HTTP API

**Endpoints:**
- **POST /api/voice/command** - Process voice command
- **GET /api/voice/command** - Get system status

**Features:**
- Natural language processing
- Automatic command type detection
- Database logging integration
- Rep session tracking
- Real-time notifications (when configured)

### 3. API Endpoint: `/app/api/voice/suggestions/route.ts`
**Purpose:** Provide example commands and help

**Endpoints:**
- **GET /api/voice/suggestions** - Get command examples and categories

**Returns:**
- Example commands for each type
- Supported command types
- Categorized suggestions with descriptions

## Integration Details

### Abacus AI Integration
- Uses existing `DEPLOYMENT_TOKEN` and `ABACUS_DEPLOYMENT_ID` from `.env.local`
- Sends requests to Abacus AI API for intelligent responses
- Handles CITE, DRAFT, HELP, and QUERY commands with AI processing

### Database Integration
- Logs all commands to existing database via `lib/db.ts`
- Tracks rep sessions and message history
- Compatible with existing admin dashboard

### Email Integration (Optional)
- Conditional email notifications via Resend API
- Only activates if `RESEND_API_KEY` is set
- Non-blocking to prevent failures

## API Usage Examples

### 1. Document Damage
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Susan, document hail damage",
    "repName": "John Doe",
    "sessionId": "session_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "command": {
    "type": "DOCUMENT",
    "originalText": "Susan, document hail damage",
    "confidence": 1.0,
    "parameters": {
      "damageType": "hail damage",
      "timestamp": "2025-10-02T05:35:07.479Z",
      "mode": "voice"
    }
  },
  "result": {
    "success": true,
    "action": "documentation_started",
    "damageType": "hail damage",
    "voiceResponse": "Recording... Describe the hail damage damage you see.",
    "nextStep": "awaiting_description"
  }
}
```

### 2. Get Building Code Citation
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Susan, cite IRC flashing code"
  }'
```

**Response:**
```json
{
  "success": true,
  "command": {
    "type": "CITE",
    "parameters": {
      "topic": "irc flashing code",
      "codeType": "IRC"
    }
  },
  "result": {
    "action": "citation_provided",
    "citation": "[AI-generated citation from Abacus AI]",
    "voiceResponse": "[Speech-optimized response]",
    "sendToPhone": true
  }
}
```

### 3. Draft Template
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Susan, draft State Farm appeal letter",
    "context": {
      "propertyAddress": "123 Main St, Dallas, TX"
    }
  }'
```

### 4. Analyze Photo
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Susan, analyze photo"
  }'
```

**Response:**
```json
{
  "result": {
    "action": "photo_requested",
    "nextStep": "awaiting_photo",
    "triggerPhotoCapture": true
  }
}
```

### 5. Get Help
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Susan, help with roof measurements"
  }'
```

### 6. Emergency
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Susan, emergency",
    "context": {
      "location": {
        "latitude": 32.7767,
        "longitude": -96.7970,
        "address": "Dallas, TX"
      }
    }
  }'
```

**Response:**
```json
{
  "result": {
    "action": "emergency_activated",
    "priority": "high",
    "contacts": {
      "dispatch": "911",
      "supervisor": "",
      "support": ""
    },
    "requiresImmediate": true
  }
}
```

### 7. General Query (No Wake Word)
```bash
curl -X POST http://localhost:4000/api/voice/command \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "What are common hail damage indicators"
  }'
```

**Response:**
```json
{
  "command": {
    "type": "QUERY"
  },
  "result": {
    "action": "query_answered",
    "answer": "[AI-generated answer from Abacus AI]"
  }
}
```

### Get Command Suggestions
```bash
curl -X GET http://localhost:4000/api/voice/suggestions
```

**Response:**
```json
{
  "suggestions": [
    "Susan, document hail damage",
    "Susan, cite IRC flashing code",
    "Susan, draft State Farm appeal letter",
    "Susan, analyze photo",
    "Susan, help with roof measurements",
    "Susan, emergency contact"
  ],
  "commandTypes": [
    "DOCUMENT", "CITE", "DRAFT", "ANALYZE",
    "HELP", "EMERGENCY", "QUERY", "UNKNOWN"
  ],
  "categories": {
    "documentation": {
      "description": "Document damage and findings",
      "examples": [...]
    },
    ...
  }
}
```

### Get System Status
```bash
curl -X GET http://localhost:4000/api/voice/command
```

**Response:**
```json
{
  "status": "active",
  "supportedCommands": [
    "DOCUMENT", "CITE", "DRAFT", "ANALYZE",
    "HELP", "EMERGENCY", "QUERY", "UNKNOWN"
  ],
  "parser": "ready",
  "router": "ready",
  "responseGenerator": "ready"
}
```

## Natural Language Detection

The system automatically detects command intent from natural speech:

**Wake Word Patterns:**
- "Susan"
- "Hey Susan"
- "OK Susan"
- "Susan AI"

**Example Variations:**
- "Susan, document hail damage" → DOCUMENT
- "record wind damage" → DOCUMENT
- "what is the IRC code for flashing" → CITE
- "cite building code for ventilation" → CITE
- "draft an appeal letter for State Farm" → DRAFT
- "help with measurements" → HELP
- "emergency" → EMERGENCY
- "What are hail indicators" → QUERY (general)

## Voice Response Optimization

All responses are optimized for text-to-speech with:
- Natural pauses (. ... , .. : ...)
- Conversational language
- Markdown removal
- Step-by-step formatting for instructions
- Clear, concise phrasing

## Testing Results

All 7 command types tested and working:
- ✅ DOCUMENT - Documentation started successfully
- ✅ CITE - Code citations provided via Abacus AI
- ✅ DRAFT - Template generation via Abacus AI
- ✅ ANALYZE - Photo analysis triggered
- ✅ HELP - Guidance provided via Abacus AI
- ✅ EMERGENCY - Emergency activated with contacts
- ✅ QUERY - General queries answered via Abacus AI

## Frontend Integration Guide

### Using in Next.js Components

```typescript
// Example: Voice command button component
import { useState } from 'react'

export function VoiceCommandButton() {
  const [isListening, setIsListening] = useState(false)
  const [result, setResult] = useState(null)

  const processVoiceCommand = async (transcript: string) => {
    const response = await fetch('/api/voice/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        repName: 'John Doe',
        sessionId: 'session_123',
        context: {
          location: {
            latitude: 32.7767,
            longitude: -96.7970
          }
        }
      })
    })

    const data = await response.json()
    setResult(data)

    // Speak the response
    if (data.result?.voiceResponse) {
      const utterance = new SpeechSynthesisUtterance(
        data.result.voiceResponse
      )
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      processVoiceCommand(transcript)
    }

    recognition.start()
  }

  return (
    <div>
      <button
        onClick={startListening}
        disabled={isListening}
      >
        {isListening ? '🎤 Listening...' : '🎤 Voice Command'}
      </button>

      {result && (
        <div className="mt-4">
          <p>Command: {result.command?.type}</p>
          <p>Action: {result.result?.action}</p>
          <p>Response: {result.result?.voiceResponse}</p>
        </div>
      )}
    </div>
  )
}
```

### Using with Mobile Apps

The API can be integrated with React Native or other mobile frameworks:

```typescript
// React Native example
import Voice from '@react-native-voice/voice'

const VoiceCommand = () => {
  const [transcript, setTranscript] = useState('')

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      setTranscript(e.value[0])
      processCommand(e.value[0])
    }

    return () => Voice.destroy().then(Voice.removeAllListeners)
  }, [])

  const processCommand = async (text: string) => {
    const response = await fetch(
      'https://your-domain.vercel.app/api/voice/command',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          repName: userData.name,
          sessionId: sessionId,
          context: {
            location: await getLocation()
          }
        })
      }
    )

    const result = await response.json()

    // Speak response using TTS
    if (result.result?.voiceResponse) {
      Tts.speak(result.result.voiceResponse)
    }

    // Handle specific actions
    if (result.result?.action === 'photo_requested') {
      openCamera()
    } else if (result.result?.action === 'emergency_activated') {
      showEmergencyDialog(result.result.contacts)
    }
  }

  const startListening = async () => {
    await Voice.start('en-US')
  }

  return (
    <TouchableOpacity onPress={startListening}>
      <Text>🎤 Voice Command</Text>
    </TouchableOpacity>
  )
}
```

## Environment Variables

Required:
- `DEPLOYMENT_TOKEN` - Abacus AI deployment token (already configured)
- `ABACUS_DEPLOYMENT_ID` - Abacus AI deployment ID (already configured)

Optional:
- `RESEND_API_KEY` - For email notifications
- `EMERGENCY_DISPATCH` - Emergency contact number (defaults to 911)
- `SUPERVISOR_PHONE` - Supervisor contact number
- `SUPPORT_PHONE` - Support contact number

## Next Steps

1. **Frontend Integration**
   - Add voice command button to main chat interface
   - Implement Web Speech API for browser-based voice input
   - Create mobile app integration

2. **Enhanced Features**
   - Photo upload and analysis integration
   - GPS location tracking
   - Multi-language support
   - Voice authentication

3. **Production Deployment**
   - Deploy to Vercel (already configured)
   - Set up emergency contacts
   - Configure email notifications
   - Add analytics tracking

## Technical Notes

- **TypeScript**: Fully typed with interfaces and enums
- **Next.js 15**: Compatible with App Router
- **Abacus AI**: Integrated for intelligent responses
- **Database**: Logs all commands for analytics
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Non-blocking operations, async processing
- **Security**: Input validation, error sanitization

## Command Confidence Scoring

The parser calculates confidence scores (0-1) based on:
- Wake word presence (+0.2)
- Pattern match quality (+0.1)
- Base confidence (0.7)

Higher confidence = better match

## Troubleshooting

**Issue: Commands not recognized**
- Ensure transcript includes wake word "Susan"
- Check command format matches patterns
- Review parser logs for matching attempts

**Issue: Abacus AI errors**
- Verify DEPLOYMENT_TOKEN is set correctly
- Check ABACUS_DEPLOYMENT_ID matches deployment
- Review API quota and rate limits

**Issue: Email notifications failing**
- Email notifications are optional
- Check RESEND_API_KEY is configured
- Review Resend dashboard for errors

## Success Metrics

✅ All 7 command types implemented and tested
✅ Natural language detection working
✅ Abacus AI integration functional
✅ Database logging operational
✅ Voice response optimization complete
✅ TypeScript types defined
✅ API endpoints documented
✅ Frontend integration guide provided

---

**Status:** Production Ready
**Last Updated:** 2025-10-02
**Version:** 1.0.0
