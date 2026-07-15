import { useState, useCallback } from 'react';

// Small hook for the "success/error toast" banners shown after API calls.
// Returns [banner, showBanner] like useState, but the banner auto-clears after 4s.
export function useBanner() {
  const [banner, setBanner] = useState(null);

  const showBanner = useCallback((type, text) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  return [banner, showBanner];
}
