// Session API route
import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/db/models/user';
import { getSessionByToken } from '@/lib/db/models/session';

export async function GET(request) {
  try {
    // Get the session token from cookies
    // In Next.js, we need to use the headers() function to get cookies in a route handler
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(cookie => {
        const [name, ...value] = cookie.split('=');
        return [name, value.join('=')];
      })
    );

    const sessionToken = cookies.session_token;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    // Get session from database
    const session = await getSessionByToken(sessionToken);

    if (!session) {
      // Session not found or expired
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session_token');
      return response;
    }

    // Get user from database
    const user = await getUserById(session.userId);

    if (!user) {
      // Clear invalid session
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session_token');
      return response;
    }

    // Remove sensitive data
    delete user.password;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        nickname: user.nickname
      }
    });
  } catch (error) {
    console.error('Session error:', error);

    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
