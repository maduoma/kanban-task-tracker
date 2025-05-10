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

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Define API routes - handle both direct and nested paths

// Direct path for local development
app.get('/api/tasks', async (req, res) => {
  try {
    console.log('GET /api/tasks - Fetching all tasks');
    const tasks = await prisma.task.findMany();
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Nested path for when accessed through Netlify function path
app.get('/api/api/tasks', async (req, res) => {
  try {
    console.log('GET /api/api/tasks - Fetching all tasks (nested path)');
    const tasks = await prisma.task.findMany();
    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST handler for direct path
app.post('/api/tasks', async (req, res) => {
  try {
    console.log('POST /api/tasks - Creating new task with body:', req.body);
    const { content, column } = req.body;
    
    if (!content) {
      console.log('Content is required');
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const task = await prisma.task.create({
      data: {
        content,
        column: column || 'TODO'
      }
    });
    
    console.log('Created new task:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// POST handler for nested path
app.post('/api/api/tasks', async (req, res) => {
  try {
    console.log('POST /api/api/tasks (nested path) - Creating new task with body:', req.body);
    const { content, column } = req.body;
    
    if (!content) {
      console.log('Content is required');
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const task = await prisma.task.create({
      data: {
        content,
        column: column || 'TODO'
      }
    });
    
    console.log('Created new task:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT handler for direct path
app.put('/api/tasks/:id', async (req, res) => {
  try {
    console.log(`PUT /api/tasks/${req.params.id} - Updating task with body:`, req.body);
    const { id } = req.params;
    const { column } = req.body;
    
    if (!column) {
      console.log('Column is required');
      return res.status(400).json({ error: 'Column is required' });
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: { column }
    });
    console.log('Updated task:', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT handler for nested path
app.put('/api/api/tasks/:id', async (req, res) => {
  try {
    console.log(`PUT /api/api/tasks/${req.params.id} (nested path) - Updating task with body:`, req.body);
    const { id } = req.params;
    const { column } = req.body;
    
    if (!column) {
      console.log('Column is required');
      return res.status(400).json({ error: 'Column is required' });
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: { column }
    });
    console.log('Updated task:', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add endpoint for moving tasks between columns - direct path
app.put('/api/tasks/:id/move', async (req, res) => {
  try {
    console.log(`PUT /api/tasks/${req.params.id}/move - Moving task with body:`, req.body);
    const { id } = req.params;
    const { column } = req.body;
    
    if (!column) {
      console.log('Column is required');
      return res.status(400).json({ error: 'Column is required' });
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: { column }
    });
    console.log('Moved task:', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add endpoint for moving tasks between columns - nested path
app.put('/api/api/tasks/:id/move', async (req, res) => {
  try {
    console.log(`PUT /api/api/tasks/${req.params.id}/move (nested path) - Moving task with body:`, req.body);
    const { id } = req.params;
    const { column } = req.body;
    
    if (!column) {
      console.log('Column is required');
      return res.status(400).json({ error: 'Column is required' });
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: { column }
    });
    console.log('Moved task:', task);
    
    res.json(task);
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete handler - direct path
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    console.log(`DELETE /api/tasks/${req.params.id} - Deleting task`);
    const { id } = req.params;
    
    await prisma.task.delete({
      where: { id }
    });
    console.log('Task deleted successfully');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete handler - nested path
app.delete('/api/api/tasks/:id', async (req, res) => {
  try {
    console.log(`DELETE /api/api/tasks/${req.params.id} (nested path) - Deleting task`);
    const { id } = req.params;
    
    await prisma.task.delete({
      where: { id }
    });
    console.log('Task deleted successfully');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the serverless function
module.exports.handler = serverless(app);
