// Logout API route
import { NextResponse } from 'next/server';
import { getSessionByToken, deleteSession } from '@/lib/db/models/session';

export async function POST(request) {
  try {
    // Get the session token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(cookie => {
        const [name, ...value] = cookie.split('=');
        return [name, value.join('=')];
      })
    );

    const sessionToken = cookies.session_token;

    // Delete session from database if it exists
    if (sessionToken) {
      const session = await getSessionByToken(sessionToken);
      if (session) {
        await deleteSession(session.id);
      }
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logout successful',
      success: true
    });

    // Clear the session cookie
    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
