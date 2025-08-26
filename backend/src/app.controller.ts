import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AdminOnly } from './common/decorators/auth.decorators';
import { ConfigService } from './config/config.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Returns application status' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Recipe App API',
      version: '1.0.0',
    };
  }

  @Get('clear-database')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiOperation({ summary: 'Clear all database data (DEV ONLY)' })
  @ApiResponse({ status: 200, description: 'Database cleared successfully' })
  async clearDatabase(): Promise<object> {
    if (!this.configService.isDevelopment) {
      throw new ForbiddenException(
        'This endpoint is only available in development environment',
      );
    }
    return this.appService.clearDatabase();
  }
}
