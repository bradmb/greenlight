import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth, requireRoot } from './auth';
import {
  handleDashboard,
  handleGetReleases,
  handleCreateRelease,
  handleDeleteRelease,
  handleValidateJiraTicket
} from './routes';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Authentication middleware
app.use('*', requireAuth);

// UI Routes
app.get('/', handleDashboard);

// API Routes
app.get('/api/releases', handleGetReleases);
app.post('/api/releases', handleCreateRelease);
app.delete('/api/releases/:id', requireRoot, handleDeleteRelease);
app.get('/api/validate-jira/:ticketKey', handleValidateJiraTicket);

export default app; 