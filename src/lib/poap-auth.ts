import { getTokenExpirationInfo, isJWTExpired } from "./jwt-utils";
import { createClient, type RedisClientType } from 'redis';

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

// Redis storage implementation for production
class RedisStorage implements TokenStorage {
  private redis: RedisClientType;

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.redis = createClient({
      url,
      socket: {
        // Use TLS for all connections except localhost
        tls: !url.includes('localhost'),
      },
    });
    
    this.redis.on('error', (err: Error) => {
      console.error('Redis error:', err.message);
    });
  }

  private async connect(): Promise<void> {
    if (!this.redis.isReady) {
      await this.redis.connect();
    }
  }

  async get(key: string): Promise<TokenData | null> {
    try {
      await this.connect();
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: TokenData, ttlSeconds: number): Promise<void> {
    try {
      await this.connect();
      await this.redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.connect();
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.redis?.isReady) {
        await this.redis.disconnect();
      }
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
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
    
    // Use provided storage or auto-detect based on environment
    if (storage) {
      this.storage = storage;
    } else if (process.env.VERCEL_ENV) {
      // In Vercel environment, use Redis for persistence
      try {
        this.storage = new RedisStorage();
        console.log("Using Redis for token storage (production mode)");
      } catch (error) {
        console.warn("Failed to initialize Redis, falling back to memory storage:", error);
        this.storage = new MemoryStorage();
      }
    } else {
      // In development, use memory storage
      this.storage = new MemoryStorage();
      console.log("Using memory storage for tokens (development mode)");
    }
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