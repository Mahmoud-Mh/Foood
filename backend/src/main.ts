import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  // Get configuration service
  const configService = app.get(ConfigService);
  
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.enableCors({
    origin: configService.isDevelopment 
      ? ['http://localhost:3000', 'http://localhost:3001'] 
      : [], // Configure production origins as needed
    credentials: true,
  });
  
  // Global validation pipe with detailed error logging
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.error('Validation errors:', JSON.stringify(errors, null, 2));
        return new Error('Validation failed');
      },
    }),
  );
  
  // API Documentation with Swagger
  if (configService.isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle('Recipe App API')
      .setDescription('A comprehensive recipe management application API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          description: 'JWT Authorization header using the Bearer scheme.',
          name: 'Authorization',
          bearerFormat: 'JWT',
          scheme: 'Bearer',
          type: 'http',
          in: 'Header',
        },
        'access-token',
      )
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    
    logger.log(`Swagger documentation available at: http://localhost:${configService.app.port}/api/docs`);
  }
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  // Start the application
  const port = configService.app.port;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}/api/v1`);
  if (configService.isDevelopment) {
    logger.log(`Environment: ${configService.app.nodeEnv}`);
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
