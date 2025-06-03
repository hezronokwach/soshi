export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { updateCommentReaction, getCommentReactions } from '@/lib/db/models/comment';

// Add or update a reaction to a comment
export async function POST(req, { params }) {
  try {
    const { userId, type, emoji } = await req.json();

    // Validate reaction type
    if (!['like', 'dislike', 'emoji'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      );
    }

    // If type is emoji, ensure emoji is provided
    if (type === 'emoji' && !emoji) {
      return NextResponse.json(
        { error: 'Emoji is required for emoji reactions' },
        { status: 400 }
      );
    }

    const reactionCounts = await updateCommentReaction({
      comment_id: params.id,
      user_id: userId,
      type,
      emoji
    });

    return NextResponse.json(reactionCounts);
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