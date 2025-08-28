'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, recipeService } from '@/services';
import Navbar from '@/components/Navbar';
import { 
  CreateRecipeForm, 
  CreateRecipeIngredientForm, 
  CreateRecipeStepForm,
  DifficultyLevel,
  RecipeStatus,
  Category,
  Ingredient,
  IngredientCategory
} from '@/types/api.types';
import { HttpError } from '@/services/base/http.service';
import ImageUpload from '@/components/ImageUpload';

interface FormErrors {
  title?: string;
  description?: string;
  instructions?: string;
  prepTimeMinutes?: string;
  cookTimeMinutes?: string;
  servings?: string;
  categoryId?: string;
  ingredients?: string;
  steps?: string;
  general?: string;
}

export default function CreateRecipePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<CreateRecipeForm>({
    title: '',
    description: '',
    instructions: '',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    categoryId: '',
    difficulty: DifficultyLevel.EASY,
    status: RecipeStatus.DRAFT,
    imageUrl: '',
    additionalImages: [],
    tags: [],
    notes: '',
    ingredients: [],
    steps: [],
    nutritionalInfo: undefined,
  });
  
  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  
  // Form state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Load categories
        const categoriesData = await recipeService.getActiveCategories();
        setCategories(categoriesData);

        // Load initial ingredients (vegetables as default)
        try {
          const ingredientsData = await recipeService.getIngredientsByCategory(IngredientCategory.VEGETABLE);
          setAvailableIngredients(ingredientsData);
        } catch (error) {
          console.error('Failed to load ingredients:', error);
          setAvailableIngredients([]);
        }

      } catch (error) {
        console.error('Failed to initialize recipe creation page:', error);
        setErrors({ general: 'Failed to load required data. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Basic info validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    } else if (formData.instructions.length > 5000) {
      newErrors.instructions = 'Instructions must be less than 5000 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.prepTimeMinutes < 1 || formData.prepTimeMinutes > 480) {
      newErrors.prepTimeMinutes = 'Prep time must be between 1 and 480 minutes';
    }

    if (formData.cookTimeMinutes < 1 || formData.cookTimeMinutes > 960) {
      newErrors.cookTimeMinutes = 'Cook time must be between 1 and 960 minutes';
    }

    if (formData.servings < 1 || formData.servings > 50) {
      newErrors.servings = 'Servings must be between 1 and 50';
    }

    // Ingredients validation
    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    } else {
      for (let i = 0; i < formData.ingredients.length; i++) {
        const ingredient = formData.ingredients[i];
        if (!ingredient.ingredientId || ingredient.ingredientId.trim() === '') {
          newErrors.ingredients = `Ingredient ${i + 1} must be selected`;
          break;
        }
        if (ingredient.quantity <= 0) {
          newErrors.ingredients = `Ingredient ${i + 1} must have a valid quantity`;
          break;
        }
        if (!ingredient.unit || ingredient.unit.trim() === '') {
          newErrors.ingredients = `Ingredient ${i + 1} must have a unit`;
          break;
        }
      }
    }

    // Steps validation
    if (formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    } else {
      for (let i = 0; i < formData.steps.length; i++) {
        const step = formData.steps[i];
        if (!step.title || step.title.trim() === '') {
          newErrors.steps = `Step ${i + 1} must have a title`;
          break;
        }
        if (!step.instructions || step.instructions.trim() === '') {
          newErrors.steps = `Step ${i + 1} must have instructions`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Set status based on public/private choice
      const recipeData = {
        ...formData,
        status: isPublic ? RecipeStatus.PUBLISHED : RecipeStatus.DRAFT
      };

      console.log('Sending recipe data:', JSON.stringify(recipeData, null, 2));

      const createdRecipe = await recipeService.createRecipe(recipeData);
      
      console.log('Recipe created successfully:', createdRecipe);
      
      // Redirect to the created recipe
      router.push(`/recipes/${createdRecipe.id}`);
      
    } catch (error) {
      console.error('Failed to create recipe:', error);
      if (error instanceof HttpError) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'Failed to create recipe. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CreateRecipeForm, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  const addIngredient = () => {
    const newIngredient: CreateRecipeIngredientForm = {
      ingredientId: '',
      quantity: 1,
      unit: 'cup',
      preparation: ''
    };
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof CreateRecipeIngredientForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const addStep = () => {
    const newStep: CreateRecipeStepForm = {
      stepNumber: formData.steps.length + 1,
      title: '',
      instructions: ''
    };
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, field: keyof CreateRecipeStepForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading recipe creation form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Create New Recipe</h1>
            <p className="text-gray-600 text-xl">Share your delicious recipe with the community</p>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-lg">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Classic Spaghetti Carbonara"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your recipe..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.categoryId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
                </div>

                {/* Difficulty */}
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={DifficultyLevel.EASY}>😊 Easy</option>
                    <option value={DifficultyLevel.MEDIUM}>😐 Medium</option>
                    <option value={DifficultyLevel.HARD}>😅 Hard</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Recipe Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Photo
                  </label>
                  <ImageUpload
                    currentImageUrl={formData.imageUrl || ''}
                    onImageChange={(url) => handleInputChange('imageUrl', url)}
                    onError={(error) => setErrors(prev => ({ ...prev, general: error }))}
                    type="recipe"
                    size="lg"
                  />
                </div>

                {/* Public/Private Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Visibility
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        checked={isPublic}
                        onChange={() => setIsPublic(true)}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">🌍 Public</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!isPublic}
                        onChange={() => setIsPublic(false)}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">🔒 Private (Draft)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isPublic ? 'Your recipe will be visible to everyone' : 'Your recipe will be saved as a draft'}
                  </p>
                </div>
              </div>
            </div>

            {/* Time and Servings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (minutes) *
                </label>
                <input
                  type="number"
                  id="prepTime"
                  min="1"
                  max="480"
                  value={formData.prepTimeMinutes}
                  onChange={(e) => handleInputChange('prepTimeMinutes', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.prepTimeMinutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.prepTimeMinutes && <p className="text-red-500 text-sm mt-1">{errors.prepTimeMinutes}</p>}
              </div>

              <div>
                <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Cook Time (minutes) *
                </label>
                <input
                  type="number"
                  id="cookTime"
                  min="1"
                  max="960"
                  value={formData.cookTimeMinutes}
                  onChange={(e) => handleInputChange('cookTimeMinutes', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.cookTimeMinutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cookTimeMinutes && <p className="text-red-500 text-sm mt-1">{errors.cookTimeMinutes}</p>}
              </div>

              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                  Servings *
                </label>
                <input
                  type="number"
                  id="servings"
                  min="1"
                  max="50"
                  value={formData.servings}
                  onChange={(e) => handleInputChange('servings', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.servings ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.servings && <p className="text-red-500 text-sm mt-1">{errors.servings}</p>}
              </div>
            </div>
          </div>

            {/* Instructions */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">Cooking Instructions</h2>
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                General Instructions *
              </label>
              <textarea
                id="instructions"
                rows={6}
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Provide general cooking instructions and overview..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.instructions ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
              <p className="text-gray-500 text-sm mt-1">
                Add detailed step-by-step instructions below.
              </p>
            </div>
          </div>

            {/* Ingredients */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Ingredients</h2>
                  <p className="text-gray-600 text-lg">Add all ingredients needed for your recipe</p>
                </div>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
                >
                  <span className="mr-2 transform group-hover:scale-110 transition-transform">+</span>
                  Add Ingredient
                </button>
              </div>

              {errors.ingredients && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 shadow-lg">
                  {errors.ingredients}
                </div>
              )}

              {formData.ingredients.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="text-gray-400 text-3xl mb-4">🥕</div>
                  <p className="text-gray-500 text-lg font-semibold mb-2">No ingredients added yet</p>
                  <p className="text-gray-400">Click &quot;Add Ingredient&quot; to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      {/* Ingredient Selection */}
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ingredient *
                        </label>
                        {availableIngredients.length > 0 ? (
                          <select
                            value={ingredient.ingredientId}
                            onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select ingredient</option>
                            {availableIngredients.map(ing => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={ingredient.ingredientId}
                            onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                            placeholder="Enter ingredient name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount *
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Unit */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit *
                        </label>
                        <select
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="cup">cup</option>
                          <option value="tbsp">tbsp</option>
                          <option value="tsp">tsp</option>
                          <option value="oz">oz</option>
                          <option value="lb">lb</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="piece">piece</option>
                          <option value="slice">slice</option>
                          <option value="clove">clove</option>
                          <option value="bunch">bunch</option>
                          <option value="pinch">pinch</option>
                          <option value="to taste">to taste</option>
                        </select>
                      </div>

                                              {/* Preparation */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preparation
                          </label>
                          <input
                            type="text"
                            value={ingredient.preparation || ''}
                            onChange={(e) => updateIngredient(index, 'preparation', e.target.value)}
                            placeholder="e.g., finely chopped, diced"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                      {/* Remove Button */}
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Steps */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Step-by-Step Instructions</h2>
                  <p className="text-gray-600 text-lg">Add detailed cooking steps</p>
                </div>
                <button
                  type="button"
                  onClick={addStep}
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
                >
                  <span className="mr-2 transform group-hover:scale-110 transition-transform">+</span>
                  Add Step
                </button>
              </div>

              {errors.steps && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 shadow-lg">
                  {errors.steps}
                </div>
              )}

              {formData.steps.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="text-gray-400 text-3xl mb-4">👨‍🍳</div>
                  <p className="text-gray-500 text-lg font-semibold mb-2">No steps added yet</p>
                  <p className="text-gray-400">Click &quot;Add Step&quot; to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                        {/* Step Number */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                          {index + 1}
                        </div>

                      {/* Step Content */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Step Title *
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="e.g., Prepare the sauce"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instructions *
                          </label>
                          <textarea
                            rows={3}
                            value={step.instructions}
                            onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                            placeholder="Detailed instructions for this step..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="flex-shrink-0 text-red-600 hover:text-red-800 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="group px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                {saving ? (
                  <span className="flex items-center">
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating Recipe...
                  </span>
                ) : (
                  <span className="flex items-center">
                    {isPublic ? 'Publish Recipe' : 'Save as Draft'}
                    <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 