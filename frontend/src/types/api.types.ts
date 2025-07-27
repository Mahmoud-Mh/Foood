// Base API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Recipe Types
export interface Recipe {
  id: string;
  title: string;
  description: string;
  summary?: string;
  difficulty: DifficultyLevel;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  status: RecipeStatus;
  imageUrl?: string;
  videoUrl?: string;
  tags: string[];
  nutritionalInfo?: NutritionalInfo;
  rating: number;
  ratingsCount: number;
  viewsCount: number;
  author: User;
  category: Category;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeListItem {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  totalTimeMinutes: number;
  servings: number;
  imageUrl?: string;
  rating: number;
  ratingsCount: number;
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  category: Pick<Category, 'id' | 'name' | 'color'>;
  createdAt: string;
}

export interface RecipeIngredient {
  id: string;
  quantity: number;
  unit: string;
  preparation?: string;
  isOptional: boolean;
  order: number;
  ingredient: Ingredient;
  displayText: string;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  title: string;
  instructions: string;
  timeMinutes?: number;
  imageUrl?: string;
  tips?: string;
  temperature?: string;
  equipment?: string[];
  isActive: boolean;
  displayTitle: string;
  timeDisplay: string;
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum RecipeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  recipesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Ingredient Types
export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
  bio?: string;
}

export interface CreateRecipeForm {
  title: string;
  description: string;
  summary?: string;
  difficulty: DifficultyLevel;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  categoryId: string;
  imageUrl?: string;
  videoUrl?: string;
  tags: string[];
  ingredients: CreateRecipeIngredientForm[];
  steps: CreateRecipeStepForm[];
  nutritionalInfo?: NutritionalInfo;
}

export interface CreateRecipeIngredientForm {
  ingredientId: string;
  quantity: number;
  unit: string;
  preparation?: string;
  isOptional?: boolean;
  order?: number;
}

export interface CreateRecipeStepForm {
  stepNumber: number;
  title: string;
  instructions: string;
  timeMinutes?: number;
  imageUrl?: string;
  tips?: string;
  temperature?: string;
  equipment?: string[];
}

// Search and Filter Types
export interface RecipeFilters {
  category?: string;
  difficulty?: DifficultyLevel;
  maxTime?: number;
  rating?: number;
  tags?: string[];
  status?: RecipeStatus;
}

export interface SearchParams {
  query?: string;
  filters?: RecipeFilters;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating' | 'title' | 'totalTime';
  sortOrder?: 'asc' | 'desc';
} 