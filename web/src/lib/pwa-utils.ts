// PWA utility functions to handle caching issues

/**
 * Detect if the app is running in PWA standalone mode
 */
export function isPWAMode(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if running in standalone mode (PWA)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Get fetch options with cache busting for PWA
 */
export function getPWAFetchOptions(): RequestInit {
  const timestamp = new Date().getTime()
  return {
    cache: 'no-store' as RequestCache,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Timestamp': timestamp.toString()
    }
  }
}

/**
 * Create a cache-busted URL for PWA
 */
export function getCacheBustedUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  const timestamp = new Date().getTime()
  return `${url}${separator}_t=${timestamp}`
}

/**
 * Force reload sections that might be cached in PWA
 */
export function forceReloadPWAData() {
  if (isPWAMode()) {
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('pwa-force-reload'))
  }
}