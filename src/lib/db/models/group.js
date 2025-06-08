// src/lib/db/models/group.js
import { getDb } from '../index.js';

export class Group {
  /**
   * Create a new group
   * @param {string} title - Group title
   * @param {string} description - Group description
   * @param {number} creatorId - ID of the user creating the group
   * @returns {number} - ID of the created group
   */
  static async create(title, description, creatorId) {
    const db = await getDb();

    // Create the group
    const result = await db.run(`
      INSERT INTO groups (title, description, creator_id)
      VALUES (?, ?, ?)
    `, [title, description, creatorId]);

    const groupId = result.lastID;

    // Automatically add creator as accepted member
    await db.run(`
      INSERT INTO group_members (group_id, user_id, status)
      VALUES (?, ?, 'accepted')
    `, [groupId, creatorId]);

    return groupId;
  }

  /**
   * Get all groups with member counts
   * @returns {Array} - Array of group objects
   */
  static async getAll() {
    const db = await getDb();
    const groups = await db.all(`
      SELECT g.*, u.first_name, u.last_name, u.avatar,
             COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'accepted'
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    return groups;
  }

  /**
   * Get a group by ID
   * @param {number} id - Group ID
   * @returns {Object|null} - Group object or null
   */
  static async getById(id) {
    const db = await getDb();
    const group = await db.get(`
      SELECT g.*, u.first_name, u.last_name, u.avatar
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      WHERE g.id = ?
    `, [id]);
    return group;
  }

  /**
   * Get all members of a group
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of member objects
   */
  static async getMembers(groupId) {
    const db = await getDb();
    const members = await db.all(`
      SELECT u.id, u.first_name, u.last_name, u.avatar, 
             gm.status, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at DESC
    `, [groupId]);
    return members;
  }

  /**
   * Invite/Add a user to a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID to invite
   * @param {number|null} invitedBy - ID of user sending invitation
   * @returns {Object} - Database result
   */
  static async inviteUser(groupId, userId, invitedBy) {
    const db = await getDb();
    const result = await db.run(`
      INSERT OR IGNORE INTO group_members (group_id, user_id, status, invited_by)
      VALUES (?, ?, 'pending', ?)
    `, [groupId, userId, invitedBy]);
    return result;
  }

  /**
   * Accept a group invitation
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Object} - Database result
   */
  static async acceptInvitation(groupId, userId) {
    const db = await getDb();
    const result = await db.run(`
      UPDATE group_members 
      SET status = 'accepted', joined_at = CURRENT_TIMESTAMP
      WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);
    return result;
  }

  /**
   * Decline/Remove a group invitation or membership
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Object} - Database result
   */
  static async declineInvitation(groupId, userId) {
    const db = await getDb();
    const result = await db.run(`
      DELETE FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);
    return result;
  }

  /**
   * Check if a user is a member of a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Membership status or null
   */
  static async isMember(groupId, userId) {
    const db = await getDb();
    const member = await db.get(`
      SELECT status FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);
    return member;
  }

  /**
   * Get groups a user belongs to
   * @param {number} userId - User ID
   * @returns {Array} - Array of group objects
   */
  static async getUserGroups(userId) {
    const db = await getDb();
    const groups = await db.all(`
      SELECT g.*, COUNT(gm2.user_id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.status = 'accepted'
      WHERE gm.user_id = ? AND gm.status = 'accepted'
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `, [userId]);
    return groups;
  }

  // Group Posts Methods
  /**
   * Create a post in a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @param {string} content - Post content
   * @param {string|null} imagePath - Path to image (optional)
   * @returns {number} - ID of created post
   */
  static async createPost(groupId, userId, content, imagePath = null) {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO group_posts (group_id, user_id, content, image_path)
      VALUES (?, ?, ?, ?)
    `, [groupId, userId, content, imagePath]);
    return result.lastID;
  }

  /**
   * Get all posts in a group
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of post objects
   */
  static async getPosts(groupId) {
    const db = await getDb();
    const posts = await db.all(`
      SELECT gp.*, u.first_name, u.last_name, u.avatar
      FROM group_posts gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.group_id = ?
      ORDER BY gp.created_at DESC
    `, [groupId]);
    return posts;
  }

  // Group Events Methods
  /**
   * Create an event in a group
   * @param {number} groupId - Group ID
   * @param {number} creatorId - Creator user ID
   * @param {string} title - Event title
   * @param {string} description - Event description
   * @param {string} eventDate - Event date (ISO string)
   * @returns {number} - ID of created event
   */
  static async createEvent(groupId, creatorId, title, description, eventDate) {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO group_events (group_id, creator_id, title, description, event_date)
      VALUES (?, ?, ?, ?, ?)
    `, [groupId, creatorId, title, description, eventDate]);
    return result.lastID;
  }

  /**
   * Get all events in a group
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of event objects with response counts
   */
  static async getEvents(groupId) {
    const db = await getDb();
    const events = await db.all(`
      SELECT ge.*, u.first_name, u.last_name,
             COUNT(CASE WHEN er.response = 'going' THEN 1 END) as going_count,
             COUNT(CASE WHEN er.response = 'not_going' THEN 1 END) as not_going_count
      FROM group_events ge
      JOIN users u ON ge.creator_id = u.id
      LEFT JOIN event_responses er ON ge.id = er.event_id
      WHERE ge.group_id = ?
      GROUP BY ge.id
      ORDER BY ge.event_date ASC
    `, [groupId]);
    return events;
  }

  /**
   * Respond to an event
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID
   * @param {string} response - 'going' or 'not_going'
   * @returns {Object} - Database result
   */
  static async respondToEvent(eventId, userId, response) {
    const db = await getDb();
    const result = await db.run(`
      INSERT OR REPLACE INTO event_responses (event_id, user_id, response)
      VALUES (?, ?, ?)
    `, [eventId, userId, response]);
    return result;
  }

  /**
   * Get a user's response to an event
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Response object or null
   */
  static async getUserEventResponse(eventId, userId) {
    const db = await getDb();
    const response = await db.get(`
      SELECT response FROM event_responses 
      WHERE event_id = ? AND user_id = ?
    `, [eventId, userId]);
    return response;
  }

  /**
   * Get pending join requests for a group (for group creators)
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of pending member requests
   */
  static async getPendingRequests(groupId) {
    const db = await getDb();
    const requests = await db.all(`
      SELECT u.id, u.first_name, u.last_name, u.avatar, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND gm.status = 'pending'
      ORDER BY gm.joined_at DESC
    `, [groupId]);
    return requests;
  }
}