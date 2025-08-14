export function toAbsoluteUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  try {
    // Already absolute
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) return pathOrUrl; // SSR fallback
    const needsSlash = pathOrUrl.startsWith('/') ? '' : '/';
    return `${origin}${needsSlash}${pathOrUrl}`;
  } catch {
    return pathOrUrl || undefined;
  }
}
