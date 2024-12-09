/**
 * Database operations and schema management
 */

/**
 * Initializes the database schema if not already initialized
 * @param {Object} db - Database connection object
 * @param {Object} env - Environment object containing APP_STATE KV binding
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export async function initializeDatabase(db, env) {
  try {
    // Check if database is already initialized
    const isInitialized = await env.APP_STATE.get('DB_INITIALIZED');
    if (isInitialized === 'true') {
      return true;
    }

    console.log('Initializing database schema...');

    // Create releases table with soft delete
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS releases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        release_date DATE NOT NULL,
        status TEXT CHECK(status IN ('GO', 'NO_GO')) NOT NULL,
        explanation TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT,
        updated_at DATETIME,
        deleted_at DATETIME,
        deleted_by TEXT
      )
    `).run();

    // Create excluded tickets table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS excluded_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        release_id INTEGER NOT NULL,
        ticket_key TEXT NOT NULL,
        ticket_summary TEXT,
        ticket_url TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (release_id) REFERENCES releases(id)
      )
    `).run();

    // Mark database as initialized
    await env.APP_STATE.put('DB_INITIALIZED', 'true');
    console.log('Database schema initialized successfully');

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Fetches recent releases with their associated tickets
 * @param {Object} db - Database connection object
 * @param {number} limit - Maximum number of releases to fetch
 * @returns {Promise<Array>} List of releases with their tickets
 */
export async function fetchRecentReleases(db, limit = 10) {
  try {
    return await db.prepare(`
      SELECT r.*, 
             GROUP_CONCAT(et.ticket_key) as excluded_tickets,
             GROUP_CONCAT(et.ticket_summary) as ticket_summaries,
             GROUP_CONCAT(et.ticket_url) as ticket_urls
      FROM releases r
      LEFT JOIN excluded_tickets et ON r.id = et.release_id
      WHERE r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ?
    `).bind(limit).all();
  } catch (error) {
    console.error('Error fetching releases:', error);
    throw error;
  }
}

/**
 * Fetches a single release with its associated tickets
 * @param {Object} db - Database connection object
 * @param {number} releaseId - ID of the release to fetch
 * @returns {Promise<Object|null>} Release with tickets or null if not found
 */
export async function fetchReleaseById(db, releaseId) {
  try {
    const result = await db.prepare(`
      SELECT r.*, 
             GROUP_CONCAT(et.ticket_key) as excluded_tickets,
             GROUP_CONCAT(et.ticket_summary) as ticket_summaries,
             GROUP_CONCAT(et.ticket_url) as ticket_urls
      FROM releases r
      LEFT JOIN excluded_tickets et ON r.id = et.release_id
      WHERE r.id = ?
      GROUP BY r.id
    `).bind(releaseId).first();
    
    return result || null;
  } catch (error) {
    console.error('Error fetching release:', error);
    throw error;
  }
}

/**
 * Creates a new release with optional excluded tickets
 * @param {Object} db - Database connection object
 * @param {Object} release - Release details
 * @param {Array} tickets - Array of ticket objects with details
 * @param {string} userEmail - Email of the user creating the release
 * @returns {Promise<Object>} Created release with its ID and tickets
 */
export async function createRelease(db, release, tickets, userEmail) {
  try {
    const result = await db.prepare(
      'INSERT INTO releases (release_date, status, explanation, created_by) VALUES (?, ?, ?, ?)'
    ).bind(release.release_date, release.status, release.explanation || null, userEmail).run();

    if (!result.success) {
      throw new Error('Failed to create release');
    }

    const releaseId = await db.prepare('SELECT last_insert_rowid() as id').first();

    if (tickets && tickets.length > 0) {
      for (const ticket of tickets) {
        await db.prepare(
          'INSERT INTO excluded_tickets (release_id, ticket_key, ticket_summary, ticket_url, created_by) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          releaseId.id,
          ticket.key,
          ticket.summary,
          ticket.url,
          userEmail
        ).run();
      }
    }

    // Fetch and return the complete release with tickets
    return await fetchReleaseById(db, releaseId.id);
  } catch (error) {
    console.error('Error creating release:', error);
    throw error;
  }
}

/**
 * Soft deletes a release
 * @param {Object} db - Database connection object
 * @param {number} releaseId - ID of the release to delete
 * @param {string} userEmail - Email of the user deleting the release
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export async function deleteRelease(db, releaseId, userEmail) {
  try {
    const result = await db.prepare(`
      UPDATE releases 
      SET deleted_at = CURRENT_TIMESTAMP,
          deleted_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `).bind(userEmail, releaseId).run();

    return result.success;
  } catch (error) {
    console.error('Error deleting release:', error);
    throw error;
  }
} 