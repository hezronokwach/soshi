export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { updateCommentReaction, getCommentReactions } from '@/lib/db/models/comment';

// Add, update or remove a reaction to a comment
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { userId, type, emoji } = await req.json();

    // Only allow like/dislike for now (emoji support can be added later)
    if (!['like', 'dislike'].includes(type)) {
      return NextResponse.json(
        { error: 'Only like and dislike reactions are currently supported' },
        { status: 400 }
      );
    }

    // Update the reaction and get the updated status
    const reactionStatus = await updateCommentReaction({
      comment_id: id,
      user_id: userId,
      type,
      emoji: null // Not using emoji for now
    });

    return NextResponse.json({
      likeCount: reactionStatus.likeCount,
      dislikeCount: reactionStatus.dislikeCount,
      userReaction: reactionStatus.userReaction
    });
  } catch (error) {
    console.error('Error updating comment reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}

// Get reactions for a comment
export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Get current reaction status and counts
    const reactionCounts = await getCommentReactions(params.id, userId);
    return NextResponse.json(reactionCounts);
  } catch (error) {
    console.error('Error getting comment reactions:', error);
    return NextResponse.json(
      { error: 'Failed to get reactions' },
      { status: 500 }
    );
  }
}