/**
 * Service Worker for Offline Support
 * Enables Susan AI to work without internet connection
 */

const CACHE_NAME = 'susan-ai-v1';
const OFFLINE_CACHE = 'susan-offline-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/offline-kb.json',
  '/offline-insurance.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests specially
  if (url.pathname.startsWith('/api/chat')) {
    event.respondWith(handleChatRequest(request));
    return;
  }

  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache GET requests (POST/PUT/DELETE cannot be cached)
        if (request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache (only works for GET requests)
        return caches.match(request).then((response) => {
          return response || caches.match('/offline.html');
        });
      })
  );
});

// Handle chat requests with offline knowledge
async function handleChatRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, using offline knowledge');

    // Parse the request body
    const requestClone = request.clone();
    const body = await requestClone.json();
    const userMessage = body.messages[body.messages.length - 1]?.content || '';

    // Try KB from cache first
    let offlineResponse = '';
    try {
      const kbResp = await caches.match('/offline-kb.json');
      if (kbResp) {
        const kb = await kbResp.json();
        offlineResponse = findFromKB(kb, userMessage);
      }
    } catch (e) {
      // ignore and fallback to inline
    }
    if (!offlineResponse) {
      offlineResponse = getOfflineResponse(userMessage);
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        message: offlineResponse,
        model: 'Susan AI - Offline Mode',
        provider: 'Offline',
        offline: true
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Search offline KB entries
function findFromKB(kb, query) {
  if (!kb || !Array.isArray(kb.entries)) return '';
  const q = String(query || '').toLowerCase();
  // simple keyword contains match, first hit wins
  for (const entry of kb.entries) {
    const kws = Array.isArray(entry.keywords) ? entry.keywords : [];
    for (const kw of kws) {
      if (q.includes(String(kw).toLowerCase())) {
        return entry.answer;
      }
    }
  }
  return '';
}

// Offline knowledge base (inline version - duplicated from lib/offline-knowledge.ts)
function getOfflineResponse(query) {
  const lowerQuery = query.toLowerCase();

  // Double layer
  if (lowerQuery.includes('double layer') || lowerQuery.includes('two layer')) {
    return `DOUBLE LAYER REPLACEMENT REQUIREMENTS:

Per IRC Section R908.3 (VA/MD/PA):
"Roof replacement shall include the removal of ALL existing layers of roof coverings down to the roof deck."

IRC Section 1511.3.1.1 - Critical Exception:
Roof recover is PROHIBITED when TWO OR MORE layers already exist. This means:
- Double-layer roofs CANNOT be recovered
- Double-layer roofs CANNOT be repaired by overlay
- The ONLY legal option is FULL REPLACEMENT with complete tear-off

Your Legal Argument:
"Building code explicitly prohibits roof recover on double-layer roofs. Section 1511.3.1.1 states roof recover is not permitted where existing roof has two or more applications. Therefore, partial replacement is not code-compliant and full tear-off is required."`;
  }

  // Low slope
  if (lowerQuery.includes('low slope') || lowerQuery.includes('flat roof') || lowerQuery.includes('2:12')) {
    return `LOW SLOPE / FLAT ROOF REQUIREMENTS:

Virginia Residential Code R905.2.2:
"Asphalt shingles shall be used only on roof slopes of two units vertical in 12 units horizontal (17-percent slope) or greater."

This means:
- Minimum slope: 2:12 (2 inches of rise per 12 inches of run)
- Slopes below 2:12 require different roofing materials (TPO, EPDM, etc.)
- Shingles on low-slope roofs violate building code

Your Legal Argument:
"The existing roof slope is below 2:12 minimum required for asphalt shingles. Per R905.2.2, shingles are prohibited on this slope. The roof must be replaced with appropriate low-slope roofing system."`;
  }

  // Matching
  if (lowerQuery.includes('match') || lowerQuery.includes('discontinued')) {
    return `MARYLAND MATCHING REQUIREMENTS:

Maryland Insurance Administration Bulletin 18-23:
"When replacing roofing materials, the insurer shall replace the damaged roofing materials with materials of like kind and quality."

Maryland Code § 27-303 (Unfair Claim Settlement Practices):
Failing to match materials is an unfair settlement practice with penalties up to $2,500 per violation.

Your Legal Argument:
"Maryland law requires matching 'like kind and quality.' Since the damaged shingles are discontinued and unavailable, the insurer must replace the entire visible roof section to maintain uniformity as required by Bulletin 18-23."`;
  }

  // GAF
  if (lowerQuery.includes('gaf') || lowerQuery.includes('creased') || lowerQuery.includes('warranty')) {
    return `GAF MANUFACTURER REQUIREMENTS:

GAF Storm Damage Guidelines:
"Creased shingles have lost their sealant bond and cannot be repaired. Wind-lifted shingles that have been creased must be replaced."

Key GAF Principles:
1. Creasing = functional damage (not cosmetic)
2. Creased shingles lose wind resistance
3. Repairs void warranty
4. Replacement required for warranty compliance

Your Legal Argument:
"GAF manufacturer guidelines state creased shingles cannot be repaired and must be replaced. Attempting repair would void the warranty and leave the homeowner without manufacturer coverage."`;
  }

  // Storm date
  if (lowerQuery.includes('storm date') || lowerQuery.includes('wrong date') || lowerQuery.includes('noaa')) {
    return `STORM DATE VERIFICATION:

If adjuster claims wrong storm date:

1. Obtain Official Weather Records:
   - NOAA Storm Events Database
   - National Weather Service reports
   - Local meteorological data

2. Document Evidence:
   - Photos with timestamps
   - Neighbor claims from same date
   - Emergency services reports
   - News coverage of storm

3. Legal Response:
   "The storm date of [your date] is verified by NOAA Storm Events Database. Our client has documented evidence including timestamped photos and neighbor claims. The adjuster's assertion of a different date is contradicted by official meteorological records."`;
  }

  // Pushback
  if (lowerQuery.includes('pushback') || lowerQuery.includes('denial') || lowerQuery.includes('dispute')) {
    return `HANDLING PUSHBACK & DENIALS:

When you get pushback from adjusters:

1. DOCUMENT EVERYTHING
2. IDENTIFY THE PUSHBACK TYPE
3. ESCALATION PATH: Teammates → Team Leader → Sales Manager → Arbitration
4. STAY PROFESSIONAL

Key Mindset: Pushback means they're worried about paying - your claim has merit!`;
  }

  // Full approval
  if (lowerQuery.includes('full approval') || lowerQuery.includes('approved')) {
    return `FULL APPROVAL PHONE CALL SCRIPT:

📞 STEP 1: CONGRATULATE & CONFIRM
📝 STEP 2: EXPLAIN PAYMENT STRUCTURE
📅 STEP 3: SCHEDULE IMMEDIATELY
💰 STEP 4: CONTRACT & DEPOSIT
📄 STEP 5: DOCUMENTS NEEDED
✅ STEP 6: SET EXPECTATIONS
🤝 STEP 7: CLOSE & COMMIT

⚠️ FOLLOW UP: If no signature same day, call/text immediately!`;
  }

  // Default offline message
  return `🔌 SUSAN AI - OFFLINE MODE

I'm currently operating offline with limited capabilities. I can help with:

📚 Available Topics:
• Building Codes - Double layer, low slope requirements
• GAF Requirements - Storm damage, warranty rules
• Maryland Law - Matching requirements
• Claim Strategy - Pushback, denials
• Storm Documentation - Date verification
• Closing Scripts - Full approval

💡 Try asking:
• "What are the double layer requirements?"
• "What does GAF say about creased shingles?"
• "What is Maryland's matching requirement?"
• "How do I handle pushback?"

🌐 For full AI capabilities, reconnect to internet.`;
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
