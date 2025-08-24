import { NextRequest } from 'next/server';
import { prisma } from '~/lib/prisma';
import { getSession } from '~/lib/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Get the current user session
    const session = await getSession();
    if (!session) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: 'Not authenticated' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (error) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: '${errorDescription || error}' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: 'No authorization code received' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID || '631541192644294',
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://social.poap.studio'}/api/instagram-auth/callback`,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: 'Failed to get access token' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const { access_token, user_id } = tokenData;

    // Exchange short-lived token for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${access_token}`
    );
    const longLivedData = await longLivedResponse.json();

    if (!longLivedData.access_token) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: 'Failed to get long-lived token' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Get user info
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedData.access_token}`
    );
    const userData = await userResponse.json();

    // Store or update Instagram account in database
    await prisma.instagramAccount.upsert({
      where: { instagramId: user_id.toString() },
      update: {
        accessToken: longLivedData.access_token,
        username: userData.username,
        expiresAt: longLivedData.expires_in ? new Date(Date.now() + longLivedData.expires_in * 1000) : null,
        updatedAt: new Date()
      },
      create: {
        instagramId: user_id.toString(),
        accessToken: longLivedData.access_token,
        username: userData.username,
        expiresAt: longLivedData.expires_in ? new Date(Date.now() + longLivedData.expires_in * 1000) : null
      }
    });

    // Store the Instagram account ID in session
    // Note: In a real implementation, you might want to store this in a more persistent way
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Instagram Auth Success</title></head>
      <body>
        <script>
          window.opener.postMessage({ type: 'instagram-auth-success', accountId: '${user_id}', username: '${userData.username}' }, '*');
          window.close();
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('[Instagram Auth] Error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head><title>Instagram Auth Error</title></head>
      <body>
        <script>
          window.opener.postMessage({ type: 'instagram-auth-error', error: 'Server error occurred' }, '*');
          window.close();
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}