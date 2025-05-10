import { PrismaClient, Column, Prisma } from '@prisma/client';

// Initialize Prisma with logging enabled
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Error handling wrapper for Prisma operations
async function prismaErrorHandler<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Prisma operation failed:', error);
    
    // Enhance error with more context
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error code: ${error.code}`);
      console.error(`Prisma error message: ${error.message}`);
      
      // Handle specific error codes
      if (error.code === 'P2002') {
        throw new Error('A record with this ID already exists');
      }
    }
    
    throw error;
  }
}

export const getAll = async () => {
  console.log('Service: Getting all tasks');
  return prismaErrorHandler(() => prisma.task.findMany({ orderBy: { createdAt: 'asc' } }));
};

export const create = async (content: string) => {
  console.log('Service: Creating new task with content:', content);
  
  if (!content) {
    console.error('Service: Cannot create task with empty content');
    throw new Error('Task content is required');
  }
  
  // Generate a unique ID for the task
  const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log('Service: Generated task ID:', id);
  
  return prismaErrorHandler(() => prisma.task.create({ 
    data: { 
      id,
      content, 
      column: Column.TODO,
      createdAt: new Date(),
      updatedAt: new Date()
    } 
  }));
};

export const remove = async (id: string) => {
  console.log('Service: Removing task with ID:', id);
  
  if (!id) {
    console.error('Service: Cannot remove task with empty ID');
    throw new Error('Task ID is required');
  }
  
  return prismaErrorHandler(() => prisma.task.delete({ where: { id } }));
};

export const move = async (id: string, column: string) => {
  console.log(`Service: Moving task ${id} to column: ${column}`);
  
  if (!id) {
    console.error('Service: Cannot move task with empty ID');
    throw new Error('Task ID is required');
  }
  
  if (!column) {
    console.error('Service: Cannot move task without target column');
    throw new Error('Target column is required');
  }
  
  // Convert the column string to a valid Column enum value
  let columnValue: Column;
  
  switch(column) {
    case 'TODO':
      columnValue = Column.TODO;
      break;
    case 'IN_PROGRESS':
      columnValue = Column.IN_PROGRESS;
      break;
    case 'DONE':
      columnValue = Column.DONE;
      break;
    default:
      console.error(`Service: Invalid column value: ${column}`);
      throw new Error(`Invalid column value: ${column}`);
  }
  
  return prismaErrorHandler(() => prisma.task.update({
    where: { id },
    data: { 
      column: columnValue,
      updatedAt: new Date()
    }
  }));
};
