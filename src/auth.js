/**
 * User authorization and authentication utilities
 */

/**
 * Checks if a user has root privileges
 * @param {Object} env - Environment variables containing ROOT_USERS configuration
 * @param {string} userEmail - Email of the user to check
 * @returns {boolean} Whether the user has root privileges
 */
export function isRootUser(env, userEmail) {
  const rootUsers = env.ROOT_USERS ? env.ROOT_USERS.split(',').map(email => email.trim()) : [];
  return rootUsers.includes(userEmail);
}

/**
 * Middleware to ensure user is authenticated via Cloudflare Access
 * @param {Object} c - Request context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} Response or continues to next middleware
 */
export async function requireAuth(c, next) {
  const userEmail = c.req.headers.get('cf-access-authenticated-user-email');
  
  if (!userEmail) {
    return c.text('Unauthorized: No user email found', 401);
  }
  
  // Add user info to context
  c.set('userEmail', userEmail);
  await next();
}

/**
 * Middleware to ensure user has root privileges
 * @param {Object} c - Request context
 * @param {Function} next - Next middleware function
 * @returns {Promise<Response>} Response or continues to next middleware
 */
export async function requireRoot(c, next) {
  const userEmail = c.get('userEmail');
  
  if (!isRootUser(c.env, userEmail)) {
    return c.json({ error: 'Unauthorized: Only root users can perform this action' }, 403);
  }
  
  await next();
} 