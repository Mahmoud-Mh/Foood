import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let nestConfigService: NestConfigService;

  const mockConfigData = {
    database: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'testuser',
      password: 'testpass',
      database: 'testdb',
    },
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
      refreshSecret: 'refresh-secret',
      refreshExpiresIn: '7d',
    },
    app: {
      nodeEnv: 'development',
      port: 3000,
      apiVersion: 'v1',
    },
    throttle: {
      ttl: 60,
      limit: 10,
    },
    email: {
      service: 'gmail',
      user: 'test@example.com',
      password: 'testpass',
    },
  };

  const mockNestConfigService = {
    get: jest.fn((key: string) => {
      return mockConfigData[key as keyof typeof mockConfigData];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    nestConfigService = module.get<NestConfigService>(NestConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('configuration getters', () => {
    it('should return database configuration', () => {
      const dbConfig = service.database;

      expect(dbConfig).toEqual(mockConfigData.database);
      expect(nestConfigService.get).toHaveBeenCalledWith('database');
    });

    it('should return JWT configuration', () => {
      const jwtConfig = service.jwt;

      expect(jwtConfig).toEqual(mockConfigData.jwt);
      expect(nestConfigService.get).toHaveBeenCalledWith('jwt');
    });

    it('should return app configuration', () => {
      const appConfig = service.app;

      expect(appConfig).toEqual(mockConfigData.app);
      expect(nestConfigService.get).toHaveBeenCalledWith('app');
    });

    it('should return throttle configuration', () => {
      const throttleConfig = service.throttle;

      expect(throttleConfig).toEqual(mockConfigData.throttle);
      expect(nestConfigService.get).toHaveBeenCalledWith('throttle');
    });

    it('should return email configuration', () => {
      const emailConfig = service.email;

      expect(emailConfig).toEqual(mockConfigData.email);
      expect(nestConfigService.get).toHaveBeenCalledWith('email');
    });
  });

  describe('environment helpers', () => {
    it('should return true for isDevelopment when nodeEnv is development', () => {
      expect(service.isDevelopment).toBe(true);
    });

    it('should return false for isProduction when nodeEnv is development', () => {
      expect(service.isProduction).toBe(false);
    });

    it('should return true for isProduction when nodeEnv is production', () => {
      // Update mock to return production environment
      mockNestConfigService.get.mockImplementation((key: string) => {
        if (key === 'app') {
          return { ...mockConfigData.app, nodeEnv: 'production' };
        }
        return mockConfigData[key as keyof typeof mockConfigData];
      });

      expect(service.isProduction).toBe(true);
      expect(service.isDevelopment).toBe(false);
    });
  });

  describe('configuration caching', () => {
    it('should call nestConfigService.get for each configuration access', () => {
      // Access each configuration
      service.database;
      service.jwt;
      service.app;
      service.throttle;
      service.email;

      expect(nestConfigService.get).toHaveBeenCalledTimes(5);
    });
  });
});