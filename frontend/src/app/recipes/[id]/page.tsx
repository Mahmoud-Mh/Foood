'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { recipeService, authService } from '@/services';
import { Recipe, RecipeStatus } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const recipeId = params.id as string;
        const recipeData = await recipeService.getRecipeById(recipeId);
        setRecipe(recipeData);
        
        // Check if current user is the owner
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser && recipeData.authorId === currentUser.id) {
            setIsOwner(true);
          }
        }
      } catch (error) {
        console.error('Failed to load recipe:', error);
        setError('Recipe not found or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadRecipe();
    }
  }, [params.id]);

  const handleStatusToggle = async () => {
    if (!recipe || !isOwner) return;
    
    try {
      setUpdatingStatus(true);
      const newStatus = recipe.status === RecipeStatus.PUBLISHED ? RecipeStatus.DRAFT : RecipeStatus.PUBLISHED;
      
      await recipeService.updateRecipe(recipe.id, { status: newStatus });
      
      // Update local state
      setRecipe(prev => prev ? { ...prev, status: newStatus } : null);
      
    } catch (error) {
      console.error('Failed to update recipe status:', error);
    } finally {
      setUpdatingStatus(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The recipe you are looking for does not exist.'}</p>
            <Link 
              href="/recipes"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Browse Recipes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Recipe Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Owner Actions */}
        {isOwner && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recipe Management</h3>
                <p className="text-gray-600">Manage your recipe visibility and settings</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Visibility:</span>
                  <button
                    onClick={handleStatusToggle}
                    disabled={updatingStatus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      recipe.status === RecipeStatus.PUBLISHED 
                        ? 'bg-indigo-600' 
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        recipe.status === RecipeStatus.PUBLISHED ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {recipe.status === RecipeStatus.PUBLISHED ? '🌍 Public' : '🔒 Private'}
                  </span>
                </div>
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Edit Recipe
                </Link>
              </div>
            </div>
            {updatingStatus && (
              <div className="mt-3 text-sm text-indigo-600">
                Updating recipe status...
              </div>
            )}
          </div>
        )}

        {/* Recipe Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <Image
              src={FormatUtils.getImageUrl(recipe.imageUrl)}
              alt={recipe.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${FormatUtils.getDifficultyColor(recipe.difficulty)}`}>
                {FormatUtils.formatDifficulty(recipe.difficulty)}
              </span>
              {isOwner && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  recipe.status === RecipeStatus.PUBLISHED 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {recipe.status === RecipeStatus.PUBLISHED ? 'Published' : 'Draft'}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{recipe.title}</h1>
              <p className="text-xl text-gray-600 leading-relaxed">{recipe.description}</p>
            </div>
            
            {/* Recipe Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600">{recipe.prepTimeMinutes}</div>
                <div className="text-sm text-gray-600 font-medium">Prep Time (min)</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{recipe.cookTimeMinutes}</div>
                <div className="text-sm text-gray-600 font-medium">Cook Time (min)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{recipe.servings}</div>
                <div className="text-sm text-gray-600 font-medium">Servings</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{recipe.ingredients?.length || 0}</div>
                <div className="text-sm text-gray-600 font-medium">Ingredients</div>
              </div>
            </div>

            {/* Recipe Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {recipe.category && (
                  <span className="inline-flex items-center bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium">
                    <span className="mr-2">{recipe.category.icon}</span>
                    {recipe.category.name}
                  </span>
                )}
                <div className="flex items-center space-x-4 text-gray-500">
                  <span className="flex items-center">
                    <span className="mr-1">👀</span>
                    {recipe.viewsCount || 0} views
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">❤️</span>
                    {recipe.likesCount || 0} likes
                  </span>
                </div>
              </div>
              {recipe.author && (
                <div className="flex items-center space-x-2">
                  <Image
                    src={FormatUtils.getAvatarUrl(recipe.author.avatar, FormatUtils.formatUserName(recipe.author.firstName, recipe.author.lastName))}
                    alt="Author"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-sm text-gray-600">
                    By {FormatUtils.formatUserName(recipe.author.firstName, recipe.author.lastName)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🥕 Ingredients</h2>
              <div className="space-y-4">
                {recipe.ingredients?.map((ingredient: any, index: number) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {ingredient.quantity} {ingredient.unit} {ingredient.ingredient?.name || 'Unknown'}
                      </div>
                      {ingredient.preparation && (
                        <div className="text-sm text-gray-600 mt-1 italic">{ingredient.preparation}</div>
                      )}
                    </div>
                    {ingredient.isOptional && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👨‍🍳 Instructions</h2>
              <div className="space-y-8">
                {recipe.steps?.map((step, index) => (
                  <div key={index} className="flex space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {step.stepNumber}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">{step.instructions}</p>
                      
                      {step.imageUrl && (
                        <div className="relative h-64 mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={FormatUtils.getImageUrl(step.imageUrl)}
                            alt={step.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        {step.timeMinutes && step.timeMinutes > 0 && (
                          <span className="flex items-center">
                            <span className="mr-1">⏱️</span>
                            {step.timeMinutes} min
                          </span>
                        )}
                        {step.temperature && (
                          <span className="flex items-center">
                            <span className="mr-1">🌡️</span>
                            {step.temperature}
                          </span>
                        )}
                        {step.tips && (
                          <span className="flex items-center">
                            <span className="mr-1">💡</span>
                            {step.tips}
                          </span>
                        )}
                      </div>
                      
                      {step.equipment && step.equipment.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">🛠️ Equipment needed: </span>
                          <span className="text-sm text-blue-700">{step.equipment.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(recipe.tags && recipe.tags.length > 0 || recipe.notes || recipe.nutritionalInfo) && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Additional Information</h2>
            
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <span key={index} className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {recipe.notes && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">📝 Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{recipe.notes}</p>
                </div>
              </div>
            )}
            
            {recipe.nutritionalInfo && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">🍎 Nutritional Information (per serving)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {recipe.nutritionalInfo.calories && (
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{recipe.nutritionalInfo.calories}</div>
                      <div className="text-sm text-gray-600 font-medium">Calories</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.protein && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{recipe.nutritionalInfo.protein}g</div>
                      <div className="text-sm text-gray-600 font-medium">Protein</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.carbs && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{recipe.nutritionalInfo.carbs}g</div>
                      <div className="text-sm text-gray-600 font-medium">Carbs</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.fat && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{recipe.nutritionalInfo.fat}g</div>
                      <div className="text-sm text-gray-600 font-medium">Fat</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.fiber && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{recipe.nutritionalInfo.fiber}g</div>
                      <div className="text-sm text-gray-600 font-medium">Fiber</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 