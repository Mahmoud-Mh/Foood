import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { EmailService } from './email.service';
import { ConfigService } from '../../config/config.service';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    email: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'test@example.com',
      password: 'password',
      fromName: 'Recipe Hub',
      fromAddress: 'noreply@example.com',
    },
    app: {
      frontendUrl: 'http://localhost:3000',
    },
    isDevelopment: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    (nodemailer.createTransport as jest.Mock) = jest.fn().mockReturnValue(mockTransporter);
    (nodemailer.createTestAccount as jest.Mock) = jest.fn().mockResolvedValue({
      user: 'test@ethereal.email',
      pass: 'testpass',
    });
    (nodemailer.getTestMessageUrl as jest.Mock) = jest.fn().mockReturnValue('https://ethereal.email/message/123');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    module.useLogger(false); // Suppress logs during testing

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create transporter in production mode', async () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: mockConfigService.email.host,
        port: mockConfigService.email.port,
        secure: mockConfigService.email.secure,
        auth: {
          user: mockConfigService.email.user,
          pass: mockConfigService.email.password,
        },
      });
    });

    it('should create test account in development mode', async () => {
      const developmentConfigService = {
        ...mockConfigService,
        isDevelopment: true,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: developmentConfigService,
          },
        ],
      }).compile();

      module.useLogger(false);

      // Give some time for async createTestAccount to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(nodemailer.createTestAccount).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should successfully send email', async () => {
      const mockInfo = { messageId: '123456' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'welcome',
        context: {
          name: 'John Doe',
          appName: 'Recipe Hub',
          dashboardUrl: 'http://localhost:3000/dashboard',
        },
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${mockConfigService.email.fromName}" <${mockConfigService.email.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: expect.stringContaining('John Doe'),
      });
    });

    it('should handle sending email failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'welcome',
        context: {
          name: 'John Doe',
          appName: 'Recipe Hub',
          dashboardUrl: 'http://localhost:3000/dashboard',
        },
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(false);
    });

    it('should log test email URL in development mode', async () => {
      const developmentConfigService = {
        ...mockConfigService,
        isDevelopment: true,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: developmentConfigService,
          },
        ],
      }).compile();

      const devService = module.get<EmailService>(EmailService);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      const mockInfo = { messageId: '123456' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'welcome',
        context: {
          name: 'John Doe',
          appName: 'Recipe Hub',
          dashboardUrl: 'http://localhost:3000/dashboard',
        },
      };

      await devService.sendEmail(options);

      expect(nodemailer.getTestMessageUrl).toHaveBeenCalledWith(mockInfo);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://ethereal.email/message/123')
      );
    });

    it('should handle empty context gracefully', async () => {
      const mockInfo = { messageId: '123456' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        template: 'welcome',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const mockInfo = { messageId: '123456' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const result = await service.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'verification-token'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${mockConfigService.email.fromName}" <${mockConfigService.email.fromAddress}>`,
        to: 'test@example.com',
        subject: 'Verify your Recipe Hub account',
        html: expect.stringContaining('John Doe'),
      });

      const calledWith = mockTransporter.sendMail.mock.calls[0][0];
      expect(calledWith.html).toContain('http://localhost:3000/auth/verify-email?token=verification-token');
      expect(calledWith.html).toContain('Recipe Hub');
    });

    it('should handle verification email failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const result = await service.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'verification-token'
      );

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const mockInfo = { messageId: '123456' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const result = await service.sendPasswordResetEmail(
        'test@example.com',
        'John Doe',
        'reset-token'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${mockConfigService.email.fromName}" <${mockConfigService.email.fromAddress}>`,
        to: 'test@example.com',
        subject: 'Reset your Recipe Hub password',
        html: expect.stringContaining('John Doe'),
      });

      const calledWith = mockTransporter.sendMail.mock.calls[0][0];
      expect(calledWith.html).toContain('http://localhost:3000/auth/reset-password?token=reset-token');
      expect(calledWith.html).toContain('1 hour');
    });

    it('should handle password reset email failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const result = await service.sendPasswordResetEmail(
        'test@example.com',
        'John Doe',
        'reset-token'
      );

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const mockInfo = { messageId: '123456' };
      mockTransporter.sendMail.mockResolvedValue(mockInfo);

      const result = await service.sendWelcomeEmail('test@example.com', 'John Doe');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: `"${mockConfigService.email.fromName}" <${mockConfigService.email.fromAddress}>`,
        to: 'test@example.com',
        subject: 'Welcome to Recipe Hub!',
        html: expect.stringContaining('John Doe'),
      });

      const calledWith = mockTransporter.sendMail.mock.calls[0][0];
      expect(calledWith.html).toContain('http://localhost:3000/dashboard');
      expect(calledWith.html).toContain('Welcome to Recipe Hub!');
    });

    it('should handle welcome email failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const result = await service.sendWelcomeEmail('test@example.com', 'John Doe');

      expect(result).toBe(false);
    });
  });

  describe('renderTemplate', () => {
    it('should render email verification template correctly', async () => {
      const context = {
        name: 'John Doe',
        appName: 'Recipe Hub',
        verificationUrl: 'http://localhost:3000/auth/verify-email?token=123',
      };

      // Access private method using bracket notation
      const html = service['renderTemplate']('email-verification', context);

      expect(html).toContain('John Doe');
      expect(html).toContain('Recipe Hub');
      expect(html).toContain('http://localhost:3000/auth/verify-email?token=123');
      expect(html).toContain('Verify Email Address');
    });

    it('should render password reset template correctly', async () => {
      const context = {
        name: 'John Doe',
        appName: 'Recipe Hub',
        resetUrl: 'http://localhost:3000/auth/reset-password?token=123',
        expirationTime: '1 hour',
      };

      const html = service['renderTemplate']('password-reset', context);

      expect(html).toContain('John Doe');
      expect(html).toContain('Recipe Hub');
      expect(html).toContain('http://localhost:3000/auth/reset-password?token=123');
      expect(html).toContain('1 hour');
      expect(html).toContain('Reset Password');
    });

    it('should render welcome template correctly', async () => {
      const context = {
        name: 'John Doe',
        appName: 'Recipe Hub',
        dashboardUrl: 'http://localhost:3000/dashboard',
      };

      const html = service['renderTemplate']('welcome', context);

      expect(html).toContain('John Doe');
      expect(html).toContain('Recipe Hub');
      expect(html).toContain('http://localhost:3000/dashboard');
      expect(html).toContain('Welcome to Recipe Hub!');
      expect(html).toContain('Discover Recipes');
      expect(html).toContain('Share Your Creations');
      expect(html).toContain('Save Favorites');
    });

    it('should return error message for unknown template', async () => {
      const context = { name: 'John Doe' };

      const html = service['renderTemplate']('unknown-template', context);

      expect(html).toContain('Template "unknown-template" not found');
    });
  });

  describe('email templates', () => {
    it('should include current year in footer', async () => {
      const context = {
        name: 'John Doe',
        appName: 'Recipe Hub',
        verificationUrl: 'http://localhost:3000/verify',
      };

      const html = service['renderTemplate']('email-verification', context);
      const currentYear = new Date().getFullYear();

      expect(html).toContain(`&copy; ${currentYear} Recipe Hub`);
    });

    it('should include proper HTML structure', async () => {
      const context = {
        name: 'John Doe',
        appName: 'Recipe Hub',
        verificationUrl: 'http://localhost:3000/verify',
      };

      const html = service['renderTemplate']('email-verification', context);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('<style>');
    });

    it('should include responsive viewport meta tag', async () => {
      const context = {
        name: 'John Doe',
        appName: 'Recipe Hub',
        resetUrl: 'http://localhost:3000/reset',
        expirationTime: '1 hour',
      };

      const html = service['renderTemplate']('password-reset', context);

      expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1.0"');
    });
  });

  describe('error handling', () => {
    it('should handle transporter creation error gracefully', async () => {
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (nodemailer.createTestAccount as jest.Mock).mockRejectedValue(
        new Error('Failed to create test account')
      );

      const developmentConfigService = {
        ...mockConfigService,
        isDevelopment: true,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: developmentConfigService,
          },
        ],
      }).compile();

      // Give some time for async createTestAccount to complete and fail
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(errorLogSpy).toHaveBeenCalledWith(
        'Failed to create test email account',
        expect.any(Error)
      );
    });

    it('should handle malformed email options gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Invalid email format'));

      const options = {
        to: 'invalid-email',
        subject: '',
        template: 'welcome',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(false);
    });
  });
});