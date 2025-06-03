export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createComment, getPostComments, getCommentById } from '@/lib/db/models/comment';
import { getPostById } from '@/lib/db/models/post';

// Get comments for a post
export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const parentId = searchParams.get('parentId') || null;
    
    const comments = await getPostComments(params.id, {
      page,
      limit,
      parentId
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// Create a new comment
export async function POST(req, { params }) {
  try {
    const { userId, content, parentId = null, imageUrl = null } = await req.json();

    // Verify post exists
    const post = await getPostById(params.id, userId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create comment
    const commentId = await createComment({
      post_id: params.id,
      user_id: userId,
      parent_id: parentId,
      content,
      image_url: imageUrl
    });

    // Get created comment with user info
    const comment = await getCommentById(commentId);

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}