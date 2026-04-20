export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:4000';

export function joinUrl(base: string, path: string) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  if (!b) return `/${p}`;
  return `${b}/${p}`;
}

export async function apiFetch(path: string, opts?: RequestInit & { token?: string }) {
  const url = joinUrl(API_BASE_URL, path);
  const token = opts?.token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(url, { ...opts, headers });
  const payload = await resp.json().catch(() => ({}));
  return { resp, payload };
}

