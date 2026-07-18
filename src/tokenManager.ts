import type { TokenResponse, StoredToken } from "./interface";

class TokenManager {
  private tokens: Map<string, StoredToken> = new Map();

  storeToken(username: string, tokenData: TokenResponse): void {
    const accessToken = tokenData["access token"] || "";
    const refreshToken = tokenData.refresh_token || "";
    const expiresIn = tokenData.expires_in || 900;

    this.tokens.set(username, {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });
  }

  getAccessToken(username: string): string | null {
    const token = this.tokens.get(username);
    if (!token) return null;

    if (Date.now() >= token.expiresAt) {
      return null;
    }

    return token.accessToken;
  }

  getRefreshToken(username: string): string | null {
    const token = this.tokens.get(username);
    return token?.refreshToken || null;
  }

  isTokenValid(username: string): boolean {
    const token = this.tokens.get(username);
    if (!token) return false;
    return Date.now() < token.expiresAt;
  }

  clearTokens(username: string): void {
    this.tokens.delete(username);
  }
}

export const tokenManager = new TokenManager();
