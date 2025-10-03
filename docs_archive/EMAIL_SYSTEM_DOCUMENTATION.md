# Email System Documentation - Susan AI-21

## Overview

The email system transforms the "Generate Email" button from a simple text prefill into a **fully functional email sender** that integrates with Resend API, uses professional HTML templates, and logs all sent emails to the database.

## Features Implemented

### 1. **Email Generation & Sending Flow**

The complete workflow is:

1. User clicks **"Generate Email"** button (appears in header when conversation exists)
2. System auto-generates email content using existing templates from `/lib/template-engine.ts`
3. Email composition modal opens with:
   - **To:** Insurance adjuster email (user input)
   - **Subject:** Auto-extracted from template or user-provided
   - **Body:** AI-enhanced content from Abacus AI
   - **Preview:** Side-by-side editing and preview modes
4. User reviews and edits email content
5. User clicks **"Send Email"**
6. Email is sent via Resend API with professional HTML formatting
7. System logs email to database
8. Success confirmation displayed

---

## Technical Implementation

### A. Database Schema

**New Table: `sent_emails`**

```sql
CREATE TABLE IF NOT EXISTS sent_emails (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id),
  rep_name VARCHAR(255) NOT NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  html_body TEXT,
  template_used TEXT,
  attachments JSONB,
  delivery_status TEXT DEFAULT 'sent',
  resend_id TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
)
```

**Location:** `/Users/a21/routellm-chatbot/lib/db.ts`

**Functions Added:**
- `logSentEmail(emailData)` - Log sent emails
- `updateEmailDeliveryStatus(emailId, status)` - Update delivery status
- `getEmailHistory(sessionId?, limit)` - Get email history
- `getEmailById(emailId)` - Get specific email

---

### B. Email Templates with Branding

**New File:** `/Users/a21/routellm-chatbot/lib/email-templates.ts`

**Key Functions:**
- `convertToHTMLEmail(plainText, templateName, recipientName)` - Converts plain text to professional HTML
- `buildEmailHTML(bodyContent, subject, recipientName)` - Builds complete HTML with Roof-ER branding
- `extractRecipientName(emailContent)` - Extracts recipient name from email

**Features:**
- Professional HTML email layout
- Roof-ER branding (logo, colors, signature)
- Responsive design
- Inline CSS for email client compatibility
- Automatic conversion of markdown-style formatting
- Professional signature block with contact information

**Branding Elements:**
- **Header:** Gradient red background (Roof-ER colors: #dc2626 to #991b1b)
- **Logo:** House emoji with Roof-ER text
- **Signature:** Professional closing with company contact info
- **Footer:** Powered by SusanAI-21

---

### C. Email Sending Functions

**Updated File:** `/Users/a21/routellm-chatbot/lib/email.ts`

**New Function:** `sendClaimEmail(options)`

```typescript
export interface SendEmailOptions {
  to: string                    // Recipient email
  subject?: string              // Email subject (auto-generated if not provided)
  body: string                  // Email body content
  templateName?: string         // Template used
  sessionId?: number            // Chat session ID for logging
  repName: string               // Rep name for logging
  attachments?: Array<{         // Optional attachments
    filename: string
    content: Buffer | string
    type?: string
  }>
}
```

**Features:**
- Email validation
- HTML conversion with branding
- Attachment support (up to 10MB)
- Database logging
- Error handling
- Resend API integration

**From Email:** `Roof-ER Claims <noreply@susanai-21.vercel.app>` (configurable via env var)

---

### D. API Endpoints

#### **POST /api/email/send**

Send an insurance claim email.

**Location:** `/Users/a21/routellm-chatbot/app/api/email/send/route.ts`

**Request Body:**
```json
{
  "to": "adjuster@insurance.com",
  "subject": "Appeal of Partial Denial - 123 Main St",
  "body": "Subject: Appeal...\n\nDear Adjuster,\n\n...",
  "templateName": "Partial Denial Appeal",
  "sessionId": 123,
  "repName": "John Smith",
  "attachments": []
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": 456,
  "resendId": "re_abc123",
  "data": { ... }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid email address"
}
```

---

#### **GET /api/email/history**

Get email history for a session or all emails.

**Location:** `/Users/a21/routellm-chatbot/app/api/email/history/route.ts`

**Query Parameters:**
- `sessionId` (optional): Filter by session ID
- `limit` (optional): Max results (default: 50, max: 500)
- `emailId` (optional): Get specific email by ID

**Example Request:**
```
GET /api/email/history?sessionId=123&limit=20
```

**Response:**
```json
{
  "success": true,
  "emails": [
    {
      "id": 456,
      "session_id": 123,
      "rep_name": "John Smith",
      "to_email": "adjuster@insurance.com",
      "from_email": "Roof-ER Claims <noreply@susanai-21.vercel.app>",
      "subject": "Appeal of Partial Denial",
      "body": "...",
      "html_body": "...",
      "template_used": "Partial Denial Appeal",
      "delivery_status": "sent",
      "resend_id": "re_abc123",
      "sent_at": "2025-10-02T12:00:00Z"
    }
  ],
  "count": 1,
  "sessionId": 123,
  "limit": 20
}
```

---

### E. UI Components

#### **EmailModal Component**

**Location:** `/Users/a21/routellm-chatbot/app/components/EmailModal.tsx`

**Features:**
- Full email composition interface
- To/Subject/Body fields
- Preview mode (toggle between edit and preview)
- Real-time validation
- Loading states
- Success/error messaging
- Professional styling matching Roof-ER branding

**Props:**
```typescript
interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (emailData: EmailData) => Promise<void>
  initialData?: Partial<EmailData>
  repName: string
  sessionId?: number
}
```

---

#### **EmailGenerator Component**

**Location:** `/Users/a21/routellm-chatbot/app/components/EmailGenerator.tsx`

**Features:**
- "Generate Email" button
- Integrates with template engine API
- Opens EmailModal with pre-filled content
- Handles template generation errors
- Sends email via API
- Shows loading/error states

**Props:**
```typescript
interface EmailGeneratorProps {
  repName: string
  sessionId?: number
  conversationHistory?: Array<{ role: string; content: string }>
}
```

---

### F. Integration in Main UI

**Updated File:** `/Users/a21/routellm-chatbot/app/page.tsx`

**Changes:**
1. Import `EmailGenerator` component
2. Added EmailGenerator button in header toolbar (appears when conversation exists)
3. Passes conversation history for context-aware email generation

**Button Location:** Header toolbar, next to "New Chat" button

---

## Usage Guide

### For Users:

1. **Start a conversation** with Susan AI-21 about an insurance claim
2. Once you have relevant information in the chat, click **"Generate Email"** in the header
3. System automatically generates professional email content based on conversation
4. **Review and edit** the email in the modal:
   - Enter recipient's email address
   - Modify subject if needed
   - Edit body content
   - Click "Preview" to see formatted version
5. Click **"Send Email"** to deliver the email
6. Wait for confirmation message
7. Email is sent with professional HTML formatting and Roof-ER branding

### For Developers:

**Send Email Programmatically:**

```typescript
import { sendClaimEmail } from '@/lib/email'

const result = await sendClaimEmail({
  to: 'adjuster@insurance.com',
  subject: 'Appeal of Partial Denial',
  body: 'Dear Adjuster,\n\n...',
  templateName: 'Partial Denial Appeal',
  sessionId: 123,
  repName: 'John Smith',
  attachments: []
})

if (result.success) {
  console.log('Email sent:', result.emailId)
} else {
  console.error('Email failed:', result.error)
}
```

**Get Email History:**

```typescript
import { getEmailHistory } from '@/lib/db'

const emails = await getEmailHistory(sessionId, 50)
console.log('Recent emails:', emails)
```

---

## Environment Variables

**Required:**
- `RESEND_API_KEY` - Resend API key (already configured in Vercel)
- `DEPLOYMENT_TOKEN` - Abacus AI deployment token (for template enhancement)

**Optional:**
- `FROM_EMAIL` - Custom from email (default: `Roof-ER Claims <noreply@susanai-21.vercel.app>`)
- `ABACUS_DEPLOYMENT_ID` - Abacus AI deployment ID (default: `6a1d18f38`)

---

## File Structure

```
/Users/a21/routellm-chatbot/
├── lib/
│   ├── db.ts                      # Database functions (updated)
│   ├── email.ts                   # Email sending functions (updated)
│   ├── email-templates.ts         # HTML email templates (NEW)
│   └── template-engine.ts         # Template generation (existing)
├── app/
│   ├── page.tsx                   # Main chat page (updated)
│   ├── components/
│   │   ├── EmailModal.tsx         # Email composition modal (NEW)
│   │   └── EmailGenerator.tsx     # Email generator button (NEW)
│   └── api/
│       └── email/
│           ├── send/
│           │   └── route.ts       # Send email endpoint (NEW)
│           └── history/
│               └── route.ts       # Email history endpoint (NEW)
```

---

## Testing

### Manual Testing:

1. **Test Email Generation:**
   - Start chat session
   - Click "Generate Email"
   - Verify modal opens with generated content

2. **Test Email Sending:**
   - Enter valid email address
   - Add subject and body
   - Click "Send Email"
   - Verify email is received
   - Check database for logged email

3. **Test Email History:**
   - Call `GET /api/email/history`
   - Verify emails are returned

### API Testing:

```bash
# Test email send endpoint
curl -X POST http://localhost:4000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email from Susan AI-21",
    "repName": "Test User",
    "sessionId": 1
  }'

# Test email history endpoint
curl http://localhost:4000/api/email/history?sessionId=1&limit=10
```

---

## Database Migration

The database schema is automatically created on application startup via `ensureTablesExist()` in `/lib/db.ts`.

**No manual migration needed!** The `sent_emails` table will be created automatically.

---

## Security & Best Practices

### Implemented:
- ✅ Email validation (regex check)
- ✅ Input sanitization
- ✅ Rate limiting (via Resend API limits)
- ✅ Attachment size limits (10MB)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Error handling and logging
- ✅ Environment variable configuration

### Recommendations:
- Set up SPF/DKIM records for custom domain
- Monitor Resend API usage and limits
- Implement user-level rate limiting if needed
- Add email templates approval workflow for compliance

---

## Troubleshooting

### Email Not Sending:

1. **Check Resend API Key:**
   ```bash
   # Verify in Vercel environment variables
   echo $RESEND_API_KEY
   ```

2. **Check Email Validation:**
   - Ensure recipient email is valid format
   - Check for typos

3. **Check API Response:**
   - Look for error messages in browser console
   - Check server logs in Vercel

### Email Logged But Not Received:

1. **Check Spam Folder**
2. **Verify Resend Delivery:**
   - Log into Resend dashboard
   - Check email delivery status

### Database Errors:

1. **Verify Postgres Connection:**
   ```bash
   # Check connection string in Vercel
   ```

2. **Check Table Exists:**
   ```sql
   SELECT * FROM sent_emails LIMIT 1;
   ```

---

## Future Enhancements

Potential improvements:

1. **Attachment Upload:** File picker for adding attachments
2. **Email Templates Library:** Pre-defined templates selector
3. **Draft Saving:** Save email drafts for later
4. **Scheduled Sending:** Schedule emails for future delivery
5. **Email Tracking:** Track opens and clicks
6. **Bulk Email:** Send to multiple recipients
7. **Email Signatures:** Custom signature management
8. **Reply Handling:** Track and manage email replies

---

## Support & Maintenance

**For Issues:**
- Check server logs in Vercel
- Review Resend API dashboard
- Check database logs

**For Updates:**
- Update email templates in `/lib/email-templates.ts`
- Modify branding in `buildEmailHTML()` function
- Update from email in environment variables

---

## Credits

- **Email Service:** Resend API
- **AI Enhancement:** Abacus AI
- **Template Engine:** Custom template system
- **UI Components:** Custom React components
- **Database:** Vercel Postgres

---

**Last Updated:** October 2, 2025
**Version:** 1.0.0
**System:** Susan AI-21 - Roof-ER Roofing Assistant
