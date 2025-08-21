import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-please-change-in-production'
);

const SESSION_COOKIE_NAME = 'poap-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionData {
  userId: string;
  fid?: number;
  googleId?: string;
  email?: string;
  username: string;
  displayName?: string;
  profileImage?: string;
  provider: 'farcaster' | 'google';
}

export async function createSession(data: SessionData) {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookiesList = await cookies();
  cookiesList.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookiesList = await cookies();
    const token = cookiesList.get(SESSION_COOKIE_NAME);

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload as unknown as SessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME);

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload as unknown as SessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export async function clearSession() {
  const cookiesList = await cookies();
  cookiesList.delete(SESSION_COOKIE_NAME);
}