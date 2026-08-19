const DEFAULT_HRIS_API_BASE_URL = "http://localhost:8000/api";
const ACCESS_TOKEN_KEY = "payroll.hris.access-token";
const REFRESH_TOKEN_KEY = "payroll.hris.refresh-token";
const TOKEN_CHANGE_EVENT = "payroll:hris-token-change";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

export interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  errors?: Record<string, string | string[]>;
}

export class HrisApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "HrisApiError";
    this.status = status;
    this.payload = payload;
  }
}

const getBrowserStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.localStorage;

export const getHrisApiBaseUrl = (): string => {
  const browserUrl =
    typeof window === "undefined"
      ? undefined
      : import.meta.env.VITE_HRIS_API_BASE_URL;
  const serverUrl =
    typeof process === "undefined" ? undefined : process.env.HRIS_API_BASE_URL;

  return (browserUrl || serverUrl || DEFAULT_HRIS_API_BASE_URL).replace(
    /\/$/,
    "",
  );
};

export const readTokenPair = (
  storage: Pick<Storage, "getItem"> | null = getBrowserStorage(),
): TokenPair | null => {
  if (!storage) {
    return null;
  }

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
};

export const storeTokenPair = (
  tokens: TokenPair,
  storage: Pick<Storage, "setItem"> | null = getBrowserStorage(),
): void => {
  if (!storage) {
    return;
  }

  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  if (typeof window !== "undefined" && storage === window.localStorage) {
    window.dispatchEvent(new Event(TOKEN_CHANGE_EVENT));
  }
};

export const clearTokenPair = (
  storage: Pick<Storage, "removeItem"> | null = getBrowserStorage(),
): void => {
  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  if (typeof window !== "undefined" && storage === window.localStorage) {
    window.dispatchEvent(new Event(TOKEN_CHANGE_EVENT));
  }
};

export const subscribeToTokenChanges = (
  listener: () => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(TOKEN_CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(TOKEN_CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export const getApiErrorMessage = (
  payload: unknown,
  fallback: string,
): string => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const error = payload as ApiErrorPayload;
  if (Array.isArray(error.message)) {
    return error.message.join(", ");
  }
  if (typeof error.message === "string" && error.message) {
    return error.message;
  }
  if (typeof error.error === "string" && error.error) {
    return error.error;
  }

  const fieldError = error.errors && Object.values(error.errors)[0];
  return Array.isArray(fieldError)
    ? fieldError.join(", ")
    : fieldError || fallback;
};

const request = async <T>(
  path: string,
  options: ApiRequestOptions = {},
  canRetry = true,
): Promise<T> => {
  const tokens = readTokenPair();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (!options.skipAuth && tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const response = await fetch(`${getHrisApiBaseUrl()}${path}`, {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
  });
  const payload = await parseResponseBody(response);

  if (
    response.status === 401 &&
    canRetry &&
    !options.skipAuth &&
    tokens?.refreshToken
  ) {
    const refreshResponse = await fetch(`${getHrisApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    const refreshPayload = await parseResponseBody(refreshResponse);

    if (
      refreshResponse.ok &&
      refreshPayload &&
      typeof refreshPayload === "object"
    ) {
      const refreshed = refreshPayload as Partial<TokenPair>;
      if (refreshed.accessToken && refreshed.refreshToken) {
        storeTokenPair({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });
        return request<T>(path, options, false);
      }
    }

    clearTokenPair();
    throw new HrisApiError(
      refreshResponse.status,
      getApiErrorMessage(
        refreshPayload,
        "Your session has expired. Please sign in again.",
      ),
      refreshPayload,
    );
  }

  if (!response.ok) {
    throw new HrisApiError(
      response.status,
      getApiErrorMessage(payload, `HRIS request failed (${response.status})`),
      payload,
    );
  }

  return payload as T;
};

export const hrisApi = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
