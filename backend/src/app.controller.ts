import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  @ApiOperation({ summary: 'Clear all database data (DEV ONLY)' })
  @ApiResponse({ status: 200, description: 'Database cleared successfully' })
  async clearDatabase(): Promise<object> {
    return this.appService.clearDatabase();
  }
}
