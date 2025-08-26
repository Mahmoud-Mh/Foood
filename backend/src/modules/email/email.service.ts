import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '../../config/config.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const emailConfig = this.configService.email;

    if (this.configService.isDevelopment) {
      // In development, use ethereal email for testing
      this.createTestAccount();
    } else {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
      });
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log('Test email account created for development');
    } catch (error) {
      this.logger.error('Failed to create test email account', error);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const { to, subject, template, context = {} } = options;
      
      const html = this.renderTemplate(template, context);
      
      const mailOptions = {
        from: `"${this.configService.email.fromName}" <${this.configService.email.fromAddress}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (this.configService.isDevelopment) {
        this.logger.log(`Email sent to ${to}: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.configService.app.frontendUrl}/auth/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify your Recipe Hub account',
      template: 'email-verification',
      context: {
        name,
        verificationUrl,
        appName: 'Recipe Hub',
      },
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.app.frontendUrl}/auth/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset your Recipe Hub password',
      template: 'password-reset',
      context: {
        name,
        resetUrl,
        appName: 'Recipe Hub',
        expirationTime: '1 hour',
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Recipe Hub!',
      template: 'welcome',
      context: {
        name,
        appName: 'Recipe Hub',
        dashboardUrl: `${this.configService.app.frontendUrl}/dashboard`,
      },
    });
  }

  private renderTemplate(templateName: string, context: Record<string, any>): string {
    const templates = {
      'email-verification': this.getEmailVerificationTemplate(context),
      'password-reset': this.getPasswordResetTemplate(context),
      'welcome': this.getWelcomeTemplate(context),
    };

    return templates[templateName] || `<p>Template "${templateName}" not found</p>`;
  }

  private getEmailVerificationTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; }
              .content { background: #f9fafb; padding: 30px; }
              .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${context.appName}</h1>
                  <p>Verify your email address</p>
              </div>
              <div class="content">
                  <h2>Hello ${context.name}!</h2>
                  <p>Thank you for signing up for ${context.appName}. To complete your registration, please verify your email address by clicking the button below:</p>
                  <p style="text-align: center;">
                      <a href="${context.verificationUrl}" class="button">Verify Email Address</a>
                  </p>
                  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p><a href="${context.verificationUrl}">${context.verificationUrl}</a></p>
                  <p>This verification link will expire in 24 hours for security reasons.</p>
                  <p>If you didn't create an account with us, please ignore this email.</p>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} ${context.appName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #DC2626, #EF4444); color: white; padding: 30px; text-align: center; }
              .content { background: #f9fafb; padding: 30px; }
              .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
              .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${context.appName}</h1>
                  <p>Password Reset Request</p>
              </div>
              <div class="content">
                  <h2>Hello ${context.name}!</h2>
                  <p>We received a request to reset your password for your ${context.appName} account.</p>
                  <p style="text-align: center;">
                      <a href="${context.resetUrl}" class="button">Reset Password</a>
                  </p>
                  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p><a href="${context.resetUrl}">${context.resetUrl}</a></p>
                  <div class="warning">
                      <strong>Important:</strong> This password reset link will expire in ${context.expirationTime}. If you don't reset your password within this time, you'll need to request a new reset link.
                  </div>
                  <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                  <p>For security reasons, this link can only be used once.</p>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} ${context.appName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Recipe Hub!</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #059669, #10B981); color: white; padding: 30px; text-align: center; }
              .content { background: #f9fafb; padding: 30px; }
              .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
              .feature { background: white; padding: 20px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #10B981; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🍳 Welcome to ${context.appName}!</h1>
                  <p>Your culinary journey begins here</p>
              </div>
              <div class="content">
                  <h2>Hello ${context.name}!</h2>
                  <p>Welcome to ${context.appName}! We're excited to have you join our community of food lovers and culinary enthusiasts.</p>
                  
                  <div class="feature">
                      <h3>🔍 Discover Recipes</h3>
                      <p>Browse thousands of delicious recipes from our community</p>
                  </div>
                  
                  <div class="feature">
                      <h3>📝 Share Your Creations</h3>
                      <p>Upload your own recipes and share them with fellow food lovers</p>
                  </div>
                  
                  <div class="feature">
                      <h3>❤️ Save Favorites</h3>
                      <p>Bookmark your favorite recipes for easy access later</p>
                  </div>
                  
                  <p style="text-align: center;">
                      <a href="${context.dashboardUrl}" class="button">Start Exploring</a>
                  </p>
                  
                  <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
                  
                  <p>Happy cooking!</p>
                  <p>The ${context.appName} Team</p>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} ${context.appName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}