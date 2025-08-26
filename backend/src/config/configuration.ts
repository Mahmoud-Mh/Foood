export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expirationTime: string;
  refreshSecret: string;
  refreshExpirationTime: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  productionDomain?: string;
  frontendUrl: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
  fromName: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface Configuration {
  database: DatabaseConfig;
  jwt: JwtConfig;
  app: AppConfig;
  throttle: ThrottleConfig;
  email: EmailConfig;
}

export default (): Configuration => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'recipe_app',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expirationTime: process.env.JWT_EXPIRATION || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpirationTime: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    productionDomain: process.env.PRODUCTION_DOMAIN,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@recipehub.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Recipe Hub',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10), // Increased from 10 to 100 for development
  },
});
