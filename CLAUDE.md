# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack recipe management application with JWT authentication, image uploads, and role-based access control. The application consists of:

- **Backend**: NestJS API with PostgreSQL database
- **Frontend**: Next.js with TypeScript and Tailwind CSS

## Development Commands

### Backend (from `backend/` directory)
```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debug mode

# Build and Production  
npm run build              # Build the application
npm run start:prod         # Run production build

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier
```

### Frontend (from `frontend/` directory)
```bash
# Development
npm run dev                # Start development server with Turbopack

# Build and Production
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run Next.js ESLint
```

## Architecture Overview

### Backend Structure
- **Modular Architecture**: Feature-based modules (auth, users, recipes, categories, ingredients, uploads)
- **JWT Authentication**: Passport.js with JWT strategy and role-based guards
- **Database**: TypeORM with PostgreSQL, automatic migrations
- **File Uploads**: Multer for avatars and recipe images stored in `uploads/` directory
- **Security**: Helmet, throttling, bcrypt password hashing
- **API Documentation**: Swagger available at `/api/docs`

### Key Backend Modules
- `auth/`: JWT authentication, login/register endpoints
- `users/`: User management with roles (USER/ADMIN) 
- `recipes/`: Recipe CRUD with ingredients, steps, categories, and images
- `categories/`: Hierarchical recipe categorization
- `ingredients/`: Ingredient database with nutritional info
- `uploads/`: Secure file upload handling

### Frontend Structure
- **App Router**: Next.js 14+ with TypeScript
- **API Layer**: Custom HTTP service with error handling and auth token management
- **Pages**: Route-based organization with admin dashboard
- **Services**: Centralized API calls with typed responses
- **Components**: Reusable UI components (Navbar, ImageUpload, ConfirmationDialog)

### Database Entities
- **User**: Authentication, profile info, roles
- **Recipe**: Main recipe entity with status (DRAFT/PUBLISHED/ARCHIVED) and difficulty levels
- **RecipeIngredient**: Junction table with quantities and units
- **RecipeStep**: Ordered cooking instructions
- **Category**: Hierarchical categorization
- **Ingredient**: Ingredient database with nutritional data

## Important Patterns

### Authentication Flow
- Backend uses JWT tokens with Passport strategies
- Frontend stores tokens and manages auth state
- Protected routes use `JwtAuthGuard` and `RolesGuard`
- Role-based access control (USER/ADMIN roles)

### API Response Format
All API responses follow a standard format defined in `ApiResponse<T>` type:
```typescript
{
  success: boolean
  message: string
  data?: T
  error?: string
}
```

### File Upload Handling
- Images stored in `backend/uploads/` with organized subdirectories
- Frontend uses `ImageUpload` component with preview and validation
- Multer configuration validates file types and sizes

### Error Handling
- Backend uses NestJS exception filters
- Frontend uses custom `HttpError` class with status codes
- Centralized error handling in HTTP service

## Configuration

### Environment Variables
Backend requires:
- Database connection (PostgreSQL)
- JWT secret and expiration
- Throttling configuration
- Port configuration

Frontend requires:
- API URL (`NEXT_PUBLIC_API_URL`)
- NextAuth configuration

### Database Setup
- TypeORM handles entity management and migrations
- Entities are automatically loaded from module imports
- Database configuration in `backend/src/config/database.config.ts`

## Development Notes

- Both backend and frontend use TypeScript with strict type checking
- ESLint and Prettier configured for consistent code style
- Backend uses NestJS decorators extensively for validation and authorization
- Frontend uses modern React patterns with hooks and functional components
- Image uploads are validated for type, size, and security
- Database relationships are properly defined with TypeORM decorators
- API endpoints follow RESTful conventions with proper HTTP status codes