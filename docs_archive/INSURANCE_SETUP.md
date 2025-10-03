# Insurance Companies System - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Database Setup

```bash
cd /Users/a21/routellm-chatbot
node scripts/setup-insurance-db.js
```

Expected output:
```
🏢 Setting up Insurance Companies Database...
📄 Reading schema...
📊 Creating tables and indexes...
✅ Tables created successfully
🌱 Seeding insurance companies...
✅ Insurance companies seeded successfully
🎉 Database setup complete!
📊 Total insurance companies: 50+
```

### Step 2: Verify Installation

Test the API:
```bash
curl https://susanai-21.vercel.app/api/insurance/companies | jq '.companies | length'
```

Should return: `50` (or more)

### Step 3: Test in Browser

1. Go to https://susanai-21.vercel.app
2. Login with your rep name
3. Click the green 🏢 button next to the message input
4. Search for "State Farm" or any insurance company
5. Select a company and see it appear in the input field

## ✨ What You Get

### 1. **50+ Pre-loaded Insurance Companies**
   - All major carriers (State Farm, Allstate, USAA, etc.)
   - Complete contact info (phone, email, extensions)
   - Phone system navigation instructions
   - Claim handler types

### 2. **Professional Popup Selector**
   - Real-time search
   - Keyboard navigation (↑↓, Enter, Esc)
   - Click-to-call phone numbers
   - Click-to-email addresses
   - Copy-to-clipboard buttons
   - Recently used companies

### 3. **Smart Integration**
   - Quick access in chat interface
   - Selected company display
   - Auto-tracking of usage
   - Rep-specific preferences

## 📊 Database Tables Created

1. **insurance_companies** - Main company data
2. **user_insurance_preferences** - Rep usage tracking
3. **claim_insurance_associations** - Claim-company links

## 🔌 API Endpoints Available

- `GET /api/insurance/companies` - List all companies
- `GET /api/insurance/companies?q=state+farm` - Search
- `GET /api/insurance/companies/[id]` - Get specific company
- `POST /api/insurance/track` - Track usage
- `GET /api/insurance/track?repId=123` - Get recent companies

## 🎯 How to Use

### For Reps:

1. **Quick Access Button**
   - Click 🏢 in quick links or input bar
   - Search for company
   - Click to select

2. **Selected Company Card**
   - Click phone to call
   - Click email to compose
   - View dialing instructions
   - Remove with X button

3. **Search Features**
   - Type company name
   - Search by email
   - Results update instantly

### For Developers:

#### Get All Companies
```javascript
const res = await fetch('/api/insurance/companies')
const { companies } = await res.json()
```

#### Search Companies
```javascript
const res = await fetch('/api/insurance/companies?q=state+farm')
const { companies } = await res.json()
```

#### Track Usage
```javascript
await fetch('/api/insurance/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ companyId: 1, repId: 123 })
})
```

## 🔧 Troubleshooting

### Issue: "Table doesn't exist"
```bash
# Run setup again
node scripts/setup-insurance-db.js
```

### Issue: "Cannot connect to database"
```bash
# Check environment variables
echo $POSTGRES_URL

# Test connection
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT NOW()\`.then(r => console.log('Connected:', r.rows[0]))"
```

### Issue: "No companies returned"
```bash
# Check data
node -e "const {sql} = require('@vercel/postgres'); sql\`SELECT COUNT(*) FROM insurance_companies\`.then(r => console.log('Total:', r.rows[0].count))"
```

## 📝 File Locations

```
/Users/a21/routellm-chatbot/
├── db/
│   ├── insurance_companies.sql          # Database schema
│   └── seed_insurance_companies.sql     # 50+ companies data
├── app/
│   ├── api/insurance/                   # API routes
│   ├── components/
│   │   └── InsuranceCompanySelector.tsx # Modal component
│   └── page.tsx                         # Chat (integrated)
├── scripts/
│   └── setup-insurance-db.js            # Setup script
└── INSURANCE_COMPANIES_GUIDE.md         # Full documentation
```

## 🎨 UI Features

### Popup Modal
- ✅ Beautiful design matching app theme
- ✅ Real-time search
- ✅ Grid layout for easy browsing
- ✅ Keyboard shortcuts
- ✅ Mobile responsive
- ✅ Loading states
- ✅ Empty states

### Company Cards
- ✅ Company name and type badge
- ✅ Phone with click-to-call
- ✅ Email with click-to-compose
- ✅ Phone instructions (yellow badge)
- ✅ Copy-to-clipboard buttons
- ✅ Hover states and animations

### Selected Company Display
- ✅ Green badge in input area
- ✅ Quick access to phone/email
- ✅ Remove button
- ✅ Compact design

## 🚀 Next Steps

1. **Test the system** - Try searching and selecting companies
2. **Check analytics** - See which companies are used most
3. **Customize** - Add your own companies via API
4. **Integrate** - Use with email generator and claims

## 📚 Full Documentation

See `INSURANCE_COMPANIES_GUIDE.md` for:
- Complete API documentation
- Database schema details
- Advanced features
- Future enhancements
- Troubleshooting guide

## ✅ Verification Checklist

- [ ] Database setup script completed successfully
- [ ] API returns 50+ companies
- [ ] Popup selector opens in chat
- [ ] Search works and filters results
- [ ] Phone/email links work
- [ ] Copy buttons work
- [ ] Recently used section appears
- [ ] Selected company displays correctly

## 🆘 Support

If you encounter issues:
1. Check this guide
2. Review `INSURANCE_COMPANIES_GUIDE.md`
3. Test API endpoints manually
4. Check browser console for errors
5. Verify database connection

---

**You're all set! Start using the Insurance Company Selector in Susan AI-21** 🎉
