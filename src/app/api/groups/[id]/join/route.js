// src/app/api/groups/[id]/join/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const group = await Group.getById(id);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await Group.isMember(id, user.id);
    if (existingMembership) {
      return NextResponse.json({
        error: 'You are already a member or have a pending request'
      }, { status: 400 });
    }

    // Send join request
    await Group.inviteUser(id, user.id, null); // null for self-request

    // Create notification for group creator
    const notificationStmt = db.prepare(`
      INSERT INTO notifications (user_id, type, message, related_id)
      VALUES (?, 'group_join_request', ?, ?)
    `);
    notificationStmt.run(
      group.creator_id,
      `${user.first_name} ${user.last_name} wants to join "${group.title}"`,
      id
    );

    return NextResponse.json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Error sending join request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}