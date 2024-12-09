/**
 * Functions for interacting with JIRA API
 */

/**
 * Fetches details of a JIRA ticket
 * @param {Object} env - Environment variables containing JIRA configuration
 * @param {string} ticketKey - The JIRA ticket key (e.g., 'JIRA-123')
 * @returns {Promise<Object|null>} Ticket details or null if fetch fails
 */
export async function fetchJiraTicketDetails(env, ticketKey) {
  try {
    const response = await fetch(`${env.JIRA_BASE_URL}/rest/api/2/issue/${ticketKey}`, {
      headers: {
        'Authorization': `Basic ${btoa(`${env.JIRA_USER_EMAIL}:${env.JIRA_API_TOKEN}`)}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch JIRA ticket ${ticketKey}:`, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return {
      key: ticketKey,
      summary: data.fields.summary,
      url: `${env.JIRA_BASE_URL}/browse/${ticketKey}`
    };
  } catch (error) {
    console.error(`Error fetching JIRA ticket ${ticketKey}:`, error);
    return null;
  }
}

/**
 * Validates if a JIRA ticket exists
 * @param {Object} env - Environment variables containing JIRA configuration
 * @param {string} ticketKey - The JIRA ticket key to validate
 * @returns {Promise<boolean>} Whether the ticket exists
 */
export async function validateJiraTicket(env, ticketKey) {
  try {
    if (!env.JIRA_API_TOKEN || !env.JIRA_USER_EMAIL) {
      return false;
    }

    const response = await fetch(`${env.JIRA_BASE_URL}/rest/api/2/issue/${ticketKey}`, {
      headers: {
        'Authorization': `Basic ${btoa(`${env.JIRA_USER_EMAIL}:${env.JIRA_API_TOKEN}`)}`,
        'Accept': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating JIRA ticket:', error);
    return false;
  }
} 