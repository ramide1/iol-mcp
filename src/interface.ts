interface TokenResponse {
  'access token'?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  '.issued'?: string;
  '.expires'?: string;
}

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type {
  TokenResponse,
  StoredToken
};