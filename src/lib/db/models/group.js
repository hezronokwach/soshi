// src/lib/db/models/group.js
import { getDb } from '../sqlite.js';

export class Group {
  /**
   * Create a new group
   * @param {string} title - Group title
   * @param {string} description - Group description
   * @param {number} creatorId - ID of the user creating the group
   * @returns {number} - ID of the created group
   */
  static create(title, description, creatorId) {
    const db = getDb();

    // Create the group
    const stmt = db.prepare(`
      INSERT INTO groups (title, description, creator_id)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(title, description, creatorId);
    const groupId = result.lastInsertRowid;

    // Automatically add creator as accepted member
    const memberStmt = db.prepare(`
      INSERT INTO group_members (group_id, user_id, status)
      VALUES (?, ?, 'accepted')
    `);
    memberStmt.run(groupId, creatorId);

    return groupId;
  }

  /**
   * Get all groups with member counts
   * @returns {Array} - Array of group objects
   */
  static getAll() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT g.*, u.first_name, u.last_name, u.avatar,
             COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'accepted'
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    return stmt.all();
  }

  /**
   * Get a group by ID
   * @param {number} id - Group ID
   * @returns {Object|null} - Group object or null
   */
  static getById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT g.*, u.first_name, u.last_name, u.avatar
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      WHERE g.id = ?
    `);
    return stmt.get(id);
  }

  /**
   * Get all members of a group
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of member objects
   */
  static getMembers(groupId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.avatar, 
             gm.status, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at DESC
    `);
    return stmt.all(groupId);
  }

  /**
   * Invite/Add a user to a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID to invite
   * @param {number|null} invitedBy - ID of user sending invitation
   * @returns {Object} - Database result
   */
  static inviteUser(groupId, userId, invitedBy) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO group_members (group_id, user_id, status, invited_by)
      VALUES (?, ?, 'pending', ?)
    `);
    return stmt.run(groupId, userId, invitedBy);
  }

  /**
   * Accept a group invitation
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Object} - Database result
   */
  static acceptInvitation(groupId, userId) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE group_members 
      SET status = 'accepted', joined_at = CURRENT_TIMESTAMP
      WHERE group_id = ? AND user_id = ?
    `);
    return stmt.run(groupId, userId);
  }

  /**
   * Decline/Remove a group invitation or membership
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Object} - Database result
   */
  static declineInvitation(groupId, userId) {
    const db = getDb();
    const stmt = db.prepare(`
      DELETE FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `);
    return stmt.run(groupId, userId);
  }

  /**
   * Check if a user is a member of a group
   * @param {number} groupId - Group ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Membership status or null
   */
  static isMember(groupId, userId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT status FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `);
    return stmt.get(groupId, userId);
  }

  /**
   * Get groups a user belongs to
   * @param {number} userId - User ID
   * @returns {Array} - Array of group objects
   */
  static getUserGroups(userId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT g.*, COUNT(gm2.user_id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.status = 'accepted'
      WHERE gm.user_id = ? AND gm.status = 'accepted'
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    return stmt.all(userId);
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
  static createPost(groupId, userId, content, imagePath = null) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO group_posts (group_id, user_id, content, image_path)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(groupId, userId, content, imagePath);
    return result.lastInsertRowid;
  }

  /**
   * Get all posts in a group
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of post objects
   */
  static getPosts(groupId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT gp.*, u.first_name, u.last_name, u.avatar
      FROM group_posts gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.group_id = ?
      ORDER BY gp.created_at DESC
    `);
    return stmt.all(groupId);
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
  static createEvent(groupId, creatorId, title, description, eventDate) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO group_events (group_id, creator_id, title, description, event_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(groupId, creatorId, title, description, eventDate);
    return result.lastInsertRowid;
  }

  /**
   * Get all events in a group
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of event objects with response counts
   */
  static getEvents(groupId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT ge.*, u.first_name, u.last_name,
             COUNT(CASE WHEN er.response = 'going' THEN 1 END) as going_count,
             COUNT(CASE WHEN er.response = 'not_going' THEN 1 END) as not_going_count
      FROM group_events ge
      JOIN users u ON ge.creator_id = u.id
      LEFT JOIN event_responses er ON ge.id = er.event_id
      WHERE ge.group_id = ?
      GROUP BY ge.id
      ORDER BY ge.event_date ASC
    `);
    return stmt.all(groupId);
  }

  /**
   * Respond to an event
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID
   * @param {string} response - 'going' or 'not_going'
   * @returns {Object} - Database result
   */
  static respondToEvent(eventId, userId, response) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO event_responses (event_id, user_id, response)
      VALUES (?, ?, ?)
    `);
    return stmt.run(eventId, userId, response);
  }

  /**
   * Get a user's response to an event
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Response object or null
   */
  static getUserEventResponse(eventId, userId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT response FROM event_responses 
      WHERE event_id = ? AND user_id = ?
    `);
    return stmt.get(eventId, userId);
  }

  /**
   * Get pending join requests for a group (for group creators)
   * @param {number} groupId - Group ID
   * @returns {Array} - Array of pending member requests
   */
  static getPendingRequests(groupId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.avatar, gm.joined_at
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ? AND gm.status = 'pending'
      ORDER BY gm.joined_at DESC
    `);
    return stmt.all(groupId);
  }
}