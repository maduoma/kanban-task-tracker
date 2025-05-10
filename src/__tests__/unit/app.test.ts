import request from 'supertest';
import app from '../../app';
import * as taskService from '../../services/task.service';

// Mock the task service
jest.mock('../../services/task.service');

describe('Express App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 OK with status information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Static File Serving', () => {
    it('should serve static files from public directory', async () => {
      // Mock a static file request
      // This is a bit tricky to test directly, so we'll check that the middleware is applied
      // by checking that the app doesn't return 404 for a known route
      const response = await request(app).get('/');
      
      // Express static middleware will return 404 if file not found, but not an Express 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('CORS Middleware', () => {
    it('should have CORS headers in the response', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Middleware', () => {
    it('should parse JSON request bodies', async () => {
      // Mock task service
      const mockTask = { id: '1', content: 'Test Task', column: 'TODO' };
      (taskService.create as jest.Mock).mockResolvedValue(mockTask);
      
      // Test with JSON body
      const response = await request(app)
        .post('/api/tasks')
        .send({ content: 'Test Task' })
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(201);
      expect(taskService.create).toHaveBeenCalledWith('Test Task');
    });
  });

  describe('Task Routes', () => {
    it('should register task routes', async () => {
      // Mock task service
      const mockTasks = [{ id: '1', content: 'Test Task', column: 'TODO' }];
      (taskService.getAll as jest.Mock).mockResolvedValue(mockTasks);
      
      // Test the route
      const response = await request(app).get('/api/tasks');
      
      expect(response.status).toBe(200);
      expect(taskService.getAll).toHaveBeenCalled();
    });
  });
});
