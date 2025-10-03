# Insurance Companies Database System

## Overview

The Insurance Companies Database System provides a comprehensive, professional solution for managing and accessing insurance company information within Susan AI-21. This system includes 50+ pre-loaded insurance companies with contact details, claim processes, and quick access features.

## Features

### 1. **Professional Popup Selector**
- Beautiful modal interface with search functionality
- Real-time filtering and keyboard navigation
- Click-to-call and click-to-email functionality
- Copy-to-clipboard for all contact details
- Recently used companies (personalized per rep)

### 2. **Comprehensive Database**
- **50+ Insurance Companies** pre-loaded
- Complete contact information (phone, email, instructions)
- Claim handler types (Team vs. Adjuster)
- Phone system navigation instructions
- Usage tracking and analytics

### 3. **Smart Integration**
- Quick access button in chat interface
- Selected company display with one-click actions
- Auto-tracking of company usage
- Rep-specific preferences and history

## Database Schema

### Tables Created

#### 1. `insurance_companies`
Primary table storing all insurance company data:

```sql
- id (Primary Key)
- name (Unique)
- claim_handler_type ('Team' or 'Adjuster')
- phone
- phone_instructions (e.g., "dial 1,1,1,1,2,2")
- email
- additional_phone
- additional_email
- website
- status ('active' or 'inactive')
- notes
- usage_count (tracking popularity)
- created_at
- updated_at
```

#### 2. `user_insurance_preferences`
Tracks which companies each rep uses most:

```sql
- id (Primary Key)
- rep_id (Foreign Key to reps)
- company_id (Foreign Key to insurance_companies)
- last_used
- use_count
```

#### 3. `claim_insurance_associations`
Links claims to insurance companies:

```sql
- id (Primary Key)
- session_id (Foreign Key to chat_sessions)
- company_id (Foreign Key to insurance_companies)
- claim_number
- adjuster_name
- adjuster_phone
- adjuster_email
- notes
- created_at
- updated_at
```

## API Endpoints

### Company Management

#### GET `/api/insurance/companies`
List all companies with optional filtering:

**Query Parameters:**
- `q` - Search query (name or email)
- `status` - Filter by status (default: 'active')
- `limit` - Max results (default: 100)
- `sort` - Sort by 'name', 'usage', or 'recent'

**Response:**
```json
{
  "companies": [
    {
      "id": 1,
      "name": "State Farm",
      "claim_handler_type": "Team",
      "phone": "(844) 458-4300",
      "email": "statefarmfireclaims@statefarm.com",
      "notes": null,
      "usage_count": 15
    }
  ],
  "total": 50
}
```

#### GET `/api/insurance/companies/[id]`
Get specific company details:

**Response:**
```json
{
  "company": {
    "id": 1,
    "name": "State Farm",
    "claim_handler_type": "Team",
    "phone": "(844) 458-4300",
    "phone_instructions": null,
    "email": "statefarmfireclaims@statefarm.com",
    ...
  }
}
```

#### POST `/api/insurance/companies`
Create new company (admin only):

**Request Body:**
```json
{
  "name": "New Insurance Co",
  "claim_handler_type": "Team",
  "phone": "(800) 555-1234",
  "email": "claims@newinsurance.com"
}
```

#### PUT `/api/insurance/companies`
Update company (admin only):

**Request Body:**
```json
{
  "id": 1,
  "name": "Updated Name",
  "phone": "(800) 555-9999"
}
```

### Usage Tracking

#### POST `/api/insurance/track`
Track company usage:

**Request Body:**
```json
{
  "companyId": 1,
  "repId": 123
}
```

#### GET `/api/insurance/track?repId=123`
Get rep's most used companies:

**Response:**
```json
{
  "companies": [
    {
      "id": 1,
      "name": "State Farm",
      "use_count": 15,
      "last_used": "2025-10-02T12:00:00Z",
      ...
    }
  ]
}
```

## UI Components

### InsuranceCompanySelector

Located at: `/app/components/InsuranceCompanySelector.tsx`

**Props:**
```typescript
interface InsuranceCompanySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (company: InsuranceCompany) => void
  repId?: number
}
```

**Features:**
- ✅ Real-time search
- ✅ Keyboard navigation (↑↓ arrows, Enter, Esc)
- ✅ Click-to-call phone numbers
- ✅ Click-to-email addresses
- ✅ Copy-to-clipboard buttons
- ✅ Recently used companies section
- ✅ Company type badges (Team/Adjuster)
- ✅ Phone instructions display
- ✅ Responsive design
- ✅ Loading states

### Integration in Chat Page

The selector is integrated into `/app/page.tsx`:

1. **Quick Access Button** - Green building icon (🏢) in quick links
2. **Input Bar Button** - Persistent access next to message input
3. **Selected Company Display** - Shows selected company with quick actions
4. **Auto-tracking** - Automatically tracks usage when company selected

## Pre-loaded Insurance Companies

The system includes 50+ major insurance companies:

### Major Carriers
- **AAA** - (800) 922-8228, myclaims@csaa.com
- **Allstate** - (800) 255-7828, claimscenter@allstate.com
- **Farmers** - (800) 435-7764, claimsreport@farmersinsurance.com
- **Geico** - (800) 841-3000, homeownersclaims@geico.com
- **Liberty Mutual** - (800) 362-0000, claims@libertymutual.com
- **Nationwide** - (800) 421-3535, claims@nationwide.com
- **Progressive** - (800) 776-4737, homeclaims@progressive.com
- **State Farm** - (844) 458-4300, statefarmfireclaims@statefarm.com
- **Travelers** - (800) 252-4633, claimhelp@travelers.com
- **USAA** - (800) 531-8722, propertyclaims@usaa.com (dial 1,1,1,1,2,2)

### Regional Carriers
- American Family, American Modern, Amica, Auto Owners, Chubb, Cincinnati, Erie, Hartford, Safeco, and many more...

(See `/db/seed_insurance_companies.sql` for complete list)

## Setup Instructions

### 1. Database Setup

Run the setup script to create tables and seed data:

```bash
# Make sure you're in the project root
cd /Users/a21/routellm-chatbot

# Run the setup script
node scripts/setup-insurance-db.js
```

Expected output:
```
🏢 Setting up Insurance Companies Database...
📄 Reading schema from: /Users/a21/routellm-chatbot/db/insurance_companies.sql
📄 Reading seed data from: /Users/a21/routellm-chatbot/db/seed_insurance_companies.sql
📊 Creating tables and indexes...
✅ Tables created successfully
🌱 Seeding insurance companies...
✅ Insurance companies seeded successfully
🎉 Database setup complete!
📊 Total insurance companies: 50+
```

### 2. Manual SQL Setup (Alternative)

If you prefer manual setup:

```bash
# Connect to your Vercel Postgres database
psql $POSTGRES_URL

# Run schema
\i db/insurance_companies.sql

# Run seed data
\i db/seed_insurance_companies.sql

# Verify
SELECT COUNT(*) FROM insurance_companies;
```

### 3. Verify Installation

Test the API endpoints:

```bash
# List all companies
curl https://susanai-21.vercel.app/api/insurance/companies

# Search companies
curl https://susanai-21.vercel.app/api/insurance/companies?q=state+farm

# Get specific company
curl https://susanai-21.vercel.app/api/insurance/companies/1
```

## Usage Examples

### For Reps Using the Chat Interface

1. **Quick Access from Quick Links:**
   - Click the "Insurance Companies" 🏢 button
   - Search for the company
   - Click to select

2. **From Input Bar:**
   - Click the green 🏢 button next to the message input
   - Search and select company
   - Company info auto-fills the input

3. **Using Selected Company:**
   - Click phone number to call
   - Click email to compose email
   - View phone instructions for automated systems
   - Remove company by clicking X

### For Developers

#### Adding New Company Programmatically

```javascript
const response = await fetch('/api/insurance/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Insurance Co',
    claim_handler_type: 'Team',
    phone: '(800) 555-1234',
    phone_instructions: 'Press 1 for claims',
    email: 'claims@newinsurance.com'
  })
});
```

#### Tracking Company Usage

```javascript
await fetch('/api/insurance/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyId: 1,
    repId: 123
  })
});
```

#### Getting Rep's Recent Companies

```javascript
const response = await fetch(`/api/insurance/track?repId=${repId}`);
const { companies } = await response.json();
```

## Advanced Features

### 1. Phone Instructions
Special handling for complex phone systems:

Example (USAA):
- Phone: (800) 531-8722
- Instructions: "dial 1,1,1,1,2,2"
- Displayed in yellow badge for visibility

### 2. Usage Analytics
Track which companies are used most:
- Global usage count per company
- Per-rep usage tracking
- Recently used companies
- Popular companies (sorted by usage)

### 3. Search Functionality
Intelligent search across:
- Company name (case-insensitive)
- Email address
- Partial matches supported

### 4. Keyboard Navigation
Power user features:
- `↑↓` - Navigate companies
- `Enter` - Select highlighted company
- `Esc` - Close modal
- Auto-focus search on open

## File Structure

```
/Users/a21/routellm-chatbot/
├── db/
│   ├── insurance_companies.sql       # Schema
│   └── seed_insurance_companies.sql  # Seed data
├── app/
│   ├── api/
│   │   └── insurance/
│   │       ├── companies/
│   │       │   ├── route.ts         # List/Create/Update
│   │       │   └── [id]/
│   │       │       └── route.ts     # Get/Delete by ID
│   │       └── track/
│   │           └── route.ts         # Usage tracking
│   ├── components/
│   │   └── InsuranceCompanySelector.tsx
│   └── page.tsx                     # Main chat (integrated)
├── scripts/
│   └── setup-insurance-db.js        # Setup script
└── INSURANCE_COMPANIES_GUIDE.md     # This file
```

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" error:**
   ```bash
   # Run setup script
   node scripts/setup-insurance-db.js
   ```

2. **"Cannot read property 'rows'" error:**
   - Check your POSTGRES_URL environment variable
   - Ensure database connection is working
   - Run `npm install @vercel/postgres`

3. **Modal doesn't appear:**
   - Check browser console for errors
   - Ensure component is imported correctly
   - Verify `isOpen` state is true

4. **Search not working:**
   - Clear browser cache
   - Check API endpoint is responding
   - Verify database has seeded data

### Verification Commands

```bash
# Check if tables exist
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT * FROM insurance_companies LIMIT 5\`.then(r => console.log(r.rows))"

# Count companies
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT COUNT(*) FROM insurance_companies\`.then(r => console.log('Total:', r.rows[0].count))"

# Test API
curl https://susanai-21.vercel.app/api/insurance/companies | jq
```

## Future Enhancements

Potential improvements:

1. **Auto-detection from Documents**
   - Parse uploaded documents for company names
   - Auto-select detected company

2. **Email Template Integration**
   - Pre-fill company email in email generator
   - Include company-specific templates

3. **Claim Association**
   - Link claims to companies automatically
   - Track claim history per company

4. **Admin Panel**
   - Manage companies via UI
   - Bulk import/export
   - Company logo uploads

5. **Analytics Dashboard**
   - Most used companies
   - Response time tracking
   - Rep performance metrics

## Support

For issues or questions:
- Check this guide first
- Review the API documentation above
- Check the database schema
- Test with the verification commands

## License

Part of Susan AI-21 Roofing Assistant
