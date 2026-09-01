import {
  clearTokenPair,
  getHrisApiBaseUrl,
  hrisApi,
  readTokenPair,
  storeTokenPair,
  type TokenPair,
} from "~/lib/hris-api-client";

export interface HrisUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  roles?: string[];
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface MfaChallenge {
  mfaRequired: true;
  mfaToken: string;
  mfaMethods?: string[];
  expiresIn?: number;
  message?: string;
}

export interface AuthenticatedLogin {
  message?: string;
  tokens: TokenPair;
  user: HrisUser;
}

export type LoginResult = MfaChallenge | AuthenticatedLogin;

interface UserProfileResponse {
  user: HrisUser;
  message?: string;
}

let cachedUser: { accessToken: string; user: HrisUser } | null = null;
let pendingUserRequest: {
  accessToken: string;
  request: Promise<HrisUser>;
} | null = null;

const isAuthenticatedLogin = (
  result: LoginResult,
): result is AuthenticatedLogin => "tokens" in result;

export const completeHrisLogin = async (
  result: LoginResult,
): Promise<LoginResult> => {
  if (!isAuthenticatedLogin(result)) {
    return result;
  }

  storeTokenPair(result.tokens);
  cachedUser = null;
  return result;
};

export const loginWithPassword = async (
  credentials: LoginCredentials,
): Promise<LoginResult> => {
  const result = await hrisApi.post<LoginResult>("/auth/login", credentials, {
    skipAuth: true,
  });
  return completeHrisLogin(result);
};

export const getCurrentHrisUser = async (
  forceRefresh = false,
): Promise<HrisUser> => {
  const accessToken = readTokenPair()?.accessToken;

  if (!accessToken) {
    const response = await hrisApi.get<UserProfileResponse>("/users/me");
    return response.user;
  }

  if (!forceRefresh && cachedUser?.accessToken === accessToken) {
    return cachedUser.user;
  }

  if (pendingUserRequest?.accessToken === accessToken) {
    return pendingUserRequest.request;
  }

  const request = hrisApi
    .get<UserProfileResponse>("/users/me")
    .then(({ user }) => {
      cachedUser = {
        accessToken: readTokenPair()?.accessToken ?? accessToken,
        user,
      };
      return user;
    })
    .finally(() => {
      if (pendingUserRequest?.accessToken === accessToken) {
        pendingUserRequest = null;
      }
    });

  pendingUserRequest = { accessToken, request };
  return request;
};

export const verifyMfa = async (
  mfaToken: string,
  code: string,
): Promise<AuthenticatedLogin> => {
  const result = await hrisApi.post<AuthenticatedLogin>(
    "/mfa/verify",
    { mfaToken, code, method: "TOTP" },
    { skipAuth: true },
  );
  storeTokenPair(result.tokens);
  cachedUser = null;
  return result;
};

export const logoutFromHris = async (): Promise<void> => {
  const tokens = readTokenPair();
  if (!tokens) {
    clearTokenPair();
    cachedUser = null;
    return;
  }

  try {
    await hrisApi.post("/auth/logout", {
      refreshToken: tokens.refreshToken,
    });
  } finally {
    clearTokenPair();
    cachedUser = null;
  }
};

export const getGoogleSignInUrl = (): string => {
  const url = new URL(`${getHrisApiBaseUrl()}/auth/google`);
  if (typeof window !== "undefined") {
    url.searchParams.set("returnTo", window.location.origin);
    url.searchParams.set("client", "payroll");
  }
  return url.toString();
};

/** Reads the tokens the API appends to the /auth/success redirect (query or hash). */
export const parseTokensFromUrl = (
  search: string,
  hash = "",
): Partial<TokenPair> => {
  const params = new URLSearchParams(search.replace(/^\?/, ""));
  new URLSearchParams(hash.replace(/^#/, "")).forEach((value, key) => {
    params.set(key, value);
  });

  return {
    accessToken:
      params.get("accessToken") || params.get("access_token") || undefined,
    refreshToken:
      params.get("refreshToken") || params.get("refresh_token") || undefined,
  };
};

export const hasHrisSession = (): boolean => readTokenPair() !== null;
