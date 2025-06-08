// src/app/api/groups/[id]/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '../sqlite.js';

/**
 * GET /api/groups/[id] - Get group details
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Validate ID
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const group = Group.getById(groupId);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
    const memberStatus = Group.isMember(groupId, user.id);

    if (!memberStatus || memberStatus.status !== 'accepted') {
      return NextResponse.json({ error: 'Access denied. You must be a member to view this group.' }, { status: 403 });
    }

    // Get group data - members, posts, and events
    const [members, posts, events] = [
      Group.getMembers(groupId),
      Group.getPosts(groupId),
      Group.getEvents(groupId)
    ];

    return NextResponse.json({
      ...group,
      members,
      posts,
      events,
      userMemberStatus: memberStatus.status
    });

  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/groups/[id] - Update group (only for creators)
 */
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const group = Group.getById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only group creator can update
    if (group.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only group creator can update the group' }, { status: 403 });
    }

    const { title, description } = await request.json();

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.trim().length > 255) {
      return NextResponse.json({ error: 'Title is too long (max 255 characters)' }, { status: 400 });
    }

    // Update group (we need to add this method to the Group model)
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE groups 
      SET title = ?, description = ?
      WHERE id = ?
    `);
    stmt.run(title.trim(), description?.trim() || '', groupId);

    return NextResponse.json({ message: 'Group updated successfully' });

  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[id] - Delete group (only for creators)
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const group = Group.getById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only group creator can delete
    if (group.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only group creator can delete the group' }, { status: 403 });
    }

    // Delete group (cascade will handle related records)
    const db = getDb();
    const stmt = db.prepare('DELETE FROM groups WHERE id = ?');
    stmt.run(groupId);

    return NextResponse.json({ message: 'Group deleted successfully' });

  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}