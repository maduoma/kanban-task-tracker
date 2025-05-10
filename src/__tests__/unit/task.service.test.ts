import { PrismaClient, Column } from '@prisma/client';
import * as taskService from '../../services/task.service';

// Mock the Prisma client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Column: { TODO: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE' },
  };
});

describe('Task Service', () => {
  let prisma: any;

  beforeEach(() => {
    // Get the mocked prisma instance
    prisma = new PrismaClient();
    // Clear all mock calls between tests
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all tasks', async () => {
      // Mock data
      const mockTasks = [
        { id: '1', content: 'Task 1', column: 'TODO' },
        { id: '2', content: 'Task 2', column: 'IN_PROGRESS' },
      ];

      // Setup the mock to return our test data
      prisma.task.findMany.mockResolvedValue(mockTasks);

      // Call the function
      const result = await taskService.getAll();

      // Assertions
      expect(prisma.task.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      // Mock data
      const content = 'New Task';
      const mockTask = { id: '3', content, column: 'TODO' };

      // Setup the mock
      prisma.task.create.mockResolvedValue(mockTask);

      // Call the function
      const result = await taskService.create(content);

      // Assertions
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ 
          id: expect.any(String),
          content, 
          column: Column.TODO 
        }),
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      // Mock data
      const id = '1';
      const mockDeletedTask = { id, content: 'Task 1', column: 'TODO' };

      // Setup the mock
      prisma.task.delete.mockResolvedValue(mockDeletedTask);

      // Call the function
      await taskService.remove(id);

      // Assertions
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('move', () => {
    it('should update the column to TODO', async () => {
      // Setup
      const taskId = '1';
      const newColumn = 'TODO';
      const updatedTask = { id: taskId, content: 'Test Task', column: newColumn };
      
      // Mock
      prisma.task.update.mockResolvedValue(updatedTask);
      
      // Execute
      const result = await taskService.move(taskId, newColumn);
      
      // Assert
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { column: Column.TODO }
      });
      expect(result).toEqual(updatedTask);
    });
    
    it('should update the column to IN_PROGRESS', async () => {
      // Setup
      const taskId = '1';
      const newColumn = 'IN_PROGRESS';
      const updatedTask = { id: taskId, content: 'Test Task', column: newColumn };
      
      // Mock
      prisma.task.update.mockResolvedValue(updatedTask);
      
      // Execute
      const result = await taskService.move(taskId, newColumn);
      
      // Assert
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { column: Column.IN_PROGRESS }
      });
      expect(result).toEqual(updatedTask);
    });
    
    it('should update the column to DONE', async () => {
      // Setup
      const taskId = '1';
      const newColumn = 'DONE';
      const updatedTask = { id: taskId, content: 'Test Task', column: newColumn };
      
      // Mock
      prisma.task.update.mockResolvedValue(updatedTask);
      
      // Execute
      const result = await taskService.move(taskId, newColumn);
      
      // Assert
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { column: Column.DONE }
      });
      expect(result).toEqual(updatedTask);
    });
    
    it('should throw an error for invalid column value', async () => {
      // Setup
      const taskId = '1';
      const invalidColumn = 'INVALID_COLUMN';
      
      // Mock console.log to avoid polluting test output
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      // Execute & Assert
      try {
        await taskService.move(taskId, invalidColumn);
        // If we get here, the test should fail because no error was thrown
        fail('Expected an error to be thrown for invalid column');
      } catch (error: any) {
        // This is the expected path - verify the error message
        expect(error.message).toContain(`Invalid column value: ${invalidColumn}`);
      } finally {
        // Restore console.log
        console.log = originalConsoleLog;
      }
      
      // Verify the update function was not called
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
    
    // This test is commented out because it's expected to throw an error
    // which is the correct behavior for invalid column values
    /*
    it('should handle invalid column gracefully', async () => {
      // Mock data
      const id = '1';
      const column = 'INVALID_COLUMN';

      // Setup the mock to throw an error
      prisma.task.update.mockRejectedValue(new Error(`Invalid column value: ${column}`));

      // Call the function and expect it to throw
      try {
        await taskService.move(id, column);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Invalid column value');
      }
    });
    */
  });
});
