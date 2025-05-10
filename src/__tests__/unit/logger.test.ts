import logger from '../../utils/logger';

describe('Logger Utility', () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Mock console methods
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  // Restore original console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
  
  it('should log info messages with timestamp', () => {
    // Mock Date.toISOString
    const mockDate = new Date('2025-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Call the logger
    logger.info('Test info message');
    
    // Assertions
    expect(console.log).toHaveBeenCalledWith(
      '[2025-01-01T12:00:00.000Z] [INFO]',
      'Test info message'
    );
    
    // Restore Date
    jest.restoreAllMocks();
  });
  
  it('should log error messages with timestamp', () => {
    // Mock Date.toISOString
    const mockDate = new Date('2025-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Call the logger
    logger.error('Test error message');
    
    // Assertions
    expect(console.error).toHaveBeenCalledWith(
      '[2025-01-01T12:00:00.000Z] [ERROR]',
      'Test error message'
    );
    
    // Restore Date
    jest.restoreAllMocks();
  });
  
  it('should log warning messages with timestamp', () => {
    // Mock Date.toISOString
    const mockDate = new Date('2025-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Call the logger
    logger.warn('Test warning message');
    
    // Assertions
    expect(console.warn).toHaveBeenCalledWith(
      '[2025-01-01T12:00:00.000Z] [WARN]',
      'Test warning message'
    );
    
    // Restore Date
    jest.restoreAllMocks();
  });
  
  it('should log debug messages with timestamp', () => {
    // Mock Date.toISOString
    const mockDate = new Date('2025-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Call the logger
    logger.debug('Test debug message');
    
    // Assertions
    expect(console.log).toHaveBeenCalledWith(
      '[2025-01-01T12:00:00.000Z] [DEBUG]',
      'Test debug message'
    );
    
    // Restore Date
    jest.restoreAllMocks();
  });
  
  it('should handle multiple arguments', () => {
    // Mock Date.toISOString
    const mockDate = new Date('2025-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Call the logger with multiple arguments
    logger.info('Message', { data: 'test' }, 123);
    
    // Assertions
    expect(console.log).toHaveBeenCalledWith(
      '[2025-01-01T12:00:00.000Z] [INFO]',
      'Message',
      { data: 'test' },
      123
    );
    
    // Restore Date
    jest.restoreAllMocks();
  });
});
