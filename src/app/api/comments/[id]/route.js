export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { 
  getCommentById, 
  updateComment, 
  deleteComment 
} from '@/lib/db/models/comment';

// Get a specific comment
export async function GET(req, { params }) {
  try {
    const comment = await getCommentById(params.id);
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 }
    );
  }
}

// Update a comment
export async function PUT(req, { params }) {
  try {
    const { userId, content, imageUrl } = await req.json();

    // Verify comment exists
    const comment = await getCommentById(params.id);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Update comment
    await updateComment(params.id, {
      content,
      image_url: imageUrl
    }, userId);

    // Get updated comment
    const updatedComment = await getCommentById(params.id);
    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error.message === 'Unauthorized to update this comment') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const postOwnerId = searchParams.get('postOwnerId');

    await deleteComment(params.id, userId, postOwnerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}