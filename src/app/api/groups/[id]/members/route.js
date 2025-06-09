// src/app/api/groups/[id]/members/[userId]/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db/index';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = params;
    const { action } = await request.json(); // 'accept' or 'decline'

    const group = await Group.getById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only group creator can accept/decline requests
    if (group.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only group creator can manage members' }, { status: 403 });
    }

    if (action === 'accept') {
      await Group.acceptInvitation(id, userId);

      // Notify the user
      const db = await getDb();
      await db.run(`
        INSERT INTO notifications (user_id, type, message, related_id)
        VALUES (?, 'group_invite_accepted', ?, ?)
      `, [
        userId,
        `Your request to join "${group.title}" has been accepted`,
        id
      ]);

      return NextResponse.json({ message: 'Member accepted successfully' });

    } else if (action === 'decline') {
      await Group.declineInvitation(id, userId);
      return NextResponse.json({ message: 'Request declined successfully' });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing group member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = params;

    const group = await Group.getById(id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only group creator can remove members (or users can leave themselves)
    if (group.creator_id !== user.id && user.id !== parseInt(userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Group.declineInvitation(id, userId);

    return NextResponse.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}