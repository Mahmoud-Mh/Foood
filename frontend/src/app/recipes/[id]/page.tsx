'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { recipeService } from '@/services';
import { Recipe } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const recipeId = params.id as string;
        const recipeData = await recipeService.getRecipeById(recipeId);
        setRecipe(recipeData);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Recipe Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recipe Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <Image
              src={FormatUtils.getImageUrl(recipe.imageUrl)}
              alt={recipe.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${FormatUtils.getDifficultyColor(recipe.difficulty)}`}>
                {FormatUtils.formatDifficulty(recipe.difficulty)}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
              <div className="flex items-center space-x-2 text-gray-500">
                <span>👀 {recipe.viewsCount || 0}</span>
                <span>❤️ {recipe.likesCount || 0}</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">{recipe.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{recipe.prepTimeMinutes}</div>
                <div className="text-sm text-gray-500">Prep Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{recipe.cookTimeMinutes}</div>
                <div className="text-sm text-gray-500">Cook Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{recipe.servings}</div>
                <div className="text-sm text-gray-500">Servings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{recipe.ingredients?.length || 0}</div>
                <div className="text-sm text-gray-500">Ingredients</div>
              </div>
            </div>

            {recipe.category && (
              <div className="mb-4">
                <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                  {recipe.category.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <div className="space-y-3">
                {recipe.ingredients?.map((ingredient: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {ingredient.quantity} {ingredient.unit} {ingredient.ingredient?.name || 'Unknown'}
                      </div>
                      {ingredient.preparation && (
                        <div className="text-sm text-gray-500">{ingredient.preparation}</div>
                      )}
                    </div>
                    {ingredient.isOptional && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <div className="space-y-6">
                {recipe.steps?.map((step, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {step.stepNumber}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-3">{step.instructions}</p>
                      
                      {step.imageUrl && (
                        <div className="relative h-48 mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={FormatUtils.getImageUrl(step.imageUrl)}
                            alt={step.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        {step.timeMinutes && step.timeMinutes > 0 && (
                          <span>⏱️ {step.timeMinutes} min</span>
                        )}
                        {step.temperature && (
                          <span>🌡️ {step.temperature}</span>
                        )}
                        {step.tips && (
                          <span>💡 {step.tips}</span>
                        )}
                      </div>
                      
                      {step.equipment && step.equipment.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-gray-700">Equipment: </span>
                          <span className="text-sm text-gray-500">{step.equipment.join(', ')}</span>
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
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Information</h2>
            
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {recipe.notes && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-600">{recipe.notes}</p>
              </div>
            )}
            
            {recipe.nutritionalInfo && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Nutritional Information (per serving)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {recipe.nutritionalInfo.calories && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">{recipe.nutritionalInfo.calories}</div>
                      <div className="text-sm text-gray-500">Calories</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.protein && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">{recipe.nutritionalInfo.protein}g</div>
                      <div className="text-sm text-gray-500">Protein</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.carbs && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">{recipe.nutritionalInfo.carbs}g</div>
                      <div className="text-sm text-gray-500">Carbs</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.fat && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">{recipe.nutritionalInfo.fat}g</div>
                      <div className="text-sm text-gray-500">Fat</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.fiber && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">{recipe.nutritionalInfo.fiber}g</div>
                      <div className="text-sm text-gray-500">Fiber</div>
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