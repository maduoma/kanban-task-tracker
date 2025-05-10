import { Request, Response } from 'express';
import * as taskController from '../../controllers/task.controller';
import * as taskService from '../../services/task.service';
import { Column } from '@prisma/client';

// Mock the task service
jest.mock('../../services/task.service');

describe('Task Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  let responseSend: jest.Mock;
  
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods to avoid polluting test output
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Setup mock response
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    responseSend = jest.fn().mockReturnThis();
    
    mockResponse = {
      json: responseJson,
      status: responseStatus,
      send: responseSend,
    };
    
    // Setup mock request
    mockRequest = {};
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      // Mock data
      const mockTasks = [
        { id: '1', content: 'Task 1', column: 'TODO' },
        { id: '2', content: 'Task 2', column: 'IN_PROGRESS' },
      ];
      
      // Setup the mock
      (taskService.getAll as jest.Mock).mockResolvedValue(mockTasks);
      
      // Call the controller
      await taskController.getAllTasks(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(taskService.getAll).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(mockTasks);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      // Mock data
      const taskContent = 'New Task';
      const mockTask = { id: '3', content: taskContent, column: 'TODO' };
      
      // Setup the mock request
      mockRequest.body = { content: taskContent };
      
      // Setup the mock service
      (taskService.create as jest.Mock).mockResolvedValue(mockTask);
      
      // Call the controller
      await taskController.createTask(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(taskService.create).toHaveBeenCalledWith(taskContent);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockTask);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      // Mock data
      const taskId = '1';
      
      // Setup the mock request
      mockRequest.params = { id: taskId };
      
      // Setup the mock service
      (taskService.remove as jest.Mock).mockResolvedValue(undefined);
      
      // Call the controller
      await taskController.deleteTask(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(taskService.remove).toHaveBeenCalledWith(taskId);
      expect(responseStatus).toHaveBeenCalledWith(204);
      expect(responseSend).toHaveBeenCalled();
    });
  });

  describe('updateTaskColumn', () => {
    it('should update a task column', async () => {
      // Mock data
      const taskId = '1';
      const newColumn = 'DONE';
      const mockUpdatedTask = { id: taskId, content: 'Task 1', column: newColumn };
      
      // Setup the mock request
      mockRequest.params = { id: taskId };
      mockRequest.body = { column: newColumn };
      
      // Setup the mock service
      (taskService.move as jest.Mock).mockResolvedValue(mockUpdatedTask);
      
      // Call the controller
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(taskService.move).toHaveBeenCalledWith(taskId, newColumn);
      expect(responseJson).toHaveBeenCalledWith(mockUpdatedTask);
    });

    it('should handle errors when updating a task column', async () => {
      // Mock data
      const taskId = '1';
      const invalidColumn = 'INVALID_COLUMN';
      const errorMessage = `Invalid column value: ${invalidColumn}`;
      
      // Setup the mock request
      mockRequest.params = { id: taskId };
      mockRequest.body = { column: invalidColumn };
      
      // Setup the mock service to throw an error
      (taskService.move as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      // Call the controller
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(taskService.move).toHaveBeenCalledWith(taskId, invalidColumn);
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  // Test the normalizeColumn function directly now that it's exported
  describe('normalizeColumn', () => {
    it('should normalize TODO column', () => {
      expect(taskController.normalizeColumn('todo')).toBe(Column.TODO);
      expect(taskController.normalizeColumn('TODO')).toBe(Column.TODO);
    });
    
    it('should normalize IN_PROGRESS column', () => {
      expect(taskController.normalizeColumn('inprogress')).toBe(Column.IN_PROGRESS);
      expect(taskController.normalizeColumn('INPROGRESS')).toBe(Column.IN_PROGRESS);
      expect(taskController.normalizeColumn('in_progress')).toBe(Column.IN_PROGRESS);
      expect(taskController.normalizeColumn('IN_PROGRESS')).toBe(Column.IN_PROGRESS);
    });
    
    it('should normalize DONE column', () => {
      expect(taskController.normalizeColumn('done')).toBe(Column.DONE);
      expect(taskController.normalizeColumn('DONE')).toBe(Column.DONE);
    });
    
    it('should throw an error for invalid column value', () => {
      expect(() => taskController.normalizeColumn('invalid')).toThrow(/Invalid column value/);
    });
  });
  
  // Test the updateTaskColumn function which uses normalizeColumn
  describe('updateTaskColumn with different column values', () => {
    it('should handle different case variations for column values', async () => {
      // Test with lowercase 'todo'
      mockRequest.params = { id: '1' };
      mockRequest.body = { column: 'todo' };
      const mockTodoTask = { id: '1', content: 'Task 1', column: 'TODO' };
      (taskService.move as jest.Mock).mockResolvedValue(mockTodoTask);
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      expect(taskService.move).toHaveBeenCalledWith('1', 'todo');
      
      // Test with 'IN_PROGRESS'
      jest.clearAllMocks();
      mockRequest.body = { column: 'IN_PROGRESS' };
      const mockInProgressTask = { id: '1', content: 'Task 1', column: 'IN_PROGRESS' };
      (taskService.move as jest.Mock).mockResolvedValue(mockInProgressTask);
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      expect(taskService.move).toHaveBeenCalledWith('1', 'IN_PROGRESS');
      
      // Test with 'DONE'
      jest.clearAllMocks();
      mockRequest.body = { column: 'DONE' };
      const mockDoneTask = { id: '1', content: 'Task 1', column: 'DONE' };
      (taskService.move as jest.Mock).mockResolvedValue(mockDoneTask);
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      expect(taskService.move).toHaveBeenCalledWith('1', 'DONE');
    });
    
    it('should handle lowercase column values', async () => {
      // Test with lowercase 'inprogress' (without underscore)
      mockRequest.params = { id: '1' };
      mockRequest.body = { column: 'inprogress' };
      const mockInProgressTask = { id: '1', content: 'Task 1', column: 'IN_PROGRESS' };
      (taskService.move as jest.Mock).mockResolvedValue(mockInProgressTask);
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      expect(taskService.move).toHaveBeenCalledWith('1', 'inprogress');
      
      // Test with lowercase 'in_progress' (with underscore)
      jest.clearAllMocks();
      mockRequest.body = { column: 'in_progress' };
      (taskService.move as jest.Mock).mockResolvedValue(mockInProgressTask);
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      expect(taskService.move).toHaveBeenCalledWith('1', 'in_progress');
      
      // Test with lowercase 'done'
      jest.clearAllMocks();
      mockRequest.body = { column: 'done' };
      const mockDoneTask = { id: '1', content: 'Task 1', column: 'DONE' };
      (taskService.move as jest.Mock).mockResolvedValue(mockDoneTask);
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      expect(taskService.move).toHaveBeenCalledWith('1', 'done');
    });
    
    it('should handle invalid column value', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { column: 'INVALID' };
      const errorMessage = 'Invalid column value: INVALID';
      
      // Mock console.error to avoid polluting test output
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Mock the service to throw an error
      (taskService.move as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      await taskController.updateTaskColumn(mockRequest as Request, mockResponse as Response);
      
      // Restore console.error
      console.error = originalConsoleError;
      
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
