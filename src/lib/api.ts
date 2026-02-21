const rawApiBase = import.meta.env.VITE_API_URL?.trim() || '';

export const API_BASE_URL = rawApiBase.replace(/\/+$/, '');
const AUTH_TOKEN_KEY = 'auth_token';

export function buildApiUrl(path: string) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`);
  }
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore storage failures
  }
}

export function clearStoredAuthToken() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

export function getAuthHeaders(baseHeaders: Record<string, string> = {}) {
  const token = getStoredAuthToken();
  return token
    ? { ...baseHeaders, Authorization: `Bearer ${token}` }
    : baseHeaders;
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(bodyText) as T;
    } catch {
      throw new Error('Server returned invalid JSON.');
    }
  }

  if (!response.ok) {
    const preview = bodyText.trim().slice(0, 120);
    throw new Error(
      `Expected JSON but received non-JSON response (${response.status}). ${preview}`
    );
  }

  throw new Error('Expected JSON response from server.');
}
