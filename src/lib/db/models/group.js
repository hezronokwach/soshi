// src/lib/db/models/group.js
import db from '../sqlite.js';

export class Group {
  static async create(title, description, creatorId) {
    const stmt = db.prepare(`
      INSERT INTO groups (title, description, creator_id)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(title, description, creatorId);

    // Automatically add creator as accepted member
    const memberStmt = db.prepare(`
      INSERT INTO group_members (group_id, user_id, status)
      VALUES (?, ?, 'accepted')
    `);
    memberStmt.run(result.lastInsertRowid, creatorId);

    return result.lastInsertRowid;
  }

  static async getAll() {
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

  static async getById(id) {
    const stmt = db.prepare(`
      SELECT g.*, u.first_name, u.last_name, u.avatar
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.id
      WHERE g.id = ?
    `);
    return stmt.get(id);
  }

  static async getMembers(groupId) {
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

  static async inviteUser(groupId, userId, invitedBy) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO group_members (group_id, user_id, status, invited_by)
      VALUES (?, ?, 'pending', ?)
    `);
    return stmt.run(groupId, userId, invitedBy);
  }

  static async acceptInvitation(groupId, userId) {
    const stmt = db.prepare(`
      UPDATE group_members 
      SET status = 'accepted', joined_at = CURRENT_TIMESTAMP
      WHERE group_id = ? AND user_id = ?
    `);
    return stmt.run(groupId, userId);
  }

  static async declineInvitation(groupId, userId) {
    const stmt = db.prepare(`
      DELETE FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `);
    return stmt.run(groupId, userId);
  }

  static async isMember(groupId, userId) {
    const stmt = db.prepare(`
      SELECT status FROM group_members 
      WHERE group_id = ? AND user_id = ?
    `);
    return stmt.get(groupId, userId);
  }

  static async getUserGroups(userId) {
    const stmt = db.prepare(`
      SELECT g.*, COUNT(gm.user_id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.status = 'accepted'
      WHERE gm.user_id = ? AND gm.status = 'accepted'
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    return stmt.all(userId);
  }

  // Group Posts
  static async createPost(groupId, userId, content, imagePath = null) {
    const stmt = db.prepare(`
      INSERT INTO group_posts (group_id, user_id, content, image_path)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(groupId, userId, content, imagePath);
  }

  static async getPosts(groupId) {
    const stmt = db.prepare(`
      SELECT gp.*, u.first_name, u.last_name, u.avatar
      FROM group_posts gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.group_id = ?
      ORDER BY gp.created_at DESC
    `);
    return stmt.all(groupId);
  }

  // Group Events
  static async createEvent(groupId, creatorId, title, description, eventDate) {
    const stmt = db.prepare(`
      INSERT INTO group_events (group_id, creator_id, title, description, event_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(groupId, creatorId, title, description, eventDate);
  }

  static async getEvents(groupId) {
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

  static async respondToEvent(eventId, userId, response) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO event_responses (event_id, user_id, response)
      VALUES (?, ?, ?)
    `);
    return stmt.run(eventId, userId, response);
  }

  static async getUserEventResponse(eventId, userId) {
    const stmt = db.prepare(`
      SELECT response FROM event_responses 
      WHERE event_id = ? AND user_id = ?
    `);
    return stmt.get(eventId, userId);
  }
}