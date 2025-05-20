// Session API route
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current user from the session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ user: null });
    }
    
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
