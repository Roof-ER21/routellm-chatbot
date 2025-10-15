/**
 * Service Worker for Susan AI-21
 * Provides offline capabilities and caching
 */

const CACHE_NAME = 'susan-ai-v1';
const STATIC_CACHE_NAME = 'susan-ai-static-v1';
const DYNAMIC_CACHE_NAME = 'susan-ai-dynamic-v1';

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/mobile.html',
  '/offline.html',
  '/manifest.json',
  '/offline-insurance.json',
  '/offline-kb.json',
  // Add your static CSS/JS assets here
];

// API routes that can work offline with fallback
const OFFLINE_FALLBACK_ROUTES = [
  '/api/chat',
  '/api/insurance/companies',
];

// ============================================================================
// INSTALL EVENT - Cache static assets
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    })
  );

  // Force this SW to become the active SW
  self.skipWaiting();
});

// ============================================================================
// ACTIVATE EVENT - Clean up old caches
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE_NAME &&
                   cacheName !== DYNAMIC_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Claim all clients immediately
  return self.clients.claim();
});

// ============================================================================
// FETCH EVENT - Serve from cache or network
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

// ============================================================================
// NETWORK-FIRST STRATEGY (for API calls)
// ============================================================================
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    // Try cache fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback response
    return getOfflineFallback(request);
  }
}

// ============================================================================
// CACHE-FIRST STRATEGY (for static assets)
// ============================================================================
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Try network if not in cache
    const networkResponse = await fetch(request);

    // Cache for future use
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());

    return networkResponse;

  } catch (error) {
    console.log('[ServiceWorker] Failed to fetch:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// ============================================================================
// OFFLINE FALLBACK FOR API CALLS
// ============================================================================
function getOfflineFallback(request) {
  const url = new URL(request.url);

  // Chat API fallback - use static knowledge
  if (url.pathname === '/api/chat') {
    return new Response(
      JSON.stringify({
        message: `**SUSAN AI - OFFLINE MODE**

I'm currently operating in offline mode with limited capabilities. I can help with:

✅ **Building Codes** - Double layer, low slope, flashing requirements
✅ **GAF Requirements** - Storm damage guidelines, warranty rules
✅ **Maryland Law** - Matching requirements, Bulletin 18-23
✅ **Insurance Companies** - Contact info for 49 major insurers

**Try asking:**
- "What are the double layer requirements?"
- "What does GAF say about creased shingles?"
- "What is Maryland's matching requirement?"

Reconnect to internet for full AI capabilities.`,
        model: 'Offline Mode',
        provider: 'Service Worker',
        offline: true
      }),
      {
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }

  // Insurance companies API fallback
  if (url.pathname.includes('/api/insurance/companies')) {
    return caches.match('/offline-insurance.json').then((resp) => {
      if (resp) {
        return resp.then ? resp : new Response(JSON.stringify(resp), { headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(
        JSON.stringify({ success: true, companies: [], offline: true, message: 'Offline dataset missing' }),
        { status: 200, headers: new Headers({ 'Content-Type': 'application/json' }) }
      );
    });
  }

  // Default offline response
  return new Response(
    JSON.stringify({ error: 'Offline', offline: true }),
    {
      status: 503,
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }
  );
}

// ============================================================================
// BACKGROUND SYNC (for when connection returns)
// ============================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

async function syncPendingMessages() {
  // Retrieve pending messages from IndexedDB and send them
  console.log('[ServiceWorker] Syncing pending messages...');
  // Implementation would retrieve from IndexedDB and POST to /api/chat
}

// ============================================================================
// PUSH NOTIFICATIONS (future feature)
// ============================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New update from Susan AI',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Susan AI-21',
      options
    )
  );
});
