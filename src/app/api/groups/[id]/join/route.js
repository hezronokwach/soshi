// src/app/api/groups/[id]/join/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db/index';

/**
 * POST /api/groups/[id]/join - Send a join request to a group
 */
export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const group = await Group.getById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is already a member or has pending request
    const existingMembership = await Group.isMember(groupId, user.id);
    if (existingMembership) {
      if (existingMembership.status === 'accepted') {
        return NextResponse.json({
          error: 'You are already a member of this group'
        }, { status: 400 });
      } else if (existingMembership.status === 'pending') {
        return NextResponse.json({
          error: 'You already have a pending join request for this group'
        }, { status: 400 });
      }
    }

    // Send join request
    await Group.inviteUser(groupId, user.id, null);

    // Create notification for group creator
    try {
      const db = await getDb();
      await db.run(`
        INSERT INTO notifications (user_id, type, message, related_id)
        VALUES (?, 'group_join_request', ?, ?)
      `, [
        group.creator_id,
        `${user.first_name} ${user.last_name} wants to join "${group.title}"`,
        groupId
      ]);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Error sending join request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/groups/[id]/join - Leave a group
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const groupId = parseInt(id);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const group = await Group.getById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
    const memberStatus = await Group.isMember(groupId, user.id);
    if (!memberStatus) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 400 });
    }

    // Don't allow group creator to leave their own group
    if (group.creator_id === user.id) {
      return NextResponse.json({
        error: 'Group creators cannot leave their own group. Delete the group instead.'
      }, { status: 400 });
    }

    // Remove user from group
    await Group.declineInvitation(groupId, user.id);

    return NextResponse.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}