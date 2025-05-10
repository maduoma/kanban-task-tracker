// Prisma setup and database initialization for Netlify functions
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client with detailed logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

// Set up query logging for debugging
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});

// Log the DATABASE_URL (with credentials hidden) for debugging
function getRedactedDatabaseUrl() {
  try {
    const url = process.env.DATABASE_URL || 'No DATABASE_URL found';
    // Replace any credentials in the URL with [REDACTED]
    return url.replace(/\/\/[^:]+:[^@]+@/, '://[REDACTED]:[REDACTED]@');
  } catch (error) {
    return 'Error getting DATABASE_URL';
  }
}

// Helper function to check database connection
async function checkDatabaseConnection() {
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    return { connected: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      connected: false, 
      error: error.message,
      code: error.code,
      meta: error.meta
    };
  }
}

// Helper function to check if Task table exists
async function checkTaskTable() {
  try {
    // Try to count tasks to see if table exists
    const count = await prisma.task.count();
    return { exists: true, count };
  } catch (error) {
    console.error('Error checking Task table:', error);
    return { 
      exists: false, 
      error: error.message,
      code: error.code,
      meta: error.meta
    };
  }
}

// Add sample tasks to the database
async function addSampleTasks() {
  const sampleTasks = [
    { content: 'Welcome to Kanban Task Tracker!', column: 'TODO' },
    { content: 'Drag tasks between columns', column: 'IN_PROGRESS' },
    { content: 'Add new tasks using the form above', column: 'DONE' }
  ];

  const results = [];
  
  for (const task of sampleTasks) {
    try {
      const newTask = await prisma.task.create({
        data: {
          id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: task.content,
          column: task.column,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      results.push({ success: true, task: newTask });
    } catch (error) {
      console.error(`Error creating sample task "${task.content}":`, error);
      results.push({ 
        success: false, 
        content: task.content,
        error: error.message 
      });
    }
  }
  
  return results;
}

// Handler for serverless function
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  
  // Parse request body if present
  let requestBody = {};
  if (event.body) {
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      console.error('Error parsing request body:', error);
    }
  }
  
  // Log the request for debugging
  console.log('Prisma Setup Function Invoked:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: requestBody,
    timestamp: new Date().toISOString(),
    databaseUrl: getRedactedDatabaseUrl()
  });

  try {
    // Check database connection
    const connectionStatus = await checkDatabaseConnection();
    
    // Initialize response data
    const responseData = {
      timestamp: new Date().toISOString(),
      databaseUrl: getRedactedDatabaseUrl(),
      environment: process.env.NODE_ENV || 'development',
      connectionStatus,
      action: event.httpMethod === 'POST' ? 'initialize' : 'check',
      environmentVariables: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        NETLIFY: process.env.NETLIFY,
        CONTEXT: process.env.CONTEXT,
        DEPLOY_URL: process.env.DEPLOY_URL
      }
    };
    
    // If database is connected, check Task table
    if (connectionStatus.connected) {
      const taskTableStatus = await checkTaskTable();
      responseData.taskTableStatus = taskTableStatus;
      
      // If POST request and table exists but empty, add sample tasks
      if (event.httpMethod === 'POST' && taskTableStatus.exists && taskTableStatus.count === 0) {
        console.log('Adding sample tasks to empty database...');
        const sampleTaskResults = await addSampleTasks();
        responseData.sampleTaskResults = sampleTaskResults;
        
        // Recheck task count after adding samples
        const updatedTaskCount = await prisma.task.count();
        responseData.updatedTaskCount = updatedTaskCount;
      }
      
      // If POST request and force parameter is true, add sample tasks regardless
      if (event.httpMethod === 'POST' && requestBody.force === true) {
        console.log('Force adding sample tasks...');
        const sampleTaskResults = await addSampleTasks();
        responseData.sampleTaskResults = sampleTaskResults;
        
        // Recheck task count after adding samples
        const updatedTaskCount = await prisma.task.count();
        responseData.updatedTaskCount = updatedTaskCount;
      }
    }
    
    // Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData, null, 2)
    };
  } catch (error) {
    console.error('Error in prisma-setup function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Server error', 
        message: error.message,
        stack: error.stack
      }, null, 2)
    };
  } finally {
    // Always disconnect Prisma client
    await prisma.$disconnect();
  }
};

// Export functions for use in other modules
module.exports = {
  prisma,
  checkDatabaseConnection,
  checkTaskTable,
  addSampleTasks
};
