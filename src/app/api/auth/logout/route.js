// Logout API route
import { NextResponse } from 'next/server';
import { endSession } from '@/lib/auth';

export async function POST() {
  try {
    // End the session
    await endSession();
    
    return NextResponse.json({ 
      message: 'Logout successful',
      success: true 
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
