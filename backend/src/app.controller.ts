import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiResponseDto } from './common/dto/response.dto';
import { Public } from './common/decorators/auth.decorators';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is running successfully',
    type: ApiResponseDto,
  })
  getHello(): ApiResponseDto<string> {
    const message = this.appService.getHello();
    return ApiResponseDto.success('Application is running successfully', message);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Application health status' })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    type: ApiResponseDto,
  })
  healthCheck(): ApiResponseDto<object> {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
    return ApiResponseDto.success('Health check successful', healthData);
  }
}
