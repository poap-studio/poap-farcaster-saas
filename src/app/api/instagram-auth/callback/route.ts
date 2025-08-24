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

    // Exchange code for access token using Facebook Graph API
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.INSTAGRAM_CLIENT_ID || '631541192644294'}` +
      `&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://social.poap.studio'}/api/instagram-auth/callback`)}` +
      `&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}` +
      `&code=${code}`
    );

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

    const { access_token } = tokenData;

    // Get user pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: 'No Facebook pages found. Please ensure your Facebook account has a connected Instagram business account.' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Get the first page and its Instagram business account
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    
    // Get Instagram business account ID
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igAccountData = await igAccountResponse.json();

    if (!igAccountData.instagram_business_account) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Instagram Auth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ type: 'instagram-auth-error', error: 'No Instagram business account connected to your Facebook page.' }, '*');
            window.close();
          </script>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const instagramBusinessAccountId = igAccountData.instagram_business_account.id;
    
    // Get Instagram account info
    const igUserResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}?fields=username&access_token=${pageAccessToken}`
    );
    const igUserData = await igUserResponse.json();

    // Store or update Instagram account in database
    await prisma.instagramAccount.upsert({
      where: { instagramId: instagramBusinessAccountId },
      update: {
        accessToken: pageAccessToken, // Use page access token for Instagram API calls
        username: igUserData.username || 'Instagram Business',
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        updatedAt: new Date()
      },
      create: {
        instagramId: instagramBusinessAccountId,
        accessToken: pageAccessToken, // Use page access token for Instagram API calls
        username: igUserData.username || 'Instagram Business',
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
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
          window.opener.postMessage({ type: 'instagram-auth-success', accountId: '${instagramBusinessAccountId}', username: '${igUserData.username || 'Instagram Business'}' }, '*');
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