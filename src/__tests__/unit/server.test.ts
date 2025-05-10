import { Server } from 'http';
import app from '../../app';
import logger from '../../utils/logger';

// Mock the app and logger
jest.mock('../../app', () => ({
  listen: jest.fn((port, callback) => {
    callback();
    return { close: jest.fn() } as unknown as Server;
  }),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
}));

describe('Server', () => {
  // Store original process.env
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset process.env
    process.env = { ...originalEnv };
    
    // Clear mocks
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore process.env
    process.env = originalEnv;
  });
  
  it('should start the server on the default port 3000', () => {
    // Clear PORT from environment
    delete process.env.PORT;
    
    // Import the server (this will execute the file)
    jest.isolateModules(() => {
      require('../../server');
    });
    
    // Assertions
    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith('Server running at http://localhost:3000');
  });
  
  it('should start the server on the specified PORT environment variable', () => {
    // Set PORT environment variable
    process.env.PORT = '4000';
    
    // Import the server (this will execute the file)
    jest.isolateModules(() => {
      require('../../server');
    });
    
    // Assertions
    expect(app.listen).toHaveBeenCalledWith('4000', expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith('Server running at http://localhost:4000');
  });
});
