import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import { RecipeStatus, DifficultyLevel } from '../src/modules/recipes/entities/recipe.entity';

describe('Food Recipe App (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authTokens = {
    user: '',
    admin: '',
  };
  let createdEntities = {
    user: { id: '', email: 'testuser@example.com' },
    admin: { id: '', email: 'admin@example.com' },
    category: { id: '', slug: '' },
    ingredient: { id: '', slug: '' },
    recipe: { id: '', slug: '' },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');
    
    dataSource = app.get(DataSource);
    await app.init();

    // Clear database before tests
    await request(app.getHttpServer()).delete('/api/v1/clear-database');
  });

  afterAll(async () => {
    // Clean up after tests
    await request(app.getHttpServer()).delete('/api/v1/clear-database');
    await app.close();
  });

  describe('Basic App Functionality', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: createdEntities.user.email,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Registration successful');
    });

    it('should register an admin user', async () => {
      const registerData = {
        email: createdEntities.admin.email,
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should login user and return tokens', async () => {
      const loginData = {
        email: createdEntities.user.email,
        password: 'TestPassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(createdEntities.user.email);

      authTokens.user = response.body.data.tokens.accessToken;
      createdEntities.user.id = response.body.data.user.id;
    });

    it('should login admin and return tokens', async () => {
      const loginData = {
        email: createdEntities.admin.email,
        password: 'AdminPassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      authTokens.admin = response.body.data.tokens.accessToken;
      createdEntities.admin.id = response.body.data.user.id;
    });

    it('should reject invalid login credentials', async () => {
      const invalidData = {
        email: createdEntities.user.email,
        password: 'WrongPassword',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(invalidData)
        .expect(401);
    });
  });

  describe('Categories Management', () => {
    it('should create a new category (admin)', async () => {
      const categoryData = {
        name: 'Italian Cuisine',
        description: 'Traditional Italian dishes and recipes',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.slug).toBe('italian-cuisine');

      createdEntities.category.id = response.body.data.id;
      createdEntities.category.slug = response.body.data.slug;
    });

    it('should get all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('Error Handling & Validation', () => {
    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email-format',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);
    });

    it('should require authentication for protected routes', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Test Category' })
        .expect(401);
    });

    it('should handle non-existent resource requests', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/categories/nonexistent-id')
        .expect(404);
    });
  });
});
