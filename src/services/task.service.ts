import { PrismaClient, Column } from '@prisma/client';
const prisma = new PrismaClient();

export const getAll = () => {
  return prisma.task.findMany({ orderBy: { createdAt: 'asc' } });
};

export const create = (content: string) => {
  // Generate a unique ID for the task
  const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  return prisma.task.create({ 
    data: { 
      id,
      content, 
      column: Column.TODO 
    } 
  });
};

export const remove = (id: string) => {
  return prisma.task.delete({ where: { id } });
};

export const move = (id: string, column: string) => {
  console.log(`Moving task ${id} to column: ${column}`);
  
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
      throw new Error(`Invalid column value: ${column}`);
  }
  
  return prisma.task.update({
    where: { id },
    data: { column: columnValue }
  });
};
