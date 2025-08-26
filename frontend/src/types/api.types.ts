// Base API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T | null;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: DifficultyLevel;
  status: RecipeStatus;
  imageUrl?: string;
  additionalImages?: string[];
  tags?: string[];
  nutritionalInfo?: NutritionalInfo;
  notes?: string;
  viewsCount: number;
  likesCount: number;
  isFeatured: boolean;
  isActive: boolean;
  authorId: string;
  author?: User;
  categoryId: string;
  category?: Category;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
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
  category: Pick<Category, 'id' | 'name' | 'icon'>;
  createdAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredient?: Ingredient;
  quantity: number;
  unit: string;
  preparation?: string;
  isOptional: boolean;
  order: number;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  title: string;
  instructions: string;
  timeMinutes?: number;
  imageUrl?: string;
  tips?: string;
  temperature?: string;
  equipment?: string[];
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
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
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  recipeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Ingredient Types
export interface Ingredient {
  id: string;
  name: string;
  description: string;
  category: IngredientCategory;
  imageUrl?: string;
  caloriesPerUnit?: number;
  defaultUnit: string;
  isActive: boolean;
  allergenInfo?: string;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export enum IngredientCategory {
  VEGETABLE = 'vegetable',
  FRUIT = 'fruit',
  MEAT = 'meat',
  SEAFOOD = 'seafood',
  DAIRY = 'dairy',
  GRAIN = 'grain',
  SPICE = 'spice',
  HERB = 'herb',
  CONDIMENT = 'condiment',
  BAKING = 'baking',
  OIL = 'oil',
  BEVERAGE = 'beverage',
  OTHER = 'other'
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
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  categoryId: string;
  difficulty?: DifficultyLevel;
  status?: RecipeStatus;
  imageUrl?: string;
  additionalImages?: string[];
  tags?: string[];
  nutritionalInfo?: NutritionalInfo;
  notes?: string;
  ingredients: CreateRecipeIngredientForm[];
  steps: CreateRecipeStepForm[];
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