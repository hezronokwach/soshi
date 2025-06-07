// src/app/api/groups/[id]/events/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db/sqlite';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { title, description, eventDate } = await request.json();

    // Check if user is a member of the group
    const memberStatus = await Group.isMember(id, user.id);
    if (!memberStatus || memberStatus.status !== 'accepted') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!title || !eventDate) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }

    const eventId = await Group.createEvent(id, user.id, title, description || '', eventDate);
    
    // Notify all group members about the new event
    const membersStmt = db.prepare(`
      SELECT user_id FROM group_members 
      WHERE group_id = ? AND status = 'accepted' AND user_id != ?
    `);
    const members = membersStmt.all(id, user.id);

    const notificationStmt = db.prepare(`
      INSERT INTO notifications (user_id, type, message, related_id)
      VALUES (?, 'group_event', ?, ?)
    `);

    members.forEach(member => {
      notificationStmt.run(
        member.user_id,
        `New event "${title}" created in your group`,
        eventId
      );
    });

    return NextResponse.json({ 
      id: eventId, 
      message: 'Event created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}