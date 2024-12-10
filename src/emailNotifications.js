import { EmailMessage } from 'cloudflare:email';

/**
 * Sends an email notification about a release action
 * @param {Object} env - Environment variables containing email configuration
 * @param {Object} release - Release details including status and tickets
 * @param {string} action - The action performed on the release (e.g., 'Created', 'Updated')
 * @param {string} userEmail - Email of the user who performed the action
 */
export async function sendNotification(env, release, action, userEmail) {
  const notificationTo = env.NOTIFICATION_EMAIL_TO;
  if (!notificationTo) return;

  const statusEmoji = release.status === 'GO' ? '✅' : '❌';
  const statusColor = release.status === 'GO' ? '#059669' : '#DC2626'; // emerald-600 and red-600
  const typeColor = release.release_type === 'HOTFIX' ? '#D97706' : '#2563EB'; // amber-600 and blue-600
  const subject = `${statusEmoji} ${env.APP_NAME} Release ${action}: ${release.status.replace('_', ' ')} ${release.release_type} for ${release.release_date}`;
  
  // Parse tickets if they exist
  const tickets = release.excluded_tickets ? release.excluded_tickets.split(',').map((key, index) => ({
    key,
    summary: release.ticket_summaries ? release.ticket_summaries.split(',')[index] : null,
    url: release.ticket_urls ? release.ticket_urls.split(',')[index] : null
  })) : [];

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1F2937;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #F9FAFB;
          }
          .header {
            background-color: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .brand {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #E5E7EB;
          }
          .brand-icon {
            background-color: #059669;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            margin-right: 16px;
          }
          .brand-text {
            display: flex;
            flex-direction: column;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 600;
            color: #059669;
            line-height: 1.2;
          }
          .brand-subtitle {
            font-size: 14px;
            color: #6B7280;
            margin-top: 2px;
          }
          .status-container {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            gap: 8px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 14px;
            color: white;
            background-color: ${statusColor};
          }
          .type-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 14px;
            color: white;
            background-color: ${typeColor};
          }
          .date {
            color: #4B5563;
            margin-left: 16px;
            font-size: 14px;
          }
          .info-row {
            margin: 8px 0;
            color: #4B5563;
          }
          .info-label {
            font-weight: 500;
            color: #1F2937;
          }
          .section {
            background-color: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 16px;
          }
          .ticket {
            padding: 12px;
            background-color: #F3F4F6;
            border-radius: 8px;
            margin-bottom: 8px;
          }
          .ticket-key {
            color: #059669;
            font-weight: 500;
            text-decoration: none;
          }
          .ticket-summary {
            color: #4B5563;
            margin-top: 4px;
            font-size: 14px;
          }
          .explanation {
            padding: 16px;
            background-color: #FEE2E2;
            border-radius: 8px;
            color: #991B1B;
            margin-top: 16px;
          }
          .footer {
            text-align: center;
            font-size: 14px;
            color: #6B7280;
            margin-top: 32px;
          }
          @media only screen and (max-width: 600px) {
            .container {
              padding: 12px;
            }
            .header, .section {
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">
              <div class="brand-icon">🚦</div>
              <div class="brand-text">
                <div class="brand-title">Greenlight</div>
                <div class="brand-subtitle">${env.APP_NAME} Release Management</div>
              </div>
            </div>
            <div class="status-container">
              <span class="status-badge">
                ${statusEmoji} ${release.status.replace('_', ' ')}
              </span>
              <span class="type-badge">
                ${release.release_type}
              </span>
              <span class="date">${new Date(release.release_date).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Action:</span> ${action}
            </div>
            <div class="info-row">
              <span class="info-label">By:</span> ${userEmail}
            </div>
          </div>

          ${release.status === 'NO_GO' ? `
            <div class="section">
              <div class="section-title">NO GO Explanation</div>
              <div class="explanation">
                ${release.explanation}
              </div>
            </div>
          ` : ''}

          ${tickets.length > 0 ? `
            <div class="section">
              <div class="section-title">${release.release_type === 'HOTFIX' ? 'Tickets to Hotfix' : 'Excluded Tickets'}</div>
              ${tickets.map(ticket => `
                <div class="ticket">
                  <a href="${ticket.url}" class="ticket-key" target="_blank">
                    ${ticket.key}
                  </a>
                  ${ticket.summary ? `
                    <div class="ticket-summary">
                      ${ticket.summary}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            This is an automated notification from ${env.APP_NAME} Release Management
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    // Construct the raw email content as a string
    const rawEmail = [
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      `From: ${env.NOTIFICATION_EMAIL_FROM}`,
      `To: ${notificationTo}`,
      `Subject: ${subject}`,
      '',
      htmlBody
    ].join('\r\n');

    // Create a proper EmailMessage object
    const message = new EmailMessage(
      env.NOTIFICATION_EMAIL_FROM,  // from
      notificationTo,             // to
      rawEmail                    // raw email content as string
    );

    await env.NOTIFICATIONS.send(message);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
} 