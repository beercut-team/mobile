import { getTokens, setTokens, clearTokens } from './token-storage';

export const API_BASE_URL = 'https://api.beercut.tech';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Error messages mapping to avoid exposing server details
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Неверные данные',
  401: 'Требуется авторизация',
  403: 'Доступ запрещен',
  404: 'Не найдено',
  409: 'Конфликт данных',
  422: 'Ошибка валидации',
  429: 'Слишком много запросов',
  500: 'Ошибка сервера',
  502: 'Сервис недоступен',
  503: 'Сервис недоступен',
  504: 'Превышено время ожидания',
};

// Fetch with timeout using AbortController
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

async function attemptRefresh(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    }, 15000); // 15s timeout for refresh

    if (!res.ok) return null;

    const data = await res.json();
    await setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = await getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && tokens?.refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;

    if (newAccessToken) {
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
    } else {
      await clearTokens();
      throw new ApiError(401, 'Сессия истекла');
    }
  }

  if (!res.ok) {
    // Use sanitized error messages instead of exposing server details
    const message = ERROR_MESSAGES[res.status] || 'Произошла ошибка';
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
