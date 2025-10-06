/**
 * Service Worker Registration
 * Call this from your main app to enable offline support
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Service Worker updated, reloading page...');
    window.location.reload();
  });
}

// ============================================================================
// PWA INSTALL PROMPT
// ============================================================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing
  e.preventDefault();

  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Show custom install button
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
  }

  console.log('[PWA] Install prompt available');
});

// Function to show install prompt
window.showPWAInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user's response
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

  // Clear the deferred prompt
  deferredPrompt = null;
};

// ============================================================================
// OFFLINE/ONLINE DETECTION
// ============================================================================

function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  console.log(`[PWA] Connection status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('connectionchange', {
    detail: { online: isOnline }
  }));
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ============================================================================
// APP INSTALL DETECTION
// ============================================================================

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');

  // Hide install button
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }

  // Clear the deferred prompt
  deferredPrompt = null;
});

// Check if app is already installed
window.addEventListener('load', () => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('[PWA] App is running in standalone mode');
  }
});
