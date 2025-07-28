'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CategoryService } from '@/services/category.service';
import { RecipeService } from '@/services/recipe.service';
import { Category, Recipe } from '@/types/api.types';
import Navbar from '@/components/Navbar';

const categoryService = new CategoryService();
const recipeService = new RecipeService();

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchCategoryAndRecipes = async () => {
      try {
        setLoading(true);
        
        // Fetch category details
        const categoryResponse = await categoryService.getPublicCategoryById(categoryId);
        setCategory(categoryResponse);
        
        // Fetch recipes for this category
        const recipesResponse = await recipeService.getPublicRecipes({
          categoryId: categoryId,
          page: currentPage,
          limit: 12
        });
        
        setRecipes(recipesResponse.data || []);
        setHasMore(recipesResponse.data.length === 12);
      } catch (error) {
        console.error('Error fetching category and recipes:', error);
        setError('Failed to load category and recipes');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryAndRecipes();
    }
  }, [categoryId, currentPage]);

  const loadMoreRecipes = async () => {
    try {
      const nextPage = currentPage + 1;
      const recipesResponse = await recipeService.getPublicRecipes({
        categoryId: categoryId,
        page: nextPage,
        limit: 12
      });
      
      setRecipes(prev => [...prev, ...(recipesResponse.data || [])]);
      setCurrentPage(nextPage);
      setHasMore(recipesResponse.data.length === 12);
    } catch (error) {
      console.error('Error loading more recipes:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading category...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error || 'Category not found'}</p>
            </div>
            <Link
              href="/categories"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/categories"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              <p className="text-gray-600">{category.description}</p>
            </div>
            
            <Link
              href={`/recipes/create?category=${category.id}`}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Add Recipe
            </Link>
          </div>
        </div>

        {/* Recipe Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} in this category
          </p>
        </div>

        {/* Recipes Grid */}
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                {recipe.imageUrl && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {recipe.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {recipe.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {recipe.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                    <span>👥 {recipe.servings} servings</span>
                  </div>
                  
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Recipe
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipes Found</h3>
            <p className="text-gray-600 mb-4">There are no recipes in this category yet.</p>
            <Link
              href={`/recipes/create?category=${category.id}`}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Add First Recipe
            </Link>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && recipes.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreRecipes}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Load More Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 