# Insurance Companies Digital Platforms Research

Research completed for adding app names, client login portals, and guest/public access URLs.

## Major Insurance Companies - Digital Platforms

### State Farm
- **App Name (iOS):** State Farm
- **Client Login:** https://auth.proofing.statefarm.com/login-ui/login
- **Guest Access:** https://www.statefarm.com/customer-care/manage-your-accounts
- **Notes:** Single login for all State Farm products

### Allstate
- **App Name (iOS):** Allstate Mobile
- **Client Login:** https://myaccountrwd.allstate.com/anon/account/login
- **Guest Access:** https://www.allstate.com/help-support/account
- **Notes:** MyAccount portal for all policy management

### USAA
- **App Name (iOS):** USAA Mobile
- **Client Login:** https://www.usaa.com/
- **Guest Access:** N/A (Military members only)
- **Notes:** Biometric login (Touch ID/Face ID) supported

### Progressive
- **App Name (iOS):** Progressive
- **Client Login:** https://www.progressive.com/manage-policy/
- **Guest Access:** https://progressivedirect.homesite.com/
- **Notes:** Home insurance redirects to provider portal

### Nationwide
- **App Name (iOS):** Nationwide Mobile
- **Client Login:** https://login.nationwide.com/access/web/login.htm
- **Guest Access:** https://customer-login.nationwide.com/
- **Notes:** Face & Fingerprint login for Android

### Liberty Mutual
- **App Name (iOS):** Liberty Mutual Mobile
- **Client Login:** https://www.libertymutual.com/log-in
- **Guest Access:** https://www.libertymutual.com/customer-support/manage-your-policy
- **Notes:** Touch/face recognition login

### Farmers Insurance
- **App Name (iOS):** Farmers Mobile App
- **Client Login:** https://eagentsaml.farmersinsurance.com/login.html
- **Guest Access:** https://www.farmers.com/
- **Notes:** Multi-policy management

### Travelers
- **App Name (iOS):** MyTravelers
- **Client Login:** https://signin.travelers.com/
- **Guest Access:** https://www.travelers.com/online-service
- **Notes:** 24/7 claim filing and tracking

### Chubb
- **App Name (iOS):** Chubb Mobile
- **Client Login:** https://www.chubb.com/securePersonal/login
- **Guest Access:** https://prsclientview.chubb.com/ (PRS Client Portal)
- **Notes:** One-time payments available without login

### AAA (CSAA)
- **App Name (iOS):** AAA Mobile
- **Client Login:** https://www.mypolicy.csaa-insurance.aaa.com/
- **Guest Access:** https://account.app.ace.aaa.com/
- **Notes:** MyPolicy platform for CSAA Insurance Group

### Erie Insurance
- **App Name (iOS):** Erie Insurance Mobile
- **Client Login:** https://www.erieinsurance.com/ (create account)
- **Guest Access:** https://www.erieinsurance.com/support-center/online-account
- **Notes:** Paperless options available

### Amica Mutual
- **App Name (iOS):** Amica
- **Client Login:** https://www.amica.com/customers/login
- **Guest Access:** https://www.amica.com/en/customer-service/create-online-account.html
- **Notes:** Biometric security (Touch ID/Face ID), J.D. Power #1 Digital Experience 2025

### American Family Insurance
- **App Name (iOS):** MyAmFam
- **Client Login:** https://www.amfam.com/login
- **Guest Access:** https://myaccount.amfam.com/
- **Notes:** Fingerprint authentication

### Lemonade
- **App Name (iOS):** Lemonade Insurance
- **Client Login:** https://www.lemonade.com/login
- **Guest Access:** https://lemonade.homesite.com/auth/login
- **Notes:** Digital-first, app-required for most operations

### Hippo
- **App Name (iOS):** Hippo Home
- **Client Login:** Through Hippo Home app or portal
- **Guest Access:** https://www.hippo.com/contact-us
- **Notes:** 24/7 claims reporting, app-based management

## Companies Still Needing Research

The following companies from our database need digital platform research:
- ALLCAT
- American National
- Ameriprise
- Armed Forces Insurance
- ASI Claims
- Assurant
- California Casualty
- Encompass
- Farm Bureau (VA)
- Farmers of Salem
- Foremost
- Frederick Mutual
- Grange
- Hanover/Citizens
- HOAIC
- Homesite
- IAT Insurance Group
- Kemper
- Loudoun Mutual
- Mercury
- MetLife
- MSI
- National General
- Penn National
- Pure
- QBE
- SafeCo
- Sagesure
- State Auto
- Stillwater
- SWBC
- The Philadelphia Contributionship
- Universal Property
- Westfield

## Database Schema Requirements

To store this data, we need to add these fields to the `insurance_companies` table:

```sql
ALTER TABLE insurance_companies
ADD COLUMN app_name VARCHAR(100),
ADD COLUMN app_store_url TEXT,
ADD COLUMN client_login_url TEXT,
ADD COLUMN guest_login_url TEXT,
ADD COLUMN portal_notes TEXT;
```

## Next Steps

1. ✅ Research major insurance company digital platforms
2. 🔄 Compile structured data (IN PROGRESS)
3. ⏳ Update database schema with new fields
4. ⏳ Create migration script to populate data
5. ⏳ Redesign Insurance Company Selector UI to include:
   - App download links
   - Quick access to client portal
   - Guest portal access
   - Visual indicators for digital capabilities

## UI/UX Redesign Ideas

**Proposed Features:**
- **App Integration:** Direct links to App Store for mobile download
- **Portal Access Tabs:** Quick toggle between Client Login and Guest Access
- **Visual Indicators:** Icons showing which companies have mobile apps
- **Quick Actions:** One-click access to login portals
- **Search Enhancement:** Filter by digital capabilities (has app, has guest portal, etc.)
- **Card Layout:** Modern card-based design with company logo + digital access buttons
