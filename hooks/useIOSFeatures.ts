/**
 * Custom React hooks for iOS-specific features
 * The Roof Docs - Mobile Optimization
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  triggerHaptic,
  addHapticVisual,
  isIOS,
  isIOSPWA,
  isIPad,
  fixIOSViewportHeight,
  getSafeAreaInsets
} from '@/lib/ios-utils';

/**
 * Hook for haptic feedback with visual cue
 */
export const useHapticFeedback = () => {
  const haptic = useCallback((
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium',
    element?: HTMLElement
  ) => {
    triggerHaptic(type);

    if (element) {
      addHapticVisual(element);
    }
  }, []);

  return haptic;
};

/**
 * Hook for detecting iOS device and PWA status
 */
export const useIOSDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isIPad: false,
    isPWA: false,
    isTouch: false
  });

  useEffect(() => {
    setDeviceInfo({
      isIOS: isIOS(),
      isIPad: isIPad(),
      isPWA: isIOSPWA(),
      isTouch: 'ontouchstart' in window
    });
  }, []);

  return deviceInfo;
};

/**
 * Hook for managing safe area insets
 */
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    const updateInsets = () => {
      setInsets(getSafeAreaInsets());
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
};

/**
 * Hook for pull-to-refresh functionality
 */
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) => {
  const { threshold = 80, enabled = true } = options;
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === 0 || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      if (distance > 0) {
        pullDistance.current = distance;
        setIsPulling(true);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance.current > threshold && !isRefreshing) {
        setIsRefreshing(true);
        triggerHaptic('medium');

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setIsPulling(false);
          pullDistance.current = 0;
        }
      } else {
        setIsPulling(false);
        pullDistance.current = 0;
      }

      startY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, onRefresh, isRefreshing]);

  return { isPulling, isRefreshing, pullDistance: pullDistance.current };
};

/**
 * Hook for swipe gestures
 */
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) => {
  const { threshold = 50, enabled = true } = options;
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEnd.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = Math.abs(touchEnd.current.y - touchStart.current.y);

      // Only consider horizontal swipes
      if (Math.abs(deltaX) > threshold && deltaY < 50) {
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      }
    };

    const handleTouchEnd = () => {
      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = Math.abs(touchEnd.current.y - touchStart.current.y);

      if (Math.abs(deltaX) > threshold && deltaY < 50) {
        if (deltaX > 0 && onSwipeRight) {
          triggerHaptic('light');
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          triggerHaptic('light');
          onSwipeLeft();
        }
      }

      setSwipeDirection(null);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  return swipeDirection;
};

/**
 * Hook for fixing iOS viewport height
 */
export const useIOSViewportFix = () => {
  useEffect(() => {
    const cleanup = fixIOSViewportHeight();
    return cleanup;
  }, []);
};

/**
 * Hook for orientation detection
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
};

/**
 * Hook for network status (useful for offline PWA functionality)
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Hook for keyboard visibility (useful for iOS Safari)
 */
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const initialHeight = useRef(0);

  useEffect(() => {
    initialHeight.current = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight.current - currentHeight;

      // If height decreased by more than 150px, keyboard is likely visible
      setIsKeyboardVisible(heightDiff > 150);
    };

    const handleFocusIn = () => {
      setTimeout(() => {
        setIsKeyboardVisible(true);
      }, 300); // Delay for keyboard animation
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isKeyboardVisible;
};

/**
 * Hook for long press gesture
 */
export const useLongPress = (
  callback: () => void,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) => {
  const { threshold = 500, enabled = true } = options;
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!enabled) return;

    timeout.current = setTimeout(() => {
      triggerHaptic('medium');
      callback();
    }, threshold);
  }, [callback, threshold, enabled]);

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear
  };
};
