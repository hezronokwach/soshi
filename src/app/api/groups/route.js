// src/app/api/groups/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/groups - Get all groups
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = Group.getAll();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/groups - Create a new group
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.trim().length > 255) {
      return NextResponse.json({ error: 'Title is too long (max 255 characters)' }, { status: 400 });
    }

    // Create the group
    const groupId = Group.create(
      title.trim(),
      description?.trim() || '',
      user.id
    );

    return NextResponse.json({
      id: groupId,
      message: 'Group created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}