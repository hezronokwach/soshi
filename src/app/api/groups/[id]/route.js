// src/app/api/groups/[id]/route.js
import { NextResponse } from 'next/server';
import { Group } from '@/lib/db/models/group';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
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

    // Check if user is a member
    const memberStatus = await Group.isMember(id, user.id);

    if (!memberStatus || memberStatus.status !== 'accepted') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get group members, posts, and events
    const [members, posts, events] = await Promise.all([
      Group.getMembers(id),
      Group.getPosts(id),
      Group.getEvents(id)
    ]);

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