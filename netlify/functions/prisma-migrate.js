// Prisma migration script for Netlify functions
const { PrismaClient } = require('@prisma/client');

// Log the DATABASE_URL (with credentials hidden) for debugging
const dbUrl = process.env.DATABASE_URL || 'No DATABASE_URL found';
const sanitizedDbUrl = dbUrl.replace(/:\/\/[^@]*@/, '://***:***@');
console.log('Using database URL:', sanitizedDbUrl);

// Initialize Prisma client with debug mode
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Helper function to add sample tasks
async function addSampleTasks() {
  console.log('Adding sample tasks...');
  
  const initialTasks = [
    { content: 'Welcome to Kanban Task Tracker!', column: 'TODO' },
    { content: 'Drag tasks between columns', column: 'IN_PROGRESS' },
    { content: 'Add new tasks using the form above', column: 'DONE' }
  ];
  
  for (const task of initialTasks) {
    try {
      await prisma.task.create({
        data: {
          id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: task.content,
          column: task.column,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Created task: ${task.content} in ${task.column}`);
    } catch (error) {
      console.error(`Error creating sample task: ${error.message}`);
    }
  }
  
  console.log('Sample tasks added successfully');
}

async function main() {
  console.log('Starting database initialization...');
  
  try {
    // Check if Task table exists by trying to count tasks
    try {
      const count = await prisma.task.count();
      console.log(`Task table exists with ${count} tasks, checking if we need to add sample data`);
      
      // If no tasks exist, add sample tasks
      if (count === 0) {
        console.log('No tasks found, adding sample tasks...');
        await addSampleTasks();
        return { success: true, message: 'Added sample tasks to existing database' };
      }
      
      return { success: true, message: 'Database already initialized with tasks' };
    } catch (error) {
      // The error might be because the table doesn't exist or because of connection issues
      console.log('Error checking tasks, attempting to create schema:', error.message);
      
      try {
        console.log('Creating Task table if not exists...');
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Task" (
            "id" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "column" TEXT NOT NULL CHECK ("column" IN ('TODO', 'IN_PROGRESS', 'DONE')),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
          );
        `;
        console.log('Task table created successfully');
        
        console.log('Schema created successfully');
        
        // Add sample tasks
        await addSampleTasks();
        
        return { success: true, message: 'Database initialized with sample tasks' };
      } catch (error) {
        console.error('Error creating database schema:', error);
        return { success: false, error: error.message };
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in API
module.exports = { initializeDatabase: main };

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
  
  // Log the request for debugging
  console.log('Prisma Migration Function Invoked:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await main();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in prisma-migrate function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Server error', 
        message: error.message,
        stack: error.stack
      })
    };
  }
};

// Run directly if called from command line
if (require.main === module) {
  main()
    .then(result => console.log(result))
    .catch(error => console.error(error));
}
