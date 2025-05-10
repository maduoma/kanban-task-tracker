// Database initialization function to create required tables
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize Prisma client
let prisma;
try {
  prisma = new PrismaClient();
  console.log('Prisma client initialized successfully in db-init function');
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
  
  // Log the request for debugging
  console.log('DB Init Function Invoked:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    timestamp: new Date().toISOString()
  });

  try {
    // Check if this is a POST request to force initialization
    const forceInit = event.httpMethod === 'POST';
    
    // Collect database diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      databaseUrl: getRedactedDatabaseUrl(),
      environment: process.env.NODE_ENV || 'development',
      prismaInitialized: !!prisma,
      actions: [],
      environmentVariables: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        NETLIFY: process.env.NETLIFY,
        CONTEXT: process.env.CONTEXT,
        DEPLOY_URL: process.env.DEPLOY_URL
      }
    };
    
    // Check if database is connected
    let databaseConnected = false;
    try {
      if (prisma) {
        // Try a simple query to check connection
        await prisma.$queryRaw`SELECT 1`;
        databaseConnected = true;
        diagnostics.actions.push('Database connection test successful');
      }
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      diagnostics.databaseError = dbError.message;
      diagnostics.actions.push(`Database connection test failed: ${dbError.message}`);
    }
    
    diagnostics.databaseConnected = databaseConnected;
    
    // Create the Task table if it doesn't exist
    if (databaseConnected || forceInit) {
      try {
        // Create a simple schema for the Task table
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS "Task" (
            "id" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "column" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            
            CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
          );
        `;
        
        // Execute the query to create the table
        await prisma.$executeRawUnsafe(createTableQuery);
        diagnostics.actions.push('Task table created or verified');
        diagnostics.schemaInitialized = true;
      } catch (schemaError) {
        console.error('Error creating schema:', schemaError);
        diagnostics.schemaError = schemaError.message;
        diagnostics.actions.push(`Error creating schema: ${schemaError.message}`);
        diagnostics.schemaInitialized = false;
      }
    }
    
    // Return diagnostics
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(diagnostics, null, 2)
    };
  } catch (error) {
    console.error('Error in db-init function:', error);
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
