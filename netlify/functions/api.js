// Netlify serverless function to handle API requests
const express = require('express');
const serverless = require('serverless-http');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

// Initialize Express app
const app = express();

// Import database initialization script
const { initializeDatabase } = require('./prisma-migrate');

// Initialize Prisma client with better error handling
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully');
  
  // Initialize database schema and tables if needed
  // This runs asynchronously to avoid blocking the server startup
  initializeDatabase()
    .then(result => console.log('Database initialization result:', result))
    .catch(error => console.error('Database initialization error:', error));
    
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  throw error; // Re-throw to ensure we don't proceed with a broken database connection
}

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests with detailed information
app.use((req, res, next) => {
  console.log('API Request:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    body: req.body,
    headers: req.headers,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Define API routes - handle both direct and nested paths

// Helper function to log database URL (with credentials hidden)
function getRedactedDatabaseUrl() {
  try {
    const url = process.env.DATABASE_URL || 'No DATABASE_URL set';
    // Replace any credentials in the URL with [REDACTED]
    return url.replace(/\/\/[^:]+:[^@]+@/, '//[REDACTED]:[REDACTED]@');
  } catch (error) {
    return 'Error getting DATABASE_URL';
  }
}

// Log database connection info on startup
console.log('Database connection info:', {
  provider: 'postgresql',
  url: getRedactedDatabaseUrl(),
  netlifyEnv: process.env.NETLIFY || 'not set'
});

// Main API routes with simplified paths
// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    console.log('Fetching all tasks');
    const tasks = await prisma.task.findMany();
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks: ' + error.message });
  }
});

// Fallback route for the root path
app.get('/', (req, res) => {
  res.json({ status: 'Kanban API is running' });
});

// POST - Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    console.log('Creating new task with body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Validate request body
    if (!req.body) {
      console.error('No request body received');
      return res.status(400).json({ error: 'Request body is required' });
    }
    
    if (!req.body.content) {
      console.error('Content field missing in request body');
      return res.status(400).json({ error: 'Content field is required' });
    }
    
    // Generate a unique ID for the task
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('Generated task ID:', taskId);
    
    // Prepare data for Prisma
    const taskData = {
      id: taskId,
      content: req.body.content,
      column: req.body.column || 'TODO',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Task data to be inserted:', taskData);
    
    // Create the task in the database
    const task = await prisma.task.create({ data: taskData });
    
    console.log('Task created successfully:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    console.error('Error stack:', error.stack);
    
    // Check for specific Prisma errors
    if (error.code) {
      console.error('Prisma error code:', error.code);
    }
    
    // Send detailed error response
    res.status(500).json({ 
      error: 'Failed to create task', 
      message: error.message,
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE - Remove a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting task: ${id}`);
    
    await prisma.task.delete({
      where: { id }
    });
    
    console.log('Task deleted successfully');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task: ' + error.message });
  }
});

// PUT - Move a task to a different column
app.put('/api/tasks/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { column } = req.body;
    
    console.log(`Moving task ${id} to ${column}`);
    
    if (!column) {
      return res.status(400).json({ error: 'Column is required' });
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: { 
        column,
        updatedAt: new Date()
      }
    });
    
    console.log('Task moved successfully:', task);
    res.json(task);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task: ' + error.message });
  }
});

// Add a catch-all route for debugging purposes
app.all('*', (req, res) => {
  console.log('Catch-all route hit:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: getRedactedDatabaseUrl(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
