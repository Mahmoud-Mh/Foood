import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from './config.service';

export const createTypeOrmOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.database.host,
  port: configService.database.port,
  username: configService.database.username,
  password: configService.database.password,
  database: configService.database.database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: configService.isDevelopment, // Only in development
  logging: configService.isDevelopment,
  ssl: configService.isProduction ? { rejectUnauthorized: false } : false,
  autoLoadEntities: true,
}); 