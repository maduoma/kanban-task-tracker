import express, { Application } from 'express';
import request from 'supertest';
import { Column, PrismaClient } from '@prisma/client';
import * as taskService from '../../services/task.service';
import taskRoutes from '../../routes/task.routes';
import { Server } from 'http';

// Mock the task service
jest.mock('../../services/task.service');

describe('Task Routes', () => {
  let app: Application;
  let server: Server;
  let prisma: PrismaClient;
  
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(async () => {
    // Mock console methods to avoid polluting test output
    console.log = jest.fn();
    console.error = jest.fn();
    
    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    
    server = app.listen(0); // Use a random port
    
    // Initialize Prisma client
    prisma = new PrismaClient();
  });
  
  afterAll(async () => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Close server and database connections
    server.close();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Clear all mock calls between tests
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      // Mock data
      const mockTasks = [
        { id: '1', content: 'Task 1', column: Column.TODO },
        { id: '2', content: 'Task 2', column: Column.IN_PROGRESS },
      ];

      // Setup the mock
      (taskService.getAll as jest.Mock).mockResolvedValue(mockTasks);

      // Make the request
      const response = await request(app).get('/api/tasks');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(taskService.getAll).toHaveBeenCalled();
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      // Mock data
      const taskContent = 'New Task';
      const mockTask = { id: '3', content: taskContent, column: Column.TODO };

      // Setup the mock
      (taskService.create as jest.Mock).mockResolvedValue(mockTask);

      // Make the request
      const response = await request(app)
        .post('/api/tasks')
        .send({ content: taskContent });

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockTask);
      expect(taskService.create).toHaveBeenCalledWith(taskContent);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      // Mock data
      const taskId = '1';

      // Setup the mock
      (taskService.remove as jest.Mock).mockResolvedValue(undefined);

      // Make the request
      const response = await request(app).delete(`/api/tasks/${taskId}`);

      // Assertions
      expect(response.status).toBe(204);
      expect(taskService.remove).toHaveBeenCalledWith(taskId);
    });
  });

  describe('PUT /api/tasks/:id/move', () => {
    it('should update a task column', async () => {
      // Mock data
      const taskId = '1';
      const newColumn = Column.DONE;
      const mockUpdatedTask = { id: taskId, content: 'Task 1', column: newColumn };

      // Setup the mock
      (taskService.move as jest.Mock).mockResolvedValue(mockUpdatedTask);

      // Make the request
      const response = await request(app)
        .put(`/api/tasks/${taskId}/move`)
        .send({ column: newColumn });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedTask);
      expect(taskService.move).toHaveBeenCalledWith(taskId, newColumn);
    });

    it('should return 400 for invalid column value', async () => {
      // Mock data
      const taskId = '1';
      const invalidColumn = 'INVALID_COLUMN';

      // Setup the mock to throw an error
      (taskService.move as jest.Mock).mockRejectedValue(new Error(`Invalid column value: ${invalidColumn}`));

      // Make the request
      const response = await request(app)
        .put(`/api/tasks/${taskId}/move`)
        .send({ column: invalidColumn });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(taskService.move).toHaveBeenCalledWith(taskId, invalidColumn);
    });
  });
});
