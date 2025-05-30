// Posts API route
import { NextResponse } from 'next/server';
import { createPost, getFeedPosts, getPostById, updatePost, deletePost } from '@/lib/db/models/post';
import { getDb } from '@/lib/db/index';

// GET posts or single post
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const privacy = searchParams.getAll('privacy') || ['public'];

    if (postId) {
      // Get single post
      const post = await getPostById(parseInt(postId), parseInt(userId));
      if (!post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(post);
    }

    // Get feed posts
    const posts = await getFeedPosts({
      userId: parseInt(userId),
      page,
      limit,
      privacy
    });

    return NextResponse.json({
      posts,
      page,
      limit
    });
  } catch (error) {
    console.error('Error retrieving posts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve posts' },
      { status: 500 }
    );
  }
}

// POST create a new post
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, content, privacy, selectedUsers } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create post
    const postId = await createPost({
      user_id: parseInt(userId),
      content,
      image_url: body.image_url || null,
      privacy: privacy || 'public',
      selected_users: selectedUsers?.map(id => parseInt(id)) || []
    });

    return NextResponse.json({
      message: 'Post created successfully',
      postId
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 400 }
    );
  }
}

// PUT update existing post
export async function PUT(request) {
  try {
    const body = await request.json();
    const { postId, userId, content, privacy, selectedUsers } = body;

    if (!postId || !userId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await updatePost(
      parseInt(postId),
      {
        content,
        privacy: privacy || 'public',
        selected_users: selectedUsers?.map(id => parseInt(id)) || []
      },
      parseInt(userId)
    );

    return NextResponse.json({
      message: 'Post updated successfully',
      success
    });
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.message === 'Unauthorized to update this post') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 400 }
    );
  }
}

// DELETE post
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const success = await deletePost(
      parseInt(postId),
      parseInt(userId)
    );

    return NextResponse.json({
      message: 'Post deleted successfully',
      success
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    if (error.message === 'Unauthorized to delete this post') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 400 }
    );
  }
}
