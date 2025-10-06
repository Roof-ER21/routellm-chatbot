/**
 * iOS-specific utility functions for The Roof Docs
 * Includes haptic feedback, PWA detection, and mobile optimizations
 */

/**
 * Trigger haptic feedback on iOS devices
 * Uses the Vibration API with specific patterns for different feedback types
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
  // Check if device supports vibration
  if (!('vibrate' in navigator)) {
    return;
  }

  // Haptic patterns (in milliseconds)
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30]
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch (error) {
    console.warn('Haptic feedback not supported:', error);
  }
};

/**
 * Add haptic visual feedback to an element
 */
export const addHapticVisual = (element: HTMLElement) => {
  element.classList.add('haptic-active');
  setTimeout(() => {
    element.classList.remove('haptic-active');
  }, 400);
};

/**
 * Detect if running as iOS PWA (added to home screen)
 */
export const isIOSPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone);

  return isIOS && isStandalone;
};

/**
 * Detect if device is iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Detect if device is iPad
 */
export const isIPad = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isIPadUA = /ipad/.test(userAgent);
  const isMacLikeUA = /macintosh/.test(userAgent) && 'ontouchend' in document;

  return isIPadUA || isMacLikeUA;
};

/**
 * Get safe area insets for notch/home indicator
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
  };
};

/**
 * Fix iOS 100vh viewport height issue
 */
export const fixIOSViewportHeight = () => {
  if (typeof window === 'undefined') return;

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  return () => {
    window.removeEventListener('resize', setVH);
    window.removeEventListener('orientationchange', setVH);
  };
};

/**
 * Prevent iOS zoom on input focus
 */
export const preventIOSZoom = () => {
  if (typeof document === 'undefined') return;

  const viewport = document.querySelector('meta[name=viewport]');

  if (viewport) {
    const content = viewport.getAttribute('content');

    // Add user-scalable=no to prevent zoom
    if (content && !content.includes('user-scalable=no')) {
      viewport.setAttribute('content', content + ', user-scalable=no');
    }
  }
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Smooth scroll to element with iOS optimization
 */
export const smoothScrollTo = (element: HTMLElement | null, offset: number = 0) => {
  if (!element) return;

  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
};

/**
 * Request iOS notification permission
 */
export const requestIOSNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Show iOS-style notification
 */
export const showIOSNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/apple-touch-icon.png',
      badge: '/icon-192.png',
      ...options
    });
  }
};

/**
 * Copy text to clipboard with iOS support
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older iOS versions
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const success = document.execCommand('copy');
      textArea.remove();

      return success;
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Share content using iOS native share sheet
 */
export const shareContent = async (data: ShareData): Promise<boolean> => {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    console.warn('Share failed:', error);
    return false;
  }
};

/**
 * Download file with iOS support
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // iOS requires the link to be in the DOM
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Detect iOS version
 */
export const getIOSVersion = (): number | null => {
  if (typeof window === 'undefined') return null;

  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Check if iOS version supports a feature
 */
export const iosSupportsFeature = (minVersion: number): boolean => {
  const version = getIOSVersion();
  return version !== null && version >= minVersion;
};

/**
 * Add to home screen prompt for iOS
 */
export const showIOSInstallPrompt = (): string => {
  if (isIOSPWA()) {
    return 'App is already installed';
  }

  if (isIOS()) {
    return 'To install this app: Tap the Share button, then "Add to Home Screen"';
  }

  return 'Installation not available on this device';
};

/**
 * Performance: Preload critical images
 */
export const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
};

/**
 * Performance: Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          image.src = src;
          image.classList.add('loaded');
          observer.unobserve(image);
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for older browsers
    img.src = src;
  }
};
