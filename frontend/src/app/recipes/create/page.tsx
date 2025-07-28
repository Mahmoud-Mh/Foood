'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  IngredientCategory,
  NutritionalInfo
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
  const [activeTab, setActiveTab] = useState<'basic' | 'ingredients' | 'steps' | 'additional'>('basic');

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
        console.log('Loaded categories:', categoriesData);

        // Load initial ingredients (vegetables as default)
        try {
          const ingredientsData = await recipeService.getIngredientsByCategory(IngredientCategory.VEGETABLE);
          setAvailableIngredients(ingredientsData);
          console.log('Loaded ingredients:', ingredientsData);
        } catch (error) {
          console.error('Failed to load ingredients:', error);
          // Set empty array as fallback
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
      // Check each ingredient
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
      // Check each step
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
      // Switch to first tab with errors
      if (errors.title || errors.description || errors.categoryId) {
        setActiveTab('basic');
      } else if (errors.ingredients) {
        setActiveTab('ingredients');
      } else if (errors.steps) {
        setActiveTab('steps');
      }
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Clean up the form data before sending
      const cleanedFormData = {
        ...formData,
        // Convert empty strings to undefined for optional image fields
        imageUrl: formData.imageUrl?.trim() || undefined,
        additionalImages: formData.additionalImages?.filter(url => url?.trim()) || undefined,
        // Clean up step images and ensure step numbers are correct
        steps: formData.steps.map((step, index) => ({
          ...step,
          stepNumber: index + 1,
          imageUrl: step.imageUrl?.trim() || undefined
        })),
        // Filter out ingredients with empty IDs and ensure they have valid data
        ingredients: formData.ingredients
          .filter(ing => ing.ingredientId?.trim())
          .map((ingredient, index) => ({
            ...ingredient,
            order: index + 1,
            // If ingredientId is not a UUID (manual entry), we'll need to handle this differently
            // For now, we'll keep it as is and let the backend handle validation
            ingredientId: ingredient.ingredientId.trim()
          }))
      };

      console.log('Sending recipe data to backend:', JSON.stringify(cleanedFormData, null, 2));

      const recipe = await recipeService.createRecipe(cleanedFormData);
      router.push(`/recipes/${recipe.id}`);
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

  const handleInputChange = (field: keyof CreateRecipeForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const addIngredient = () => {
    const newIngredient: CreateRecipeIngredientForm = {
      ingredientId: '',
      quantity: 1,
      unit: 'cup',
      preparation: '',
      isOptional: false,
      order: formData.ingredients.length + 1
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

  const updateIngredient = (index: number, field: keyof CreateRecipeIngredientForm, value: any) => {
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
      instructions: '',
      timeMinutes: 0,
      tips: '',
      temperature: '',
      equipment: []
    };
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        stepNumber: i + 1
      }))
    }));
  };

  const updateStep = (index: number, field: keyof CreateRecipeStepForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Recipe</h1>
            <p className="text-gray-600 mt-1">Share your culinary creation with the community</p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4">
              {errors.general}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'basic', label: 'Basic Info', icon: '📝' },
                { id: 'ingredients', label: 'Ingredients', icon: '🥕' },
                { id: 'steps', label: 'Instructions', icon: '👨‍🍳' },
                { id: 'additional', label: 'Additional', icon: '✨' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Recipe Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                          Recipe Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Enter a delicious recipe name..."
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
                    </div>
                  </div>

                  {/* Time and Servings Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  {/* Instructions */}
                  <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe Instructions *
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
                      Detailed step-by-step instructions will be added in the Instructions tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Ingredients Tab */}
              {activeTab === 'ingredients' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recipe Ingredients</h3>
                      <p className="text-gray-600">Add all ingredients needed for your recipe</p>
                    </div>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      <span className="mr-2">+</span>
                      Add Ingredient
                    </button>
                  </div>

                  {errors.ingredients && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                      {errors.ingredients}
                    </div>
                  )}

                  {formData.ingredients.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 text-lg mb-2">🥕</div>
                      <p className="text-gray-500">No ingredients added yet</p>
                      <p className="text-gray-400 text-sm">Click "Add Ingredient" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.ingredients.map((ingredient, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                                      {ing.name} ({ing.defaultUnit})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Enter ingredient name"
                                  value={ingredient.ingredientId}
                                  onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {availableIngredients.length > 0 
                                  ? "Don't see your ingredient? You can type it manually below."
                                  : "Ingredients couldn't be loaded. Please type ingredient names manually."
                                }
                              </p>
                            </div>

                            {/* Quantity */}
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
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
                                <option value="cups">cups</option>
                                <option value="tbsp">tbsp</option>
                                <option value="tsp">tsp</option>
                                <option value="oz">oz</option>
                                <option value="lb">lb</option>
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="piece">piece</option>
                                <option value="pieces">pieces</option>
                                <option value="clove">clove</option>
                                <option value="cloves">cloves</option>
                                <option value="slice">slice</option>
                                <option value="slices">slices</option>
                                <option value="pinch">pinch</option>
                                <option value="dash">dash</option>
                                <option value="to taste">to taste</option>
                              </select>
                            </div>

                            {/* Optional Checkbox */}
                            <div className="md:col-span-2 flex items-center justify-center pt-8">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={ingredient.isOptional || false}
                                  onChange={(e) => updateIngredient(index, 'isOptional', e.target.checked)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Optional</span>
                              </label>
                            </div>

                            {/* Remove Button */}
                            <div className="md:col-span-1 flex items-center justify-center pt-8">
                              <button
                                type="button"
                                onClick={() => removeIngredient(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove ingredient"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Preparation Notes */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preparation Notes (optional)
                            </label>
                            <input
                              type="text"
                              value={ingredient.preparation || ''}
                              onChange={(e) => updateIngredient(index, 'preparation', e.target.value)}
                              placeholder="e.g., finely chopped, diced, at room temperature..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Ingredients */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Load Ingredients by Category</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {Object.values(IngredientCategory).map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={async () => {
                            try {
                              const ingredients = await recipeService.getIngredientsByCategory(category);
                              setAvailableIngredients(prev => {
                                const existingIds = new Set(prev.map(ing => ing.id));
                                const newIngredients = ingredients.filter(ing => !existingIds.has(ing.id));
                                return [...prev, ...newIngredients];
                              });
                            } catch (error) {
                              console.error('Failed to load ingredients:', error);
                            }
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition capitalize"
                        >
                          {category.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Click categories to load more ingredient options.
                    </p>
                  </div>
                </div>
              )}

              {/* Steps Tab */}
              {activeTab === 'steps' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Cooking Instructions</h3>
                      <p className="text-gray-600">Add detailed step-by-step instructions</p>
                    </div>
                    <button
                      type="button"
                      onClick={addStep}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      <span className="mr-2">+</span>
                      Add Step
                    </button>
                  </div>

                  {errors.steps && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                      {errors.steps}
                    </div>
                  )}

                  {formData.steps.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-400 text-lg mb-2">👨‍🍳</div>
                      <p className="text-gray-500">No cooking steps added yet</p>
                      <p className="text-gray-400 text-sm">Click "Add Step" to start building your recipe</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.steps.map((step, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-semibold text-sm">
                                {step.stepNumber}
                              </span>
                              <h4 className="text-lg font-medium text-gray-900">Step {step.stepNumber}</h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove step"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                              {/* Step Title */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Step Title *
                                </label>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStep(index, 'title', e.target.value)}
                                  placeholder="e.g., Prepare the pasta"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              {/* Step Instructions */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Instructions *
                                </label>
                                <textarea
                                  rows={4}
                                  value={step.instructions}
                                  onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                                  placeholder="Detailed instructions for this step..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              {/* Time and Temperature Row */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Time (minutes)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="480"
                                    value={step.timeMinutes || ''}
                                    onChange={(e) => updateStep(index, 'timeMinutes', parseInt(e.target.value) || undefined)}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Temperature
                                  </label>
                                  <input
                                    type="text"
                                    value={step.temperature || ''}
                                    onChange={(e) => updateStep(index, 'temperature', e.target.value)}
                                    placeholder="e.g., 350°F, Medium heat"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                              {/* Step Image */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Step Photo (optional)
                                </label>
                                <ImageUpload
                                  currentImageUrl={step.imageUrl || ''}
                                  onImageChange={(url) => updateStep(index, 'imageUrl', url)}
                                  onError={(error) => setErrors(prev => ({ ...prev, general: error }))}
                                  type="recipe"
                                  size="md"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Tips */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tips & Notes (optional)
                            </label>
                            <textarea
                              rows={2}
                              value={step.tips || ''}
                              onChange={(e) => updateStep(index, 'tips', e.target.value)}
                              placeholder="Any helpful tips or warnings for this step..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Equipment */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Equipment Needed (optional)
                            </label>
                            <input
                              type="text"
                              value={step.equipment?.join(', ') || ''}
                              onChange={(e) => {
                                const equipment = e.target.value
                                  .split(',')
                                  .map(item => item.trim())
                                  .filter(item => item.length > 0);
                                updateStep(index, 'equipment', equipment.length > 0 ? equipment : undefined);
                              }}
                              placeholder="e.g., Large pot, Wooden spoon, Colander (separated by commas)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Separate multiple items with commas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reorder Steps Help */}
                  {formData.steps.length > 1 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Pro tip:</strong> Steps are automatically numbered in order. If you need to reorder steps, 
                            remove the step you want to move and add it again in the correct position.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Tab */}
              {activeTab === 'additional' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Additional Information</h3>
                    <p className="text-gray-600">Add tags, nutrition info, and other details to make your recipe discoverable</p>
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Recipe Tags</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (helps people find your recipe)
                      </label>
                      <input
                        type="text"
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(',')
                            .map(tag => tag.trim())
                            .filter(tag => tag.length > 0);
                          handleInputChange('tags', tags.length > 0 ? tags : []);
                        }}
                        placeholder="e.g., Italian, Pasta, Quick meals, Vegetarian (separated by commas)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add relevant tags like cuisine type, dietary restrictions, meal type, etc. Separate with commas.
                      </p>
                    </div>

                    {/* Tag Suggestions */}
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = formData.tags?.filter((_, i) => i !== index) || [];
                                handleInputChange('tags', newTags);
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nutritional Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-medium text-gray-900">Nutritional Information</h4>
                      <p className="text-sm text-gray-500">(per serving - optional)</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calories
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.nutritionalInfo?.calories || ''}
                          onChange={(e) => {
                            const calories = parseInt(e.target.value) || undefined;
                            handleInputChange('nutritionalInfo', {
                              ...formData.nutritionalInfo,
                              calories
                            });
                          }}
                          placeholder="250"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.protein || ''}
                          onChange={(e) => {
                            const protein = parseFloat(e.target.value) || undefined;
                            handleInputChange('nutritionalInfo', {
                              ...formData.nutritionalInfo,
                              protein
                            });
                          }}
                          placeholder="15"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Carbs (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.carbs || ''}
                          onChange={(e) => {
                            const carbs = parseFloat(e.target.value) || undefined;
                            handleInputChange('nutritionalInfo', {
                              ...formData.nutritionalInfo,
                              carbs
                            });
                          }}
                          placeholder="30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fat (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.fat || ''}
                          onChange={(e) => {
                            const fat = parseFloat(e.target.value) || undefined;
                            handleInputChange('nutritionalInfo', {
                              ...formData.nutritionalInfo,
                              fat
                            });
                          }}
                          placeholder="10"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fiber (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.nutritionalInfo?.fiber || ''}
                          onChange={(e) => {
                            const fiber = parseFloat(e.target.value) || undefined;
                            handleInputChange('nutritionalInfo', {
                              ...formData.nutritionalInfo,
                              fiber
                            });
                          }}
                          placeholder="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recipe Notes */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Recipe Notes</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes & Tips
                      </label>
                      <textarea
                        rows={4}
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional notes, variations, storage tips, or other helpful information..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Share tips about variations, storage, or anything else that would help others make this recipe successfully.
                      </p>
                    </div>
                  </div>

                  {/* Additional Images */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Additional Photos</h4>
                    <p className="text-sm text-gray-600">Add more photos to showcase your recipe process or final result</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Additional Image Slots */}
                      {[0, 1, 2].map((index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photo {index + 1}
                          </label>
                          <ImageUpload
                            currentImageUrl={formData.additionalImages?.[index] || ''}
                            onImageChange={(url) => {
                              const newImages = [...(formData.additionalImages || [])];
                              if (url) {
                                newImages[index] = url;
                              } else {
                                newImages.splice(index, 1);
                              }
                              handleInputChange('additionalImages', newImages.filter(img => img));
                            }}
                            onError={(error) => setErrors(prev => ({ ...prev, general: error }))}
                            type="recipe"
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publication Settings */}
                  <div className="space-y-4 border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900">Publication Settings</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipe Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value as RecipeStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={RecipeStatus.DRAFT}>📝 Draft - Save for later editing</option>
                        <option value={RecipeStatus.PUBLISHED}>🌟 Published - Share with the community</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        You can always change this later in your recipe management page.
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Recipe Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{formData.ingredients.length}</div>
                        <div className="text-gray-600">Ingredients</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{formData.steps.length}</div>
                        <div className="text-gray-600">Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          {formData.prepTimeMinutes + formData.cookTimeMinutes} min
                        </div>
                        <div className="text-gray-600">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{formData.servings}</div>
                        <div className="text-gray-600">Servings</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </Link>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('status', RecipeStatus.DRAFT)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Recipe'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 