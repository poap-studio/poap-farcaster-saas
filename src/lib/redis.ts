import { createClient, RedisClientType } from 'redis';

let redis: RedisClientType | null = null;

/**
 * Get Redis client instance (singleton pattern)
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not configured');
    }
    
    redis = createClient({
      url: redisUrl
    });
    
    redis.on('error', (error) => {
      console.error('[Redis] Connection error:', error);
    });
    
    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
    
    await redis.connect();
  }
  
  return redis;
}

/**
 * Generate Redis key for tracking POAP claims
 * Format: poap:claimed:{eventId}:{fid}
 */
function getPoapClaimKey(eventId: string, fid: number): string {
  return `poap:claimed:${eventId}:${fid}`;
}

/**
 * Check if a user has already claimed a specific POAP event
 */
export async function hasUserClaimedPoap(fid: number, eventId: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const key = getPoapClaimKey(eventId, fid);
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    console.error('[Redis] Error checking POAP claim:', error);
    // In case of Redis error, allow the claim to prevent blocking users
    return false;
  }
}

/**
 * Record that a user has claimed a specific POAP event
 */
export async function recordPoapClaim(fid: number, eventId: string, address: string, txHash?: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const key = getPoapClaimKey(eventId, fid);
    
    // Store claim data with timestamp, address, and optional transaction hash
    const claimData = {
      fid,
      eventId,
      address, // The ethereum address where POAP was minted
      claimedAt: new Date().toISOString(),
      txHash: txHash || null
    };
    
    await client.set(key, JSON.stringify(claimData));
    
    // Set TTL to 1 year to eventually clean up old claims
    await client.expire(key, 365 * 24 * 60 * 60);
    
    console.log(`[Redis] Recorded POAP claim for FID ${fid}, Event ${eventId}, Address ${address}`);
    return true;
  } catch (error) {
    console.error('[Redis] Error recording POAP claim:', error);
    return false;
  }
}

/**
 * Get claim details for a specific user and event
 */
export async function getPoapClaimDetails(fid: number, eventId: string): Promise<{
  fid: number;
  eventId: string;
  address: string;
  claimedAt: string;
  txHash: string | null;
} | null> {
  try {
    const client = await getRedisClient();
    const key = getPoapClaimKey(eventId, fid);
    const result = await client.get(key);
    
    if (result) {
      return JSON.parse(result);
    }
    
    return null;
  } catch (error) {
    console.error('[Redis] Error getting POAP claim details:', error);
    return null;
  }
}

/**
 * Get all claims for a specific POAP event (for analytics)
 */
export async function getEventClaims(eventId: string): Promise<{
  fid: number;
  eventId: string;
  claimedAt: string;
  txHash: string | null;
}[]> {
  try {
    const client = await getRedisClient();
    const pattern = `poap:claimed:${eventId}:*`;
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      return [];
    }
    
    const claims = await client.mGet(keys);
    return claims.filter(claim => claim !== null).map(claim => JSON.parse(claim!));
  } catch (error) {
    console.error('[Redis] Error getting event claims:', error);
    return [];
  }
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      redis = null;
      console.log('[Redis] Connection closed');
    } catch (error) {
      console.error('[Redis] Error closing connection:', error);
    }
  }
}