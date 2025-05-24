interface JWTPayload {
  iss?: string; // issuer
  sub?: string; // subject
  aud?: string; // audience
  exp?: number; // expiration time
  iat?: number; // issued at
  scope?: string; // scope
  [key: string]: unknown; // allow other fields
}

/**
 * Decode a JWT token without verification (for debugging only)
 * Do not use this for security-critical operations
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isJWTExpired(token: string, bufferSeconds = 0): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // treat invalid tokens as expired
  }

  const expirationTime = payload.exp * 1000; // convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return currentTime >= (expirationTime - bufferTime);
}

/**
 * Get token expiration info
 */
export function getTokenExpirationInfo(token: string) {
  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  const issuedAt = payload.iat ? new Date(payload.iat * 1000) : null;
  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
  const now = new Date();
  
  let timeUntilExpiry = null;
  let isExpired = false;
  
  if (expiresAt) {
    timeUntilExpiry = expiresAt.getTime() - now.getTime();
    isExpired = timeUntilExpiry <= 0;
  }

  return {
    issuer: payload.iss,
    subject: payload.sub,
    audience: payload.aud,
    scope: payload.scope,
    issuedAt,
    expiresAt,
    isExpired,
    timeUntilExpiry,
    timeUntilExpiryMinutes: timeUntilExpiry ? Math.floor(timeUntilExpiry / 1000 / 60) : null,
  };
} 