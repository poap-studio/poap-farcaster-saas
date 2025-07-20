import { getTokenExpirationInfo, isJWTExpired } from "./jwt-utils";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface TokenData {
  token: string;
  expiresAt: number;
  scope: string;
}

interface TokenStorage {
  get(key: string): Promise<TokenData | null>;
  set(key: string, value: TokenData, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  disconnect?(): Promise<void>;
}

// Simple in-memory storage for development/fallback
class MemoryStorage implements TokenStorage {
  private cache = new Map<string, { data: TokenData; expiresAt: number }>();

  async get(key: string): Promise<TokenData | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set(key: string, value: TokenData, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}


class POAPAuthManager {
  private storage: TokenStorage;
  private storageKey: string;
  
  // In-memory cache for the current function execution
  private currentToken: TokenData | null = null;
  private refreshPromise: Promise<TokenData> | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private audience = "https://api.poap.tech",
    storage?: TokenStorage
  ) {
    this.storageKey = `poap_token_${clientId}`;
    
    // Always use memory storage - works perfectly in Vercel's serverless environment
    this.storage = storage || new MemoryStorage();
    console.log("Using memory storage for tokens");
  }

  private async refreshToken(): Promise<TokenData> {
    console.log("Refreshing POAP access token...");
    
    const response = await fetch("https://auth.accounts.poap.xyz/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audience: this.audience,
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenResponse: TokenResponse = await response.json();
    
    // Calculate expiry time with 5-minute buffer
    const expiresAt = Date.now() + (tokenResponse.expires_in - 300) * 1000;
    
    const tokenData = {
      token: tokenResponse.access_token,
      expiresAt,
      scope: tokenResponse.scope,
    };

    // Store in persistent storage with TTL
    const ttlSeconds = tokenResponse.expires_in - 300; // 5-minute buffer
    await this.storage.set(this.storageKey, tokenData, ttlSeconds);

    // Also cache in memory for this function execution
    this.currentToken = tokenData;

    // Log token information for debugging
    const tokenInfo = getTokenExpirationInfo(tokenResponse.access_token);
    if (tokenInfo) {
      console.log("Token refreshed successfully:", {
        scope: tokenInfo.scope,
        expires_at: tokenInfo.expiresAt?.toISOString(),
        minutes_until_expiry: tokenInfo.timeUntilExpiryMinutes,
        storage: this.storage.constructor.name,
      });
    }

    return tokenData;
  }

  private async isTokenValid(tokenData: TokenData): Promise<boolean> {
    // Check if token is expired based on our stored expiry
    if (Date.now() >= tokenData.expiresAt) {
      return false;
    }

    // Also verify the JWT token itself
    if (isJWTExpired(tokenData.token, 300)) { // 5-minute buffer
      return false;
    }

    return true;
  }

  async getValidToken(): Promise<string> {
    // First, check in-memory cache for this function execution
    if (this.currentToken && await this.isTokenValid(this.currentToken)) {
      return this.currentToken.token;
    }

    // Check persistent storage
    const storedToken = await this.storage.get(this.storageKey);
    if (storedToken && await this.isTokenValid(storedToken)) {
      this.currentToken = storedToken; // Cache for this execution
      return storedToken.token;
    }

    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      const tokenData = await this.refreshPromise;
      return tokenData.token;
    }

    // Start a new refresh
    this.refreshPromise = this.refreshToken();
    
    try {
      const tokenData = await this.refreshPromise;
      return tokenData.token;
    } finally {
      this.refreshPromise = null;
    }
  }

  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    retryOnAuth = true
  ): Promise<Response> {
    const token = await this.getValidToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If we get a 401/403 and haven't retried yet, refresh token and retry
    if ((response.status === 401 || response.status === 403) && retryOnAuth) {
      console.log("Authentication failed, refreshing token and retrying...");
      
      // Clear both caches
      this.currentToken = null;
      await this.storage.delete(this.storageKey);
      
      const newToken = await this.getValidToken();
      
      // Retry the request with the new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    return response;
  }

  // Method to force refresh (useful for debugging)
  async forceRefresh(): Promise<string> {
    this.currentToken = null;
    await this.storage.delete(this.storageKey);
    return this.getValidToken();
  }
}

// Singleton for the current function execution
let authManager: POAPAuthManager | null = null;

export function getPOAPAuthManager(storage?: TokenStorage): POAPAuthManager {
  if (!authManager) {
    const clientId = process.env.POAP_CLIENT_ID;
    const clientSecret = process.env.POAP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("POAP_CLIENT_ID and POAP_CLIENT_SECRET environment variables are required");
    }

    authManager = new POAPAuthManager(clientId, clientSecret, "https://api.poap.tech", storage);
  }

  return authManager;
}

export { POAPAuthManager }; 