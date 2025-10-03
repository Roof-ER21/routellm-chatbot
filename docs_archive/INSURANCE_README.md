# 🏢 Insurance Companies Database - Complete System

## Overview

A comprehensive insurance company management system for Susan AI-21, providing instant access to 50+ major insurance carriers with complete contact information, claim processes, and intelligent usage tracking.

## 🚀 Quick Start

### 1. Run Database Setup (One-Time)

```bash
cd /Users/a21/routellm-chatbot
node scripts/setup-insurance-db.js
```

Expected output:
```
🏢 Setting up Insurance Companies Database...
📊 Creating tables and indexes...
✅ Tables created successfully
🌱 Seeding insurance companies...
✅ Insurance companies seeded successfully
🎉 Database setup complete!
📊 Total insurance companies: 50+
```

### 2. Verify Installation

```bash
# Test API endpoint
curl https://susanai-21.vercel.app/api/insurance/companies | jq '.total'
# Should return: 50 or more

# Or check database directly
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT COUNT(*) FROM insurance_companies\`.then(r => console.log('Total:', r.rows[0].count))"
```

### 3. Use in Application

1. Go to https://susanai-21.vercel.app
2. Login with your rep name
3. Click the green 🏢 "Insurance Companies" button
4. Search and select any company
5. Company info auto-fills your input

## 📊 What's Included

### Database Tables

#### 1. `insurance_companies` (Main Data)
- **50+ pre-loaded companies** including:
  - State Farm, Allstate, USAA, Farmers, Geico
  - Liberty Mutual, Nationwide, Progressive, Travelers
  - American Family, Chubb, Hartford, Safeco
  - And 40+ more regional and specialty carriers

**Fields:**
- Company name, phone, email
- Claim handler type (Team/Adjuster)
- Phone instructions (e.g., "dial 1,1,1,1,2,2")
- Additional contacts, website
- Usage tracking, status

#### 2. `user_insurance_preferences` (Rep Tracking)
- Tracks which companies each rep uses
- Last used timestamps
- Usage frequency counts
- Personalized recent companies

#### 3. `claim_insurance_associations` (Claim Linking)
- Associates claims with companies
- Stores adjuster information
- Tracks claim-specific notes

### UI Components

#### InsuranceCompanyModal
**Professional modal with:**
- 🔍 Real-time search
- ⌨️ Keyboard navigation (↑↓, Enter, Esc)
- 📞 Click-to-call phone numbers
- ✉️ Click-to-email addresses
- 📋 Copy-to-clipboard buttons
- 🕒 Recently used companies
- 🏷️ Company type badges
- 📱 Fully responsive

#### Integration Points
1. **Quick Links** - Top navigation quick access
2. **Input Bar** - Persistent button next to message input
3. **Email Generator** - Auto-fill recipient
4. **Chat Context** - Company info in conversations

### API Endpoints

#### GET `/api/insurance/companies`
List all companies with optional filtering

**Query Parameters:**
- `q` or `search` - Search term (name or email)
- `status` - Filter by status (default: 'active')
- `limit` - Max results (default: 100)
- `sort` - Sort by 'name', 'usage', or 'recent'

**Example:**
```bash
curl "https://susanai-21.vercel.app/api/insurance/companies?q=state+farm"
```

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
      "usage_count": 15
    }
  ],
  "total": 1
}
```

#### GET `/api/insurance/companies/[id]`
Get specific company details

#### POST `/api/insurance/companies`
Create new company (admin)

#### PUT `/api/insurance/companies`
Update company (admin)

#### POST `/api/insurance/track`
Track company usage

#### GET `/api/insurance/track?repId=123`
Get rep's recent companies

## 📁 File Structure

```
/Users/a21/routellm-chatbot/
├── db/
│   ├── insurance_companies.sql          # Database schema (3 tables)
│   └── seed_insurance_companies.sql     # 50+ companies data
│
├── app/
│   ├── api/
│   │   └── insurance/
│   │       ├── companies/
│   │       │   ├── route.ts            # List/Create/Update
│   │       │   └── [id]/route.ts       # Get/Delete by ID
│   │       └── track/
│   │           └── route.ts            # Usage tracking
│   │
│   ├── components/
│   │   ├── InsuranceCompanyModal.tsx   # Main modal component
│   │   └── InsuranceCompanySelector.tsx # Wrapper for compatibility
│   │
│   └── page.tsx                         # Chat (integrated)
│
├── lib/
│   └── action-handlers.ts               # API action handlers
│
├── scripts/
│   └── setup-insurance-db.js            # Automated setup
│
└── Documentation/
    ├── INSURANCE_README.md              # This file (overview)
    ├── INSURANCE_SETUP.md               # Quick start guide
    ├── INSURANCE_COMPANIES_GUIDE.md     # Complete documentation
    └── INSURANCE_IMPLEMENTATION_SUMMARY.md # Technical summary
```

## 🎯 How to Use

### For Reps (End Users)

#### Method 1: Quick Links
1. Click "Insurance Companies" 🏢 in quick access tools
2. Modal opens with all companies
3. Search or browse
4. Click to select

#### Method 2: Input Bar
1. Click green 🏢 button next to message input
2. Search for company
3. Select and info auto-fills

#### Method 3: During Conversation
1. Ask Susan AI-21 about insurance companies
2. System can suggest or look up companies
3. Select to add to context

### Features in Action

**Search:**
- Type company name: "state farm"
- Or search by email: "statefarm"
- Results appear instantly

**Select:**
- Click company card
- Phone and email appear in input
- Ready to use or modify

**Quick Actions:**
- Click phone to call
- Click email to compose
- Copy buttons for clipboard
- View phone instructions

**Recent Companies:**
- Your 5 most recent shown first
- Quick access buttons
- Personalized to your usage

### For Developers

#### Get Companies
```javascript
const response = await fetch('/api/insurance/companies');
const { companies, total } = await response.json();
```

#### Search Companies
```javascript
const response = await fetch('/api/insurance/companies?q=state+farm');
const { companies } = await response.json();
```

#### Track Usage
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

#### Get Recent Companies
```javascript
const response = await fetch(`/api/insurance/track?repId=${repId}`);
const { companies } = await response.json();
```

#### Use Component
```typescript
import InsuranceCompanySelector from './components/InsuranceCompanySelector';

<InsuranceCompanySelector
  isOpen={showSelector}
  onClose={() => setShowSelector(false)}
  onSelect={(company) => {
    console.log('Selected:', company.name);
    // Do something with company
  }}
  repId={repId}
/>
```

## 📋 Pre-loaded Companies

### Major National Carriers (15)
- AAA (CSAA)
- Allstate
- Farmers
- Geico
- Liberty Mutual
- Nationwide
- Progressive
- State Farm
- Travelers
- USAA
- American Family
- Hartford
- Safeco
- Chubb
- Erie

### Regional & Specialty Carriers (35+)
Including: American Modern, Amica, Auto Owners, Bankers, Berkshire Hathaway, Brotherhood Mutual, Church Mutual, Cincinnati, Citizens, EMC, Encompass, Esurance, Foremost, Grange, Grinnell Mutual, GulfStream, Hanover, Heritage, Homesite, Horace Mann, IMT, Kemper, Mercury, MetLife, and many more...

(See `/db/seed_insurance_companies.sql` for complete list)

## 🔧 Troubleshooting

### Issue: Tables Don't Exist
**Solution:**
```bash
node scripts/setup-insurance-db.js
```

### Issue: No Companies Returned
**Check:**
```bash
# Verify data exists
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT COUNT(*) FROM insurance_companies\`.then(r => console.log('Total:', r.rows[0].count))"

# Should show: Total: 50 (or more)
```

### Issue: API Returns Error
**Debug:**
```bash
# Test endpoint directly
curl https://susanai-21.vercel.app/api/insurance/companies

# Check database connection
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT NOW()\`.then(r => console.log('Connected:', r.rows[0]))"
```

### Issue: Modal Doesn't Open
**Check:**
1. Browser console for errors
2. Component import path
3. `isOpen` prop is true
4. No z-index conflicts

### Issue: Search Not Working
**Fix:**
1. Clear browser cache
2. Check API response
3. Verify search parameter
4. Test with simple term

## 📊 Database Schema

### insurance_companies
```sql
CREATE TABLE insurance_companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  claim_handler_type VARCHAR(50),
  phone VARCHAR(50) NOT NULL,
  phone_instructions TEXT,
  email VARCHAR(255),
  additional_phone VARCHAR(50),
  additional_email VARCHAR(255),
  website VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### user_insurance_preferences
```sql
CREATE TABLE user_insurance_preferences (
  id SERIAL PRIMARY KEY,
  rep_id INTEGER REFERENCES reps(id),
  company_id INTEGER REFERENCES insurance_companies(id),
  last_used TIMESTAMP DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,
  UNIQUE(rep_id, company_id)
);
```

### claim_insurance_associations
```sql
CREATE TABLE claim_insurance_associations (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES chat_sessions(id),
  company_id INTEGER REFERENCES insurance_companies(id),
  claim_number VARCHAR(255),
  adjuster_name VARCHAR(255),
  adjuster_phone VARCHAR(50),
  adjuster_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 UI Features

### Modal Design
- Professional, clean interface
- Matches Susan AI-21 theme
- Smooth animations
- Loading states
- Empty states
- Error handling

### Company Cards
- Bold company name
- Type badge (Team/Adjuster)
- Phone with icon
- Email with icon
- Phone instructions (yellow badge)
- Hover shows copy buttons
- Click to select

### Search & Filter
- Real-time results
- Case-insensitive
- Searches name and email
- Shows result count
- Clears easily

### Keyboard Navigation
- `↑` - Previous company
- `↓` - Next company
- `Enter` - Select highlighted
- `Esc` - Close modal
- Auto-focus on search

## 🚀 Advanced Features

### Auto-Tracking
- Tracks every selection
- Updates global usage count
- Saves per-rep preferences
- Powers "recently used"

### Smart Search
- Matches company name
- Matches email address
- Case-insensitive
- Instant results
- Partial matches

### Phone Instructions
- Special field for automated systems
- Example: USAA "dial 1,1,1,1,2,2"
- Yellow badge for visibility
- Helps navigate phone menus

### Usage Analytics
- Track popular companies
- See rep preferences
- Sort by usage
- Identify trends

## 📈 Future Enhancements

### Planned Features
1. **Auto-Detection**
   - Detect company from uploaded documents
   - Parse claim documents for company info
   - Suggest company based on address

2. **Email Integration**
   - Pre-fill email generator
   - Company-specific templates
   - Auto-CC adjusters

3. **Advanced Analytics**
   - Usage dashboards
   - Response time tracking
   - Rep performance metrics

4. **Admin Panel**
   - Manage companies via UI
   - Bulk import/export
   - Add company logos
   - Update contact info

5. **Mobile Optimization**
   - Quick dial from mobile
   - Swipe gestures
   - Offline access
   - Push notifications

## 📚 Documentation

### Quick Reference
- **INSURANCE_SETUP.md** - 5-minute setup guide
- **INSURANCE_README.md** - This file (overview)

### Detailed Guides
- **INSURANCE_COMPANIES_GUIDE.md** - Complete documentation
- **INSURANCE_IMPLEMENTATION_SUMMARY.md** - Technical details

### Code Documentation
- Inline comments in all files
- TypeScript interfaces documented
- API endpoints documented
- Component props documented

## ✅ Verification Checklist

After setup, verify:

- [ ] Database setup completed successfully
- [ ] API returns 50+ companies
- [ ] Modal opens in chat interface
- [ ] Search filters results correctly
- [ ] Phone/email links work
- [ ] Copy buttons function
- [ ] Recently used section appears
- [ ] Selected company displays
- [ ] Keyboard navigation works
- [ ] Mobile responsive

## 🆘 Support

### Getting Help

1. **Check Documentation**
   - Start with INSURANCE_SETUP.md
   - Review INSURANCE_COMPANIES_GUIDE.md
   - Check API documentation

2. **Test Components**
   - Verify database connection
   - Test API endpoints
   - Check browser console

3. **Debug Issues**
   - Run verification commands
   - Check error messages
   - Review logs

### Common Solutions

- **Database issues** → Re-run setup script
- **API errors** → Check POSTGRES_URL env var
- **UI problems** → Clear cache, check console
- **Search issues** → Verify data in database

## 🎉 Success!

You now have a complete insurance company management system with:

✅ 50+ pre-loaded companies
✅ Professional popup selector
✅ Complete contact information
✅ Usage tracking and analytics
✅ Beautiful, responsive UI
✅ Full API access
✅ Comprehensive documentation

**Start using it in Susan AI-21 now!**

---

**Built for Susan AI-21 Roofing Insurance Assistant**
*Making claims processing easier, one company at a time* 🏢
