import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { AppLoggerService } from './logger.service';
import { ConfigService } from '../../config/config.service';

jest.mock('fs');

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let configService: ConfigService;

  const mockConfigService = {
    isDevelopment: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.LOG_FILE_ENABLED = 'false';
    process.env.LOG_FILE_PATH = '/logs/app.log';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    delete process.env.LOG_FILE_ENABLED;
    delete process.env.LOG_FILE_PATH;
  });

  describe('basic logging methods', () => {
    it('should have log method', () => {
      expect(typeof service.log).toBe('function');
      expect(() => service.log('Test message')).not.toThrow();
    });

    it('should have error method', () => {
      expect(typeof service.error).toBe('function');
      expect(() => service.error('Test error')).not.toThrow();
    });

    it('should have warn method', () => {
      expect(typeof service.warn).toBe('function');
      expect(() => service.warn('Test warning')).not.toThrow();
    });

    it('should have debug method', () => {
      expect(typeof service.debug).toBe('function');
      expect(() => service.debug('Test debug')).not.toThrow();
    });
  });

  describe('business logging methods', () => {
    it('should log user actions', () => {
      const logSpy = jest.spyOn(service, 'log');
      
      service.logUserAction('user123', 'LOGIN', { ip: '192.168.1.1' });
      
      expect(logSpy).toHaveBeenCalledWith('User action: LOGIN', 'USER_ACTION');
    });

    it('should log security events', () => {
      const warnSpy = jest.spyOn(service, 'warn');
      
      service.logSecurityEvent('FAILED_LOGIN', { 
        userId: 'user123', 
        ip: '192.168.1.1' 
      });
      
      expect(warnSpy).toHaveBeenCalledWith('Security event: FAILED_LOGIN', 'SECURITY');
    });

    it('should log API requests', () => {
      const logSpy = jest.spyOn(service, 'log');
      
      service.logApiRequest('GET', '/api/users', 'user123', '192.168.1.1');
      
      expect(logSpy).toHaveBeenCalledWith('API Request: GET /api/users', 'API_REQUEST');
    });

    it('should log API responses with appropriate level', () => {
      const logSpy = jest.spyOn(service, 'log');
      const warnSpy = jest.spyOn(service, 'warn');
      const errorSpy = jest.spyOn(service, 'error');

      // Success response
      service.logApiResponse('GET', '/api/users', 200, 100, 'user123');
      expect(logSpy).toHaveBeenCalled();

      // Client error response
      service.logApiResponse('GET', '/api/users', 400, 50, 'user123');
      expect(warnSpy).toHaveBeenCalled();

      // Server error response
      service.logApiResponse('GET', '/api/users', 500, 200, 'user123');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log database queries', () => {
      const debugSpy = jest.spyOn(service, 'debug');
      
      service.logDatabaseQuery('SELECT * FROM users', 50);
      
      expect(debugSpy).toHaveBeenCalledWith(
        'Database query executed (50ms)', 
        'DATABASE_QUERY'
      );
    });

    it('should log database errors', () => {
      const errorSpy = jest.spyOn(service, 'error');
      const error = new Error('Connection failed');
      
      service.logDatabaseQuery('SELECT * FROM users', 100, error);
      
      expect(errorSpy).toHaveBeenCalledWith(
        'Database query failed: Connection failed',
        error.stack,
        'DATABASE_ERROR'
      );
    });
  });

  describe('file logging', () => {
    beforeEach(() => {
      process.env.LOG_FILE_ENABLED = 'true';
      process.env.LOG_FILE_PATH = '/logs/app.log';
    });

    it('should create log directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation();

      // Create a new instance to trigger directory creation
      new AppLoggerService(configService);

      expect(fs.mkdirSync).toHaveBeenCalledWith('/logs', { recursive: true });
    });

    it('should write to file when file logging is enabled', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.appendFileSync as jest.Mock).mockImplementation();

      const loggerWithFile = new AppLoggerService(configService);
      loggerWithFile.log('Test file log');

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/logs/app.log',
        expect.stringContaining('Test file log'),
        'utf8'
      );
    });

    it('should handle file writing errors gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.appendFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File write error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const loggerWithFile = new AppLoggerService(configService);
      loggerWithFile.log('Test error log');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to write to log file:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});