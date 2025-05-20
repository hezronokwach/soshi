// Login API route
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth';
import { createSession } from '@/lib/db/models/session';
import crypto from 'crypto';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate login data
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate a random token
    const token = `${user.id}_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`;

    // Create session in database
    await createSession(user.id, token);

    // Create response with session cookie
    const response = NextResponse.json({
      message: 'Login successful',
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

    // Set cookie in the response
    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
