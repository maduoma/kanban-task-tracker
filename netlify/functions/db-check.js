// Database check function to verify database connectivity and view tasks
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully in db-check function');
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
}

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  console.log('DB Check Function Invoked:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    timestamp: new Date().toISOString()
  });

  try {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
    
    // Collect database diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      databaseUrl: getRedactedDatabaseUrl(),
      environment: process.env.NODE_ENV || 'development',
      prismaInitialized: !!prisma,
      tasks: [],
      environmentVariables: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        NETLIFY: process.env.NETLIFY,
        CONTEXT: process.env.CONTEXT,
        DEPLOY_URL: process.env.DEPLOY_URL
      }
    };
    
    // Try to fetch tasks from the database
    if (prisma) {
      try {
        const tasks = await prisma.task.findMany();
        diagnostics.tasks = tasks;
        diagnostics.taskCount = tasks.length;
        diagnostics.databaseConnected = true;
        console.log(`Found ${tasks.length} tasks in database`);
      } catch (dbError) {
        console.error('Database query error:', dbError);
        diagnostics.databaseError = dbError.message;
        diagnostics.databaseConnected = false;
        diagnostics.databaseErrorStack = dbError.stack;
      }
    } else {
      diagnostics.databaseConnected = false;
      diagnostics.prismaError = 'Prisma client not initialized';
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(diagnostics, null, 2)
    };
  } catch (error) {
    console.error('Error in db-check function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server error', 
        message: error.message,
        stack: error.stack
      }, null, 2)
    };
  }
};
