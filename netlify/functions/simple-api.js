// Simple API function for Kanban Task Tracker
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully in simple-api function');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
}

// In-memory fallback storage if database connection fails
let inMemoryTasks = [];

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

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }
  
  // Log the request for debugging
  console.log('Simple API Function Invoked:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body,
    headers: event.headers,
    timestamp: new Date().toISOString()
  });

  try {
    // Extract the path and parameters
    const path = event.path;
    const segments = path.split('/').filter(segment => segment.length > 0);
    const lastSegment = segments[segments.length - 1];
    
    // GET /api/tasks - Get all tasks
    if (event.httpMethod === 'GET' && lastSegment === 'tasks') {
      let tasks = [];
      
      try {
        if (prisma) {
          tasks = await prisma.task.findMany();
          console.log(`Found ${tasks.length} tasks in database`);
        } else {
          console.warn('Using in-memory tasks as fallback');
          tasks = inMemoryTasks;
        }
      } catch (dbError) {
        console.error('Database error, using in-memory fallback:', dbError);
        tasks = inMemoryTasks;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(tasks)
      };
    }
    
    // POST /api/tasks - Create a new task
    if (event.httpMethod === 'POST' && lastSegment === 'tasks') {
      let requestBody;
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
      
      if (!requestBody || !requestBody.content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Content field is required' })
        };
      }
      
      // Generate a unique ID for the task
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a task object
      const newTask = {
        id: taskId,
        content: requestBody.content,
        column: 'TODO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      try {
        if (prisma) {
          await prisma.task.create({
            data: {
              id: taskId,
              content: requestBody.content,
              column: 'TODO',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log('Task saved to database successfully');
        } else {
          console.warn('Using in-memory storage as fallback');
          inMemoryTasks.push(newTask);
        }
      } catch (dbError) {
        console.error('Database error, using in-memory fallback:', dbError);
        inMemoryTasks.push(newTask);
      }
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newTask)
      };
    }
    
    // DELETE /api/tasks/:id - Delete a task
    if (event.httpMethod === 'DELETE' && segments.includes('tasks') && segments.length > 2) {
      const taskId = segments[segments.length - 1];
      
      try {
        if (prisma) {
          await prisma.task.delete({
            where: { id: taskId }
          });
          console.log(`Task ${taskId} deleted from database`);
        } else {
          console.warn('Using in-memory storage as fallback');
          inMemoryTasks = inMemoryTasks.filter(task => task.id !== taskId);
        }
      } catch (dbError) {
        console.error('Database error, using in-memory fallback:', dbError);
        inMemoryTasks = inMemoryTasks.filter(task => task.id !== taskId);
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Task deleted successfully',
          id: taskId
        })
      };
    }
    
    // PUT /api/tasks/:id/move - Move a task to a different column
    if (event.httpMethod === 'PUT' && segments.includes('move')) {
      const taskId = segments[segments.length - 2];
      
      let requestBody;
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
      
      if (!requestBody || !requestBody.column) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Column field is required' })
        };
      }
      
      const newColumn = requestBody.column;
      let updatedTask;
      
      try {
        if (prisma) {
          updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { 
              column: newColumn,
              updatedAt: new Date()
            }
          });
          console.log(`Task ${taskId} moved to ${newColumn} in database`);
        } else {
          console.warn('Using in-memory storage as fallback');
          const taskIndex = inMemoryTasks.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            inMemoryTasks[taskIndex].column = newColumn;
            inMemoryTasks[taskIndex].updatedAt = new Date().toISOString();
            updatedTask = inMemoryTasks[taskIndex];
          }
        }
      } catch (dbError) {
        console.error('Database error, using in-memory fallback:', dbError);
        const taskIndex = inMemoryTasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          inMemoryTasks[taskIndex].column = newColumn;
          inMemoryTasks[taskIndex].updatedAt = new Date().toISOString();
          updatedTask = inMemoryTasks[taskIndex];
        }
      }
      
      if (!updatedTask) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Task not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedTask)
      };
    }
    
    // Health check endpoint
    if (event.httpMethod === 'GET' && lastSegment === 'health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'ok',
          database: getRedactedDatabaseUrl(),
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // If no route matches, return 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'Route not found',
        path: event.path,
        method: event.httpMethod
      })
    };
    
  } catch (error) {
    console.error('Error in simple-api function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message 
      })
    };
  }
};
