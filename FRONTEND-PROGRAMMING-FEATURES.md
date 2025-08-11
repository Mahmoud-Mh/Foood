# 🎨 **Fonctionnalités de Programmation Frontend - Guide Complet**

## 📋 **Table des Matières**

- [🔧 **Exports & Imports**](#-exports--imports)
- [🏗️ **Composants React**](#️-composants-react)
- [⚡ **Hooks React**](#-hooks-react)
- [🔗 **This & Context**](#-this--context)
- [📊 **Static & Instance**](#-static--instance)
- [🎯 **Interfaces & Types**](#-interfaces--types)
- [🔧 **Décorateurs & Props**](#-décorateurs--props)
- [🛡️ **Validation & Gestion d'État**](#️-validation--gestion-détat)
- [📝 **Services & API**](#-services--api)
- [🗄️ **Routing & Navigation**](#️-routing--navigation)
- [⚙️ **Configuration & Utils**](#-configuration--utils)
- [🔐 **Authentification Frontend**](#-authentification-frontend)
- [📚 **Documentation & Types**](#-documentation--types)

---

## 🔧 **Exports & Imports**

### **Export de Composants**
```typescript
// Export par défaut
export default function HomePage() {
  return <div>Welcome to our app</div>;
}

// Export nommé
export function Navbar() {
  return <nav>Navigation</nav>;
}

// Export multiple
export { Button, Card, Modal };
```

### **Import de Modules**
```typescript
// Import de React
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Import de Next.js
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

// Import de dépendances externes
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Import de fichiers locaux
import { Recipe } from '@/types/api.types';
import { recipeService } from '@/services';
import Navbar from '@/components/Navbar';
```

### **Import/Export de Types**
```typescript
// Export d'interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
}

// Import de types
import { Recipe, Category, User } from '@/types/api.types';
import { ApiResponse } from '@/types/api.types';
```

---

## 🏗️ **Composants React**

### **Composants Fonctionnels**
```typescript
// Composant fonctionnel simple
export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold">{recipe.title}</h3>
      <p className="text-gray-600">{recipe.description}</p>
    </div>
  );
}

// Composant avec props typées
interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold">{recipe.title}</h3>
      <p className="text-gray-600">{recipe.description}</p>
      <div className="flex gap-2 mt-4">
        {onEdit && (
          <button 
            onClick={() => onEdit(recipe.id)}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button 
            onClick={() => onDelete(recipe.id)}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
```

### **Composants avec Children**
```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
```

### **Composants avec État Local**
```typescript
export function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return (
    <div className="flex items-center gap-4">
      <button onClick={decrement} className="bg-red-500 text-white px-3 py-1 rounded">
        -
      </button>
      <span className="text-xl font-bold">{count}</span>
      <button onClick={increment} className="bg-green-500 text-white px-3 py-1 rounded">
        +
      </button>
    </div>
  );
}
```

---

## ⚡ **Hooks React**

### **useState Hook**
```typescript
// État simple
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// État complexe
const [formData, setFormData] = useState({
  title: '',
  description: '',
  ingredients: [],
  instructions: ''
});

// Mise à jour d'état
const updateFormData = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

// État avec type personnalisé
const [recipes, setRecipes] = useState<Recipe[]>([]);
const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
```

### **useEffect Hook**
```typescript
// Effet simple
useEffect(() => {
  console.log('Component mounted');
}, []);

// Effet avec dépendances
useEffect(() => {
  if (userId) {
    fetchUserRecipes(userId);
  }
}, [userId]);

// Effet de nettoyage
useEffect(() => {
  const interval = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, []);

// Effet avec async
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await recipeService.getAll();
      setRecipes(response.data);
    } catch (error) {
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### **useRouter Hook**
```typescript
import { useRouter } from 'next/navigation';

export function NavigationButtons() {
  const router = useRouter();

  const goToHome = () => router.push('/');
  const goToRecipes = () => router.push('/recipes');
  const goBack = () => router.back();

  return (
    <div className="flex gap-2">
      <button onClick={goToHome} className="bg-blue-500 text-white px-4 py-2 rounded">
        Home
      </button>
      <button onClick={goToRecipes} className="bg-green-500 text-white px-4 py-2 rounded">
        Recipes
      </button>
      <button onClick={goBack} className="bg-gray-500 text-white px-4 py-2 rounded">
        Back
      </button>
    </div>
  );
}
```

### **useParams Hook**
```typescript
import { useParams } from 'next/navigation';

export function RecipeDetail() {
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (recipeId) {
      fetchRecipe(recipeId);
    }
  }, [recipeId]);

  return (
    <div>
      {recipe ? (
        <div>
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
```

### **useSearchParams Hook**
```typescript
import { useSearchParams } from 'next/navigation';

export function RecipeFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/recipes?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <select 
        value={category || ''} 
        onChange={(e) => updateFilters({ category: e.target.value })}
        className="border rounded px-3 py-1"
      >
        <option value="">All Categories</option>
        <option value="main">Main Course</option>
        <option value="dessert">Dessert</option>
      </select>
      
      <select 
        value={difficulty || ''} 
        onChange={(e) => updateFilters({ difficulty: e.target.value })}
        className="border rounded px-3 py-1"
      >
        <option value="">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
  );
}
```

---

## 🔗 **This & Context**

### **This dans les Composants de Classe**
```typescript
// Composant de classe (legacy)
class RecipeForm extends React.Component<RecipeFormProps, RecipeFormState> {
  constructor(props: RecipeFormProps) {
    super(props);
    this.state = {
      title: '',
      description: '',
      loading: false
    };
  }

  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    this.setState({ loading: true });
    // this.props.onSubmit(this.state);
  };

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input
          name="title"
          value={this.state.title}
          onChange={this.handleChange}
          className="border rounded px-3 py-2"
        />
      </form>
    );
  }
}
```

### **Context API**
```typescript
// Création du contexte
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Provider du contexte
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      localStorage.setItem('token', response.access_token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    // Vérifier le token au chargement
    const token = localStorage.getItem('token');
    if (token) {
      authService.getProfile().then(setUser).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 📊 **Static & Instance**

### **Méthodes Statiques**
```typescript
// Utils statiques
export class FormUtils {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Constantes statiques
export const API_ENDPOINTS = {
  RECIPES: '/api/v1/recipes',
  USERS: '/api/v1/users',
  AUTH: '/api/v1/auth',
  CATEGORIES: '/api/v1/categories'
} as const;
```

### **Propriétés Statiques**
```typescript
// Énumérations
export enum RecipeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

// Constantes
export const RECIPE_CATEGORIES = [
  { id: 'main', name: 'Main Course' },
  { id: 'appetizer', name: 'Appetizer' },
  { id: 'dessert', name: 'Dessert' },
  { id: 'beverage', name: 'Beverage' }
] as const;
```

### **Méthodes d'Instance**
```typescript
// Services avec méthodes d'instance
export class RecipeService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async getAll(): Promise<ApiResponse<Recipe[]>> {
    const response = await axios.get(`${this.baseURL}/recipes`);
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<Recipe>> {
    const response = await axios.get(`${this.baseURL}/recipes/${id}`);
    return response.data;
  }

  async create(recipe: CreateRecipeDto): Promise<ApiResponse<Recipe>> {
    const response = await axios.post(`${this.baseURL}/recipes`, recipe);
    return response.data;
  }

  async update(id: string, recipe: UpdateRecipeDto): Promise<ApiResponse<Recipe>> {
    const response = await axios.put(`${this.baseURL}/recipes/${id}`, recipe);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await axios.delete(`${this.baseURL}/recipes/${id}`);
    return response.data;
  }
}
```

---

## 🎯 **Interfaces & Types**

### **Interfaces de Props**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

interface FormProps {
  onSubmit: (data: any) => void;
  initialValues?: any;
  validationSchema?: any;
  children: React.ReactNode;
}
```

### **Interfaces de Données**
```typescript
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: DifficultyLevel;
  status: RecipeStatus;
  imageUrl?: string;
  author: User;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  recipeCount: number;
}
```

### **Types Union & Intersection**
```typescript
// Types union
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
type ModalSize = 'small' | 'medium' | 'large';
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// Types intersection
type AdminUser = User & { role: 'admin' };
type RecipeWithAuthor = Recipe & { author: User };

// Types génériques
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
};

type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
```

---

## 🔧 **Décorateurs & Props**

### **Props Destructuring**
```typescript
// Props destructuring simple
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return <div>{recipe.title}</div>;
}

// Props destructuring avec valeurs par défaut
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// Props avec rest operator
export function Form({ onSubmit, children, ...formProps }: FormProps) {
  return (
    <form onSubmit={onSubmit} {...formProps}>
      {children}
    </form>
  );
}
```

### **Props Spreading**
```typescript
// Spreading des props
export function Input({ className, ...props }: InputProps) {
  return (
    <input 
      className={`border rounded px-3 py-2 ${className || ''}`}
      {...props}
    />
  );
}

// Props forwarding
export function Card({ children, ...props }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4" {...props}>
      {children}
    </div>
  );
}
```

---

## 🛡️ **Validation & Gestion d'État**

### **Validation de Formulaires**
```typescript
// Validation manuelle
const validateForm = (data: CreateRecipeDto): string[] => {
  const errors: string[] = [];

  if (!data.title.trim()) {
    errors.push('Title is required');
  }

  if (!data.description.trim()) {
    errors.push('Description is required');
  }

  if (data.prepTimeMinutes <= 0) {
    errors.push('Preparation time must be greater than 0');
  }

  if (data.cookTimeMinutes <= 0) {
    errors.push('Cooking time must be greater than 0');
  }

  if (data.servings <= 0) {
    errors.push('Servings must be greater than 0');
  }

  return errors;
};

// Hook de validation personnalisé
export function useFormValidation<T>(initialValues: T, validationSchema: any) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validation en temps réel
    if (touched[field]) {
      const fieldError = validateField(field, value, validationSchema);
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, values[field], validationSchema);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isValid,
    setValues
  };
}
```

### **Gestion d'État Global**
```typescript
// Reducer pour gestion d'état complexe
type RecipeAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null };

interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
}

const recipeReducer = (state: RecipeState, action: RecipeAction): RecipeState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload, error: null };
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe => 
          recipe.id === action.payload.id ? action.payload : recipe
        )
      };
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload)
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Hook personnalisé avec useReducer
export function useRecipes() {
  const [state, dispatch] = useReducer(recipeReducer, {
    recipes: [],
    loading: false,
    error: null
  });

  const fetchRecipes = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await recipeService.getAll();
      dispatch({ type: 'SET_RECIPES', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch recipes' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addRecipe = async (recipe: CreateRecipeDto) => {
    try {
      const response = await recipeService.create(recipe);
      dispatch({ type: 'ADD_RECIPE', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create recipe' });
    }
  };

  return {
    ...state,
    fetchRecipes,
    addRecipe
  };
}
```

---

## 📝 **Services & API**

### **Services API**
```typescript
// Service de base
export class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }
}

// Service spécifique pour les recettes
export class RecipeService extends ApiService {
  async getAll(params?: RecipeFilters): Promise<ApiResponse<Recipe[]>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/recipes${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.get<Recipe[]>(endpoint);
  }

  async getById(id: string): Promise<ApiResponse<Recipe>> {
    return this.get<Recipe>(`/recipes/${id}`);
  }

  async create(recipe: CreateRecipeDto): Promise<ApiResponse<Recipe>> {
    return this.post<Recipe>('/recipes', recipe);
  }

  async update(id: string, recipe: UpdateRecipeDto): Promise<ApiResponse<Recipe>> {
    return this.put<Recipe>(`/recipes/${id}`, recipe);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/recipes/${id}`);
  }
}
```

### **Hooks pour API**
```typescript
// Hook personnalisé pour les appels API
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Utilisation
export function RecipeList() {
  const { data: recipes, loading, error, refetch } = useApi(
    () => recipeService.getAll(),
    []
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {recipes?.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
```

---

## 🗄️ **Routing & Navigation**

### **Navigation Programmatique**
```typescript
import { useRouter } from 'next/navigation';

export function RecipeActions({ recipe }: { recipe: Recipe }) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/recipes/${recipe.id}/edit`);
  };

  const handleView = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await recipeService.delete(recipe.id);
        router.push('/recipes');
        toast.success('Recipe deleted successfully');
      } catch (error) {
        toast.error('Failed to delete recipe');
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleView} className="bg-blue-500 text-white px-3 py-1 rounded">
        View
      </button>
      <button onClick={handleEdit} className="bg-yellow-500 text-white px-3 py-1 rounded">
        Edit
      </button>
      <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1 rounded">
        Delete
      </button>
    </div>
  );
}
```

### **Navigation avec Paramètres**
```typescript
export function CategoryNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateWithFilters = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/recipes?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <button 
        onClick={() => navigateWithFilters({ category: 'main' })}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Main Course
      </button>
      <button 
        onClick={() => navigateWithFilters({ category: 'dessert' })}
        className="bg-purple-500 text-white px-4 py-2 rounded"
      >
        Desserts
      </button>
      <button 
        onClick={() => navigateWithFilters({})}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        All Recipes
      </button>
    </div>
  );
}
```

---

## ⚙️ **Configuration & Utils**

### **Configuration d'Application**
```typescript
// Configuration d'environnement
export const config = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    timeout: 10000
  },
  app: {
    name: 'Recipe App',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  },
  features: {
    enableNotifications: true,
    enableOfflineMode: false,
    enableAnalytics: process.env.NODE_ENV === 'production'
  }
} as const;

// Utils de formatage
export class Formatters {
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
```

### **Hooks Utilitaires**
```typescript
// Hook pour le debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook pour le localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook pour la détection de clic en dehors
export function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

---

## 🔐 **Authentification Frontend**

### **Service d'Authentification**
```typescript
export class AuthService extends ApiService {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/auth/login', {
      email,
      password
    });
    
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }
    
    return response;
  }

  async register(userData: RegisterDto): Promise<ApiResponse<User>> {
    return this.post<User>('/auth/register', userData);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<LoginResponse>('/auth/refresh', {
      refreshToken
    });

    if (response.success && response.data) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/profile');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
```

### **Hook d'Authentification**
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.data?.user || null);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const checkAuth = async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getProfile();
      setUser(response.data || null);
    } catch (error) {
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
}
```

---

## 📚 **Documentation & Types**

### **Types de Documentation**
```typescript
/**
 * Props pour le composant RecipeCard
 */
interface RecipeCardProps {
  /** La recette à afficher */
  recipe: Recipe;
  /** Callback appelé lors du clic sur "Edit" */
  onEdit?: (id: string) => void;
  /** Callback appelé lors du clic sur "Delete" */
  onDelete?: (id: string) => void;
  /** Classes CSS supplémentaires */
  className?: string;
}

/**
 * Hook personnalisé pour gérer les recettes
 * @param initialFilters - Filtres initiaux pour les recettes
 * @returns Objet contenant les recettes, l'état de chargement et les fonctions de gestion
 */
export function useRecipes(initialFilters?: RecipeFilters) {
  // Implementation
}

/**
 * Service pour les opérations CRUD sur les recettes
 */
export class RecipeService {
  /**
   * Récupère toutes les recettes avec filtres optionnels
   * @param filters - Filtres à appliquer
   * @returns Promise contenant les recettes
   */
  async getAll(filters?: RecipeFilters): Promise<ApiResponse<Recipe[]>> {
    // Implementation
  }

  /**
   * Crée une nouvelle recette
   * @param recipe - Données de la recette à créer
   * @returns Promise contenant la recette créée
   */
  async create(recipe: CreateRecipeDto): Promise<ApiResponse<Recipe>> {
    // Implementation
  }
}
```

### **Types Avancés**
```typescript
// Types conditionnels
type RecipeStatus = 'draft' | 'published' | 'archived';
type RecipeWithStatus<T extends RecipeStatus> = Recipe & { status: T };

// Types utilitaires
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Types pour les formulaires
type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
};

type RecipeForm = {
  title: FormField<string>;
  description: FormField<string>;
  prepTimeMinutes: FormField<number>;
  cookTimeMinutes: FormField<number>;
  servings: FormField<number>;
  difficulty: FormField<DifficultyLevel>;
  categoryId: FormField<string>;
};

// Types pour les événements
type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
type FormSubmitEvent = React.FormEvent<HTMLFormElement>;
type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>;
```

---

## 🎯 **Résumé des Fonctionnalités**

### **🔧 Exports/Imports**
- `export default` : Export par défaut de composants
- `export function` : Export nommé de fonctions
- `import { }` : Import nommé
- `import * as` : Import de tout le module

### **🏗️ Composants React**
- `function Component()` : Composants fonctionnels
- `interface Props` : Types pour les props
- `children: React.ReactNode` : Props pour le contenu enfant
- `...props` : Spreading des props

### **⚡ Hooks React**
- `useState()` : Gestion d'état local
- `useEffect()` : Effets de bord
- `useRouter()` : Navigation Next.js
- `useParams()` : Paramètres d'URL
- `useSearchParams()` : Paramètres de requête

### **🔗 This & Context**
- `this` : Dans les composants de classe
- `React.createContext()` : Création de contexte
- `useContext()` : Utilisation de contexte
- `Context.Provider` : Provider de contexte

### **📊 Static & Instance**
- `static method()` : Méthodes statiques
- `const` : Constantes
- `enum` : Énumérations
- `instance.method()` : Méthodes d'instance

### **🎯 Interfaces & Types**
- `interface` : Définition d'interface
- `type` : Types personnalisés
- `generic<T>` : Types génériques
- `union |` : Types union

### **🔧 Décorateurs & Props**
- `{ prop }` : Destructuring des props
- `{ prop = defaultValue }` : Props avec valeurs par défaut
- `...props` : Rest operator pour props
- `React.ReactNode` : Type pour le contenu enfant

### **🛡️ Validation & Gestion d'État**
- `useReducer()` : Gestion d'état complexe
- `useCallback()` : Mémorisation de fonctions
- `useMemo()` : Mémorisation de valeurs
- `custom hooks` : Hooks personnalisés

### **📝 Services & API**
- `class Service` : Classes de service
- `async/await` : Appels API asynchrones
- `fetch()` : Requêtes HTTP
- `axios` : Client HTTP

### **🗄️ Routing & Navigation**
- `useRouter()` : Navigation programmatique
- `router.push()` : Navigation vers une page
- `router.back()` : Retour en arrière
- `Link` : Navigation côté client

### **⚙️ Configuration & Utils**
- `process.env` : Variables d'environnement
- `localStorage` : Stockage local
- `sessionStorage` : Stockage de session
- `utils classes` : Classes utilitaires

### **🔐 Authentification Frontend**
- `AuthService` : Service d'authentification
- `useAuth()` : Hook d'authentification
- `localStorage` : Stockage des tokens
- `refresh tokens` : Renouvellement de tokens

### **📚 Documentation & Types**
- `JSDoc` : Documentation de code
- `TypeScript` : Types statiques
- `interfaces` : Contrats de types
- `generics` : Types génériques

Cette liste couvre **toutes les fonctionnalités de programmation** utilisées dans le frontend Next.js/React ! 🚀 