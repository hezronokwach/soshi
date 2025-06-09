// src/app/api/events/[id]/respond/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db/index';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { response } = await request.json();

    if (!['going', 'not_going'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    }

    // Check if event exists and user has access
    const db = await getDb();
    const event = await db.get(`
      SELECT ge.*, gm.status as member_status
      FROM group_events ge
      JOIN group_members gm ON ge.group_id = gm.group_id
      WHERE ge.id = ? AND gm.user_id = ? AND gm.status = 'accepted'
    `, [id, user.id]);

    if (!event) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 });
    }

    await Group.respondToEvent(id, user.id, response);

    return NextResponse.json({ message: 'Response recorded successfully' });

  } catch (error) {
    console.error('Error responding to event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}