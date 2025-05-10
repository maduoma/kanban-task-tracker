// Netlify serverless function to handle API requests
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

// Initialize Express app
const app = express();

// In-memory data store that persists between function invocations
// This works because Netlify keeps the function container alive between requests
let tasks = [
  { id: '1', content: 'Example Task 1', column: 'TODO' },
  { id: '2', content: 'Example Task 2', column: 'IN_PROGRESS' },
  { id: '3', content: 'Example Task 3', column: 'DONE' }
];

// Helper functions for task operations
const taskStore = {
  findAll: () => tasks,
  create: (data) => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: data.content,
      column: data.column || 'TODO'
    };
    tasks.push(newTask);
    return newTask;
  },
  update: (id, data) => {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) throw new Error('Task not found');
    
    tasks[taskIndex] = { ...tasks[taskIndex], ...data };
    return tasks[taskIndex];
  },
  delete: (id) => {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) throw new Error('Task not found');
    
    const deletedTask = tasks[taskIndex];
    tasks = tasks.filter(task => task.id !== id);
    return deletedTask;
  }
};

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
    const allTasks = taskStore.findAll();
    console.log(`Found ${allTasks.length} tasks`);
    res.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Nested path for when accessed through Netlify function path
app.get('/api/api/tasks', async (req, res) => {
  try {
    console.log('GET /api/api/tasks - Fetching all tasks (nested path)');
    const allTasks = taskStore.findAll();
    console.log(`Found ${allTasks.length} tasks`);
    res.json(allTasks);
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
    
    const task = taskStore.create({
      content,
      column: column || 'TODO'
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
    
    const task = taskStore.create({
      content,
      column: column || 'TODO'
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
    
    const task = taskStore.update(id, { column });
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
    
    const task = taskStore.update(id, { column });
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
    
    const task = taskStore.update(id, { column });
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
    
    const task = taskStore.update(id, { column });
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
    
    const deletedTask = taskStore.delete(id);
    console.log('Deleted task:', deletedTask);
    
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
    
    const deletedTask = taskStore.delete(id);
    console.log('Deleted task:', deletedTask);
    
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
