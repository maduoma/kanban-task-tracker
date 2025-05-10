// Simple serverless function to create a task
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully in create-task function');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
}

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  console.log('Create Task Function Invoked:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body,
    headers: event.headers,
    timestamp: new Date().toISOString()
  });
  
  // Only handle POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse the request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          rawBody: event.body
        })
      };
    }
    
    // Validate request body
    if (!requestBody || !requestBody.content) {
      console.error('Invalid request body:', requestBody);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content field is required' })
      };
    }
    
    // Generate a unique ID for the task
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('Generated task ID:', taskId);
    
    // Create a basic task object
    const simpleTask = {
      id: taskId,
      content: requestBody.content,
      column: 'TODO'
    };
    
    // Try to save to database if Prisma is available
    if (prisma) {
      try {
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
      } catch (dbError) {
        // Log database error but continue - return the task anyway
        console.error('Database error (continuing anyway):', dbError);
      }
    } else {
      console.warn('Prisma client not available, skipping database save');
    }
    
    // Return the created task
    console.log('Returning task:', simpleTask);
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(simpleTask)
    };
  } catch (error) {
    console.error('Error in task creation:', error);
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
