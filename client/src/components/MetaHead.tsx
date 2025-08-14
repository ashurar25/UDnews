import { useEffect } from 'react';

interface MetaHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string; // absolute or path; will be normalized
  type?: 'website' | 'article' | string;
  siteName?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any>;
}

function upsertTag(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void) {
  let el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  set(el);
}

export default function MetaHead({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'UD News Update',
  canonical,
  noindex,
  jsonLd,
}: MetaHeadProps) {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const absUrl = url?.startsWith('http') ? url : url ? `${origin}${url.startsWith('/') ? '' : '/'}${url}` : window.location.href;

    if (title) document.title = title;

    if (description) {
      upsertTag('meta[name="description"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        return m;
      }, (m) => m.setAttribute('content', description));
    }

    if (canonical || absUrl) {
      upsertTag('link[rel="canonical"]', () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      }, (l) => l.setAttribute('href', canonical || absUrl));
    }

    if (noindex) {
      upsertTag('meta[name="robots"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'robots');
        return m;
      }, (m) => m.setAttribute('content', 'noindex,nofollow'));
    }

    // Open Graph
    const og: Record<string, string | undefined> = {
      'og:title': title,
      'og:description': description,
      'og:image': image,
      'og:url': absUrl,
      'og:type': type,
      'og:site_name': siteName,
    };
    Object.entries(og).forEach(([property, content]) => {
      if (!content) return;
      upsertTag(`meta[property="${property}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute('property', property);
        return m;
      }, (m) => m.setAttribute('content', content));
    });

    // Twitter
    const tw: Record<string, string | undefined> = {
      'twitter:card': image ? 'summary_large_image' : 'summary',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
    };
    Object.entries(tw).forEach(([name, content]) => {
      if (!content) return;
      upsertTag(`meta[name="${name}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute('name', name);
        return m;
      }, (m) => m.setAttribute('content', content));
    });

    // JSON-LD
    if (jsonLd) {
      const id = 'jsonld-primary';
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
    }
  }, [title, description, image, url, type, siteName, canonical, noindex, jsonLd]);

  return null;
}
