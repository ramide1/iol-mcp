interface TokenResponse {
  'access token'?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  '.issued'?: string;
  '.expires'?: string;
}

export type { TokenResponse };