// src/app/api/groups/[id]/posts/route.js
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
    const { content, imagePath } = await request.json();

    // Check if user is a member of the group
    const memberStatus = await Group.isMember(id, user.id);
    if (!memberStatus || memberStatus.status !== 'accepted') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const postId = await Group.createPost(id, user.id, content.trim(), imagePath);
    
    return NextResponse.json({ 
      id: postId, 
      message: 'Post created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}