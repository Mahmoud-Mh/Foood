'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { recipeService, categoryService, ingredientService, authService } from '@/services';
import { Recipe, RecipeStatus, DifficultyLevel, Category, Ingredient, RecipeIngredient, RecipeStep } from '@/types/api.types';
import Navbar from '@/components/Navbar';

interface CreateRecipeIngredientForm {
  ingredientId: string;
  quantity: number;
  unit: string;
  preparation?: string;
  isOptional?: boolean;
}

interface CreateRecipeStepForm {
  title: string;
  instructions: string;
  stepNumber: number;
  timeMinutes?: number;
  imageUrl?: string;
  tips?: string;
  temperature?: string;
  equipment?: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  instructions?: string;
  prepTimeMinutes?: string;
  cookTimeMinutes?: string;
  servings?: string;
  categoryId?: string;
  difficulty?: string;
  ingredients?: string;
  steps?: string;
}

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Form state
  const [recipeData, setRecipeData] = useState({
    title: '',
    description: '',
    instructions: '',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    categoryId: '',
    difficulty: DifficultyLevel.EASY,
    status: RecipeStatus.DRAFT,
    ingredients: [] as CreateRecipeIngredientForm[],
    steps: [] as CreateRecipeStepForm[]
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const recipeId = params.id as string;
        
        // Load recipe data
        const recipeData = await recipeService.getRecipeById(recipeId);
        setRecipe(recipeData);

        // Check if current user is the owner
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser && recipeData.authorId === currentUser.id) {
            // User is the owner, continue
          } else {
            setError('You do not have permission to edit this recipe.');
            return;
          }
        } else {
          setError('You must be logged in to edit recipes.');
          return;
        }

        // Load categories
        const categoriesData = await categoryService.getAllPublicCategories();
        setCategories(categoriesData);

        // Load ingredients
        const ingredientsData = await ingredientService.getAllPublicIngredients();
        setIngredients(ingredientsData);

        // Populate form with existing recipe data
        setRecipeData({
          title: recipeData.title,
          description: recipeData.description,
          instructions: recipeData.instructions,
          prepTimeMinutes: recipeData.prepTimeMinutes,
          cookTimeMinutes: recipeData.cookTimeMinutes,
          servings: recipeData.servings,
          categoryId: recipeData.category?.id || '',
          difficulty: recipeData.difficulty,
          status: recipeData.status,
          ingredients: recipeData.ingredients?.map((ing: RecipeIngredient) => ({
            ingredientId: ing.ingredient?.id || '',
            quantity: ing.quantity,
            unit: ing.unit,
            preparation: ing.preparation,
            isOptional: ing.isOptional
          })) || [],
          steps: recipeData.steps?.map((step: RecipeStep, index: number) => ({
            title: step.title,
            instructions: step.instructions,
            stepNumber: step.stepNumber || index + 1,
            timeMinutes: step.timeMinutes,
            imageUrl: step.imageUrl,
            tips: step.tips,
            temperature: step.temperature,
            equipment: step.equipment
          })) || []
        });

      } catch (error) {
        console.error('Failed to load recipe data:', error);
        setError('Failed to load recipe data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!recipeData.title.trim()) {
      newErrors.title = 'Recipe title is required';
    }

    if (!recipeData.description.trim()) {
      newErrors.description = 'Recipe description is required';
    }

    if (!recipeData.instructions.trim()) {
      newErrors.instructions = 'Recipe instructions are required';
    }

    if (recipeData.prepTimeMinutes <= 0) {
      newErrors.prepTimeMinutes = 'Prep time must be greater than 0';
    }

    if (recipeData.cookTimeMinutes <= 0) {
      newErrors.cookTimeMinutes = 'Cook time must be greater than 0';
    }

    if (recipeData.servings <= 0) {
      newErrors.servings = 'Servings must be greater than 0';
    }

    if (!recipeData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (recipeData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    if (recipeData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
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
      const recipeId = params.id as string;
      
      await recipeService.updateRecipe(recipeId, recipeData);
      
      // Redirect to the updated recipe
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      console.error('Failed to update recipe:', error);
      setError('Failed to update recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        ingredientId: '',
        quantity: 1,
        unit: 'cup',
        preparation: '',
        isOptional: false
      }]
    }));
  };

  const removeIngredient = (index: number) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: keyof CreateRecipeIngredientForm, value: string | number | boolean) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addStep = () => {
    setRecipeData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        title: '',
        instructions: '',
        stepNumber: prev.steps.length + 1
      }]
    }));
  };

  const removeStep = (index: number) => {
    setRecipeData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        stepNumber: i + 1
      }))
    }));
  };

  const updateStep = (index: number, field: keyof CreateRecipeStepForm, value: string | number) => {
    setRecipeData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Edit Recipe</h1>
            <p className="text-gray-600 mb-6">{error || 'The recipe you are looking for does not exist.'}</p>
            <button 
              onClick={() => router.back()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
              <p className="text-gray-600 mt-2">Update your recipe details and ingredients</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 transition"
            >
              ← Back to Recipe
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={recipeData.title}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter recipe title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={recipeData.categoryId}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={recipeData.difficulty}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={DifficultyLevel.EASY}>Easy</option>
                  <option value={DifficultyLevel.MEDIUM}>Medium</option>
                  <option value={DifficultyLevel.HARD}>Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={RecipeStatus.PUBLISHED}
                      checked={recipeData.status === RecipeStatus.PUBLISHED}
                      onChange={(e) => setRecipeData(prev => ({ ...prev, status: e.target.value as RecipeStatus }))}
                      className="mr-2"
                    />
                    <span className="text-sm">🌍 Public</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={RecipeStatus.DRAFT}
                      checked={recipeData.status === RecipeStatus.DRAFT}
                      onChange={(e) => setRecipeData(prev => ({ ...prev, status: e.target.value as RecipeStatus }))}
                      className="mr-2"
                    />
                    <span className="text-sm">🔒 Private (Draft)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={recipeData.description}
                onChange={(e) => setRecipeData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your recipe..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                value={recipeData.instructions}
                onChange={(e) => setRecipeData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.instructions ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Provide general cooking instructions..."
              />
              {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
            </div>
          </div>

          {/* Recipe Details */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⏱️ Recipe Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (minutes) *
                </label>
                <input
                  type="number"
                  value={recipeData.prepTimeMinutes}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, prepTimeMinutes: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.prepTimeMinutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.prepTimeMinutes && <p className="text-red-500 text-sm mt-1">{errors.prepTimeMinutes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cook Time (minutes) *
                </label>
                <input
                  type="number"
                  value={recipeData.cookTimeMinutes}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, cookTimeMinutes: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.cookTimeMinutes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.cookTimeMinutes && <p className="text-red-500 text-sm mt-1">{errors.cookTimeMinutes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings *
                </label>
                <input
                  type="number"
                  value={recipeData.servings}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, servings: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.servings ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.servings && <p className="text-red-500 text-sm mt-1">{errors.servings}</p>}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🥕 Ingredients</h2>
              <button
                type="button"
                onClick={addIngredient}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                + Add Ingredient
              </button>
            </div>

            {errors.ingredients && <p className="text-red-500 text-sm mb-4">{errors.ingredients}</p>}

            <div className="space-y-4">
              {recipeData.ingredients.map((ingredient, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Ingredient {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ingredient *
                      </label>
                      <select
                        value={ingredient.ingredientId}
                        onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select ingredient</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="cup, tbsp, etc."
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preparation Notes
                    </label>
                    <input
                      type="text"
                      value={ingredient.preparation || ''}
                      onChange={(e) => updateIngredient(index, 'preparation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., finely chopped, room temperature"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ingredient.isOptional || false}
                        onChange={(e) => updateIngredient(index, 'isOptional', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Optional ingredient</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">👨‍🍳 Cooking Steps</h2>
              <button
                type="button"
                onClick={addStep}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                + Add Step
              </button>
            </div>

            {errors.steps && <p className="text-red-500 text-sm mb-4">{errors.steps}</p>}

            <div className="space-y-6">
              {recipeData.steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Step {step.stepNumber}</h3>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Step Title *
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Prepare ingredients"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={step.timeMinutes || ''}
                        onChange={(e) => updateStep(index, 'timeMinutes', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions *
                    </label>
                    <textarea
                      value={step.instructions}
                      onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe what to do in this step..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tips
                      </label>
                      <input
                        type="text"
                        value={step.tips || ''}
                        onChange={(e) => updateStep(index, 'tips', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Helpful tips for this step"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 350°F, medium heat"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 