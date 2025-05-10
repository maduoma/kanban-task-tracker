// Prisma migration script for Netlify functions
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database initialization...');
  
  try {
    // Check if Task table exists by trying to count tasks
    try {
      await prisma.task.count();
      console.log('Task table already exists, skipping initialization');
      return { success: true, message: 'Database already initialized' };
    } catch (error) {
      console.log('Task table does not exist, creating schema...');
      
      // First, create the Column enum type if it doesn't exist
      try {
        await prisma.$executeRaw`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'column') THEN
              CREATE TYPE "column" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
            END IF;
          END
          $$;
        `;
        console.log('Column enum created or already exists');
      } catch (error) {
        console.error('Error creating Column enum:', error);
        // Continue anyway, we'll use TEXT as fallback
      }
      
      // Create tables manually using Prisma's queryRaw
      // This is a simplified approach for Netlify functions where we can't run migrations directly
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Task" (
          "id" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "column" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
        );
      `;
      
      console.log('Schema created successfully');
      
      // Create some initial tasks
      const initialTasks = [
        { content: 'Welcome to Kanban Task Tracker!', column: 'TODO' },
        { content: 'Drag tasks between columns', column: 'IN_PROGRESS' },
        { content: 'Add new tasks using the form above', column: 'DONE' }
      ];
      
      for (const task of initialTasks) {
        await prisma.task.create({
          data: task
        });
      }
      
      console.log('Initial tasks created');
      return { success: true, message: 'Database initialized with sample tasks' };
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

// Run directly if called from command line
if (require.main === module) {
  main()
    .then(result => console.log(result))
    .catch(error => console.error(error));
}
