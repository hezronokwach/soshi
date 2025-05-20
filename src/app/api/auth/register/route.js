// Register API route
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/db/models/user';
import { createSession } from '@/lib/auth';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  avatar: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  about_me: z.string().optional().nullable(),
});

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate user data
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    try {
      // Create user in database (createUser already checks if user exists)
      const userId = await createUser(userData);

      // Create session for the new user
      const user = { id: userId, ...userData };
      delete user.password; // Remove password from session data

      await createSession(user);

      return NextResponse.json({
        message: 'Registration successful',
        success: true,
        user: {
          id: userId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }

      throw error; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Registration error:', error);

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
