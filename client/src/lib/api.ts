// Centralized API helper for admin and client requests
// - Automatically attaches Authorization: Bearer <adminToken> if present
// - Parses JSON safely
// - Handles 401 by clearing token and redirecting to admin login

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  auth?: boolean; // require admin auth
  json?: any;     // body JSON to be serialized
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, json, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    'Accept': 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  };

  if (auth) {
    const token = localStorage.getItem('adminToken');
    if (token) {
      (finalHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : (rest.body as BodyInit | null | undefined),
  });

  if (res.status === 401 && auth) {
    // Unauthorized: clear token and redirect to login page
    try { localStorage.removeItem('adminToken'); } catch {}
    // Prefer soft redirect to admin page (login screen embedded)
    if (typeof window !== 'undefined') {
      // Preserve the original location for after-login redirect if needed
      const current = window.location.pathname + window.location.search;
      const target = '/admin';
      if (!current.startsWith(target)) {
        window.location.href = target;
      }
    }
    throw new Error('Unauthorized');
  }

  // Try parse JSON, but tolerate empty responses
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed: ${res.status}`;
    const error = new Error(message) as Error & { status?: number; data?: any };
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

export const api = {
  get: <T = any>(url: string, options?: Omit<RequestOptions, 'method' | 'body' | 'json'>) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, json?: any, options?: Omit<RequestOptions, 'method' | 'body' | 'json'>) =>
    request<T>(url, { ...options, method: 'POST', json }),

  put: <T = any>(url: string, json?: any, options?: Omit<RequestOptions, 'method' | 'body' | 'json'>) =>
    request<T>(url, { ...options, method: 'PUT', json }),

  patch: <T = any>(url: string, json?: any, options?: Omit<RequestOptions, 'method' | 'body' | 'json'>) =>
    request<T>(url, { ...options, method: 'PATCH', json }),

  delete: <T = any>(url: string, options?: Omit<RequestOptions, 'method' | 'json'>) =>
    request<T>(url, { ...options, method: 'DELETE' }),

  // Upload helper for FormData or arbitrary BodyInit.
  // Does not set Content-Type automatically so the browser can set multipart boundaries.
  upload: <T = any>(url: string, body: BodyInit, options?: Omit<RequestOptions, 'method' | 'json' | 'body'>) =>
    request<T>(url, { ...options, method: 'POST', body }),
};
