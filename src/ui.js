import { html } from 'hono/html';

/**
 * UI rendering functions for the release management dashboard
 */

/**
 * Renders a single release row in the releases list
 * @param {Object} release - Release data including tickets
 * @param {boolean} isRoot - Whether the current user has root privileges
 * @returns {string} HTML string for the release row
 */
export function renderReleaseRow(release, isRoot) {
  const statusEmoji = release.status === 'GO' ? '✅' : '❌';
  const statusClass = release.status === 'GO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
  
  // Parse tickets if they exist
  const tickets = release.excluded_tickets ? release.excluded_tickets.split(',').map((key, index) => ({
    key,
    summary: release.ticket_summaries ? release.ticket_summaries.split(',')[index] : null,
    url: release.ticket_urls ? release.ticket_urls.split(',')[index] : null
  })) : [];

  return html`
    <div class="border-b border-slate-200 py-4 flex justify-between items-start gap-4 last:border-b-0">
      <div class="flex-1">
        <div class="flex items-center gap-4 mb-2">
          <span class="font-medium text-slate-900">
            ${new Date(release.release_date).toLocaleDateString()}
          </span>
          <span class="${statusClass} px-2.5 py-0.5 rounded-full text-sm font-medium">
            ${statusEmoji} ${release.status.replace('_', ' ')}
          </span>
        </div>

        <div class="text-sm text-slate-500">
          Created by ${release.created_by}
        </div>

        ${release.status === 'NO_GO' ? html`
          <div class="mt-4 bg-red-50 p-4 rounded-lg">
            <h3 class="font-semibold text-red-800 mb-2">NO GO Explanation:</h3>
            <p class="text-red-700">${release.explanation}</p>
          </div>
        ` : ''}

        ${release.status === 'GO' && tickets.length > 0 ? html`
          <div class="mt-4">
            <h3 class="font-semibold text-slate-700 mb-2">Excluded Tickets:</h3>
            <div class="space-y-2">
              ${tickets.map(ticket => html`
                <div class="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
                  <a href="${ticket.url}" 
                     target="_blank"
                     class="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    ${ticket.key}
                  </a>
                  ${ticket.summary ? html`
                    <span class="text-slate-600 border-l border-slate-300 pl-2 ml-2">${ticket.summary}</span>
                  ` : ''}
                </div>
              `)}
            </div>
          </div>
        ` : ''}
      </div>
      ${isRoot ? html`
        <button 
          class="text-red-600 hover:text-red-800 focus:outline-none"
          hx-delete="/api/releases/${release.id}"
          hx-confirm="Are you sure you want to delete this release?"
          hx-target="#releases-list"
          hx-swap="outerHTML">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Renders the main dashboard page
 * @param {string} userEmail - Email of the current user
 * @param {boolean} isRoot - Whether the current user has root privileges
 * @param {string} appName - Name of the application from environment
 * @returns {string} HTML string for the entire page
 */
export function renderDashboard(userEmail, isRoot, appName) {
  return html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Greenlight - Release Management</title>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/></svg>">
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
      <style>
        body { font-family: 'Inter', sans-serif; }
        .htmx-indicator {
          opacity: 0;
          transition: opacity 200ms ease-in;
        }
        .htmx-request .htmx-indicator {
          opacity: 1;
        }
        .htmx-request.htmx-indicator {
          opacity: 1;
        }
      </style>
    </head>
    <body class="bg-gray-50">
      <div class="container mx-auto px-4 py-8 max-w-5xl">
        <div class="flex justify-between items-center mb-8">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h1 class="text-4xl font-bold text-gray-900">Greenlight</h1>
                <div class="text-sm text-gray-500">for ${appName}</div>
              </div>
            </div>
            <p class="text-gray-600">Release Management Dashboard</p>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-600">Logged in as:</div>
            <div class="font-medium text-gray-800">${userEmail}</div>
            ${isRoot ? html`<div class="text-sm text-emerald-600 mt-1 font-medium">Root User</div>` : ''}
          </div>
        </div>
        
        ${isRoot ? renderReleaseForm() : ''}
        
        <!-- Releases List -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-2xl font-semibold mb-6">Recent Release Decisions</h2>
          <div id="releases-list" hx-get="/api/releases" hx-trigger="load">
            Loading releases...
          </div>
        </div>
      </div>
      
      <script>
        // Function to get next Sunday's date in YYYY-MM-DD format
        function getNextSunday() {
          const today = new Date();
          const daysUntilSunday = 7 - today.getDay();
          const nextSunday = new Date(today);
          nextSunday.setDate(today.getDate() + daysUntilSunday);
          return nextSunday.toISOString().split('T')[0];
        }

        // Set default release date to next Sunday
        document.addEventListener('DOMContentLoaded', () => {
          const releaseDateInput = document.querySelector('input[name="release_date"]');
          if (releaseDateInput) {
            releaseDateInput.value = getNextSunday();
          }
        });

        // Function to validate JIRA ticket
        function validateJiraTicket(ticketKey) {
          return fetch('/api/validate-jira/' + encodeURIComponent(ticketKey))
            .then(response => response.json())
            .then(data => data.valid)
            .catch(error => {
              console.error('Error validating JIRA ticket:', error);
              return false;
            });
        }

        // Function to add ticket field
        function addTicketField() {
          const container = document.getElementById('ticket-inputs');
          const div = document.createElement('div');
          div.className = 'flex gap-2';
          
          const input = document.createElement('input');
          input.type = 'text';
          input.name = 'tickets';
          input.placeholder = 'e.g., JIRA-123';
          input.className = 'w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 focus:border-emerald-500';
          
          // Add validation on blur
          input.addEventListener('blur', () => updateTicketValidation(input));
          
          const button = document.createElement('button');
          button.type = 'button';
          button.onclick = function() { this.parentElement.remove(); };
          button.className = 'px-2 text-red-600 hover:text-red-800 focus:outline-none flex-shrink-0';
          button.innerHTML = 
            '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' +
            '</svg>';
          
          div.appendChild(input);
          div.appendChild(button);
          container.appendChild(div);
        }

        // Function to update ticket validation UI
        function updateTicketValidation(input) {
          const ticketKey = input.value.trim();
          if (!ticketKey) return;

          // Add loading state
          input.classList.add('bg-gray-50');
          input.classList.add('opacity-50');
          input.disabled = true;

          validateJiraTicket(ticketKey).then(isValid => {
            input.classList.remove('bg-gray-50', 'opacity-50');
            input.disabled = false;

            // Remove any existing validation UI
            const existingValidation = input.parentElement.querySelector('.validation-icon');
            if (existingValidation) {
              existingValidation.remove();
            }

            // Add validation UI
            const validationIcon = document.createElement('div');
            validationIcon.className = 'validation-icon flex-shrink-0';
            
            if (isValid) {
              validationIcon.innerHTML = 
                '<svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' +
                '</svg>';
              input.classList.remove('border-red-300');
              input.classList.add('border-emerald-300');
              input.dataset.valid = 'true';

              // Check if this is the last input and it's valid
              const allInputs = document.querySelectorAll('#ticket-inputs input[name="tickets"]');
              const lastInput = allInputs[allInputs.length - 1];
              if (input === lastInput && ticketKey) {
                addTicketField();
              }
            } else {
              validationIcon.innerHTML = 
                '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
                '</svg>';
              input.classList.remove('border-emerald-300');
              input.classList.add('border-red-300');
              input.dataset.valid = 'false';
            }

            // Insert validation icon
            input.parentElement.appendChild(validationIcon);
          });
        }

        // Attach validation to the initial ticket input field
        document.addEventListener('DOMContentLoaded', () => {
          const initialTicketInput = document.querySelector('input[name="tickets"]');
          if (initialTicketInput) {
            initialTicketInput.addEventListener('blur', () => updateTicketValidation(initialTicketInput));
          }
        });

        // Function to validate form
        function validateForm(form) {
          let isValid = true;
          const releaseDate = form.querySelector('[name="release_date"]');
          const status = form.querySelector('[name="status"]');
          const releaseDateError = document.getElementById('release-date-error');
          const statusError = document.getElementById('status-error');
          
          // Reset error messages
          releaseDateError.classList.add('hidden');
          statusError.classList.add('hidden');
          
          // Clear all existing ticket errors
          form.querySelectorAll('.ticket-error').forEach(error => error.remove());
          
          // Validate release date
          if (!releaseDate.value) {
            releaseDateError.classList.remove('hidden');
            isValid = false;
          }
          
          // Validate status
          if (!status.value) {
            statusError.classList.remove('hidden');
            isValid = false;
          }

          // Validate JIRA tickets
          const ticketInputs = form.querySelectorAll('input[name="tickets"]');
          for (const input of ticketInputs) {
            const ticketValue = input.value.trim();
            if (ticketValue && input.dataset.valid !== 'true') {
              let errorMsg = document.createElement('div');
              errorMsg.className = 'text-red-600 text-sm mt-1 ticket-error';
              errorMsg.textContent = input.dataset.valid === undefined ? 
                'Please validate this ticket first by clicking outside the field' : 
                'Invalid JIRA ticket number';
              input.parentElement.appendChild(errorMsg);
              isValid = false;
            }
          }
          
          return isValid;
        }

        // Function to validate and submit form
        function validateAndSubmit(event) {
          event.preventDefault();
          const form = event.target.closest('form');
          if (!validateForm(form)) {
            return false;
          }

          // Show loading indicator
          const loadingIndicator = document.getElementById('loading-indicator');
          loadingIndicator.style.opacity = '1';
          const submitButton = form.querySelector('button[type="submit"]');
          submitButton.disabled = true;

          // Collect form data as JSON
          const ticketInputs = Array.from(form.querySelectorAll('input[name="tickets"]'));
          const tickets = ticketInputs
            .filter(input => input.value.trim() && input.dataset.valid === 'true')
            .map(input => input.value.trim());

          const formData = {
            release_date: form.querySelector('[name="release_date"]').value,
            status: form.querySelector('[name="status"]').value,
            explanation: form.querySelector('[name="explanation"]')?.value || '',
            tickets: tickets
          };

          // Send as JSON
          fetch('/api/releases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
          })
          .then(response => response.text())
          .then(html => {
            // Get the releases list container
            const releasesList = document.getElementById('releases-list');
            
            // Create a temporary container to parse the HTML
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Replace the content and reinitialize HTMX
            releasesList.innerHTML = temp.querySelector('#releases-list').innerHTML;
            htmx.process(releasesList);
            
            // Reset form
            form.reset();
            // Re-initialize form sections
            updateFormSections(form.querySelector('select[name="status"]').value);
            // Hide loading indicator
            loadingIndicator.style.opacity = '0';
            submitButton.disabled = false;
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Failed to submit release decision');
            // Hide loading indicator
            loadingIndicator.style.opacity = '0';
            submitButton.disabled = false;
          });

          return false;
        }

        // Status change handler
        function updateFormSections(status) {
          const noGoSection = document.getElementById('no-go-section');
          const ticketsSection = document.getElementById('tickets-section');
          const explanationField = document.querySelector('textarea[name="explanation"]');
          
          if (status === 'GO') {
            noGoSection.classList.add('hidden');
            ticketsSection.classList.remove('hidden');
            explanationField.removeAttribute('required');
          } else if (status === 'NO_GO') {
            noGoSection.classList.remove('hidden');
            ticketsSection.classList.add('hidden');
            explanationField.setAttribute('required', 'required');
          } else {
            // Hide both sections when no status is selected
            noGoSection.classList.add('hidden');
            ticketsSection.classList.add('hidden');
            explanationField.removeAttribute('required');
          }
        }

        // Status change event listener
        document.querySelector('select[name="status"]').addEventListener('change', function(e) {
          updateFormSections(e.target.value);
        });

        // Initialize form sections based on default status
        document.addEventListener('DOMContentLoaded', function() {
          const statusSelect = document.querySelector('select[name="status"]');
          updateFormSections(statusSelect.value);
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Renders the release creation form
 * @returns {string} HTML string for the form
 */
function renderReleaseForm() {
  return html`
    <!-- New Release Form -->
    <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-6">New Release Decision</h2>
      <form 
        onsubmit="validateAndSubmit(event);"
        class="space-y-6"
      >
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700">
              Release Date
              <span class="text-red-600">*</span>
            </label>
            <input type="date" 
              name="release_date" 
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 focus:border-emerald-500">
            <div class="hidden text-red-600 text-sm mt-1" id="release-date-error">
              Please select a release date
            </div>
          </div>
          
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-slate-700">
              Status
              <span class="text-red-600">*</span>
            </label>
            <select name="status" 
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 focus:border-emerald-500">
              <option value="">Select a status...</option>
              <option value="GO">✅ GO</option>
              <option value="NO_GO">❌ NO GO</option>
            </select>
            <div class="hidden text-red-600 text-sm mt-1" id="status-error">
              Please select a status
            </div>
          </div>
        </div>
        
        <div id="no-go-section" class="hidden space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">
            NO GO Explanation
            <span class="text-red-600">*</span>
          </label>
          <textarea name="explanation"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 focus:border-emerald-500 h-32"
            placeholder="Please provide a detailed explanation for the NO GO decision..."></textarea>
        </div>
        
        <div id="tickets-section" class="hidden space-y-1.5">
          <label class="block text-sm font-medium text-slate-700">Excluded JIRA Tickets</label>
          <div class="space-y-3" id="ticket-inputs">
            <div class="flex gap-2">
              <input type="text" name="tickets" placeholder="e.g., JIRA-123"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 focus:border-emerald-500">
            </div>
          </div>
          <p class="mt-1 text-sm text-slate-500">Enter JIRA ticket IDs for tickets being excluded from this release</p>
        </div>
        
        <div class="relative">
          <button type="submit"
            class="w-full px-6 py-3 text-lg font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all relative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            hx-indicator="#loading-indicator">
            <span>Submit Release Decision</span>
            <div id="loading-indicator" 
                 class="htmx-indicator absolute inset-0 flex items-center justify-center bg-emerald-600 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-white font-medium">Submitting...</span>
              </div>
            </div>
          </button>
        </div>
      </form>
    </div>
  `;
} 