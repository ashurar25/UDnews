import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Simple GA4 loader and page view tracker for Wouter
export default function GAListener() {
  const [location] = useLocation();

  useEffect(() => {
    const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
    if (!GA_ID) return;

    // Inject gtag script once
    if (!document.getElementById('ga4-lib')) {
      const s1 = document.createElement('script');
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      s1.id = 'ga4-lib';
      document.head.appendChild(s1);

      const s2 = document.createElement('script');
      s2.id = 'ga4-init';
      s2.innerHTML = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\nwindow.gtag = gtag;\ngtag('js', new Date());\ngtag('config', '${GA_ID}', { send_page_view: false });`;
      document.head.appendChild(s2);
    }
  }, []);

  useEffect(() => {
    const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
    if (!GA_ID || typeof (window as any).gtag !== 'function') return;

    (window as any).gtag('event', 'page_view', {
      page_path: location,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);

  return null;
}
