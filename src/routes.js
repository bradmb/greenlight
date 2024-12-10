import { html } from 'hono/html';
import { sendNotification } from './emailNotifications';
import { fetchJiraTicketDetails, validateJiraTicket } from './jiraIntegration';
import { initializeDatabase, fetchRecentReleases, createRelease, deleteRelease } from './database';
import { isRootUser } from './auth';
import { renderDashboard, renderReleaseRow } from './ui';

/**
 * Route handlers for the release management application
 */

/**
 * Renders the main dashboard page
 */
export async function handleDashboard(c) {
  const userEmail = c.get('userEmail');
  const isRoot = isRootUser(c.env, userEmail);
  return c.html(renderDashboard(userEmail, isRoot, c.env.APP_NAME));
}

/**
 * Fetches and renders the list of releases
 */
export async function handleGetReleases(c) {
  try {
    const db = c.env.DB;
    if (!db) {
      throw new Error('Database configuration error');
    }

    // Initialize database if needed
    await initializeDatabase(db, c.env);

    const releases = await fetchRecentReleases(db);
    const isRoot = isRootUser(c.env, c.get('userEmail'));

    // Return the rendered HTML
    return c.html(html`
      ${releases.results.map(release => renderReleaseRow(release, isRoot))}
    `);
  } catch (error) {
    console.error('Error fetching releases:', error);
    return c.html(html`
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        Error loading releases: ${error.message}
      </div>
    `);
  }
}

/**
 * Creates a new release
 */
export async function handleCreateRelease(c) {
  try {
    const json = await c.req.json();
    const userEmail = c.get('userEmail');
    const db = c.env.DB;
    
    // Initialize database if needed
    await initializeDatabase(db, c.env);
    
    const { release_date, status, release_type, explanation, tickets } = json;
    
    // Fetch JIRA details for tickets
    let ticketDetails = [];
    if (tickets && tickets.length > 0) {
      ticketDetails = await Promise.all(
        tickets.map(async (ticket) => {
          if (c.env.JIRA_API_TOKEN && c.env.JIRA_USER_EMAIL) {
            return await fetchJiraTicketDetails(c.env, ticket);
          }
          return {
            key: ticket,
            summary: null,
            url: `${c.env.JIRA_BASE_URL}/browse/${ticket}`
          };
        })
      );
    }
    
    // Create the release with tickets
    const release = await createRelease(
      db,
      { release_date, status, release_type, explanation },
      ticketDetails.filter(Boolean),
      userEmail
    );
    
    // Send notification if configured
    if (c.env.NOTIFICATIONS) {
      await sendNotification(c.env, release, 'Created', userEmail);
    }
    
    // Fetch updated releases list
    const releases = await fetchRecentReleases(db);
    const isRoot = isRootUser(c.env, userEmail);

    // Return the updated releases list HTML
    return c.html(html`
      <div id="releases-list">
        ${releases.results.map(release => renderReleaseRow(release, isRoot))}
      </div>
    `);
  } catch (error) {
    console.error('Error creating release:', error);
    return c.json({ error: error.message }, 500);
  }
}

/**
 * Deletes a release
 */
export async function handleDeleteRelease(c) {
  try {
    const userEmail = c.get('userEmail');
    const db = c.env.DB;
    const releaseId = c.req.param('id');
    
    // Delete the release
    const success = await deleteRelease(db, releaseId, userEmail);
    if (!success) {
      return c.json({ error: 'Failed to delete release' }, 500);
    }

    // Fetch updated releases list
    const releases = await fetchRecentReleases(db);
    const isRoot = isRootUser(c.env, userEmail);

    // Return the updated releases list HTML
    return c.html(html`
      ${releases.results.map(release => renderReleaseRow(release, isRoot))}
    `);
  } catch (error) {
    console.error('Error deleting release:', error);
    return c.json({ error: error.message }, 500);
  }
}

/**
 * Validates a JIRA ticket
 */
export async function handleValidateJiraTicket(c) {
  try {
    const ticketKey = c.req.param('ticketKey');
    const isValid = await validateJiraTicket(c.env, ticketKey);
    return c.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating JIRA ticket:', error);
    return c.json({ valid: false, error: error.message });
  }
} 