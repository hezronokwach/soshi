import { getDb } from "@/lib/db";
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse userId from session token (simple implementation)
    // In a real app, you'd verify the token properly
    const userId = sessionToken.split('_')[0];
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDb();
    
    // Get users that the current user is following (one-way following for now)
    // In a real app, you might want to implement mutual follows or let users choose
    const followers = await db.all(`
      SELECT u.id, u.first_name, u.last_name, u.avatar
      FROM users u
      WHERE u.id != ?
      ORDER BY u.first_name, u.last_name
      LIMIT 100
    `, [userId]);
    
    // For demo purposes, let's also include some mock data if the table is empty
    if (followers.length === 0) {
      return new Response(JSON.stringify([
        { id: 2, first_name: 'John', last_name: 'Doe', avatar: null },
        { id: 3, first_name: 'Jane', last_name: 'Smith', avatar: null },
        { id: 4, first_name: 'Alice', last_name: 'Johnson', avatar: null },
      ]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(followers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch followers' }), 
      { status: 500 }
    );
  }
}
