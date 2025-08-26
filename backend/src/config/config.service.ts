import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  DatabaseConfig,
  JwtConfig,
  AppConfig,
  ThrottleConfig,
  EmailConfig,
} from './configuration';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('database')!;
  }

  get jwt(): JwtConfig {
    return this.configService.get<JwtConfig>('jwt')!;
  }

  get app(): AppConfig {
    return this.configService.get<AppConfig>('app')!;
  }

  get throttle(): ThrottleConfig {
    return this.configService.get<ThrottleConfig>('throttle')!;
  }

  get email(): EmailConfig {
    return this.configService.get<EmailConfig>('email')!;
  }

  get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }
}
