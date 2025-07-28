'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryService } from '@/services/category.service';
import { RecipeService } from '@/services/recipe.service';
import { Category, Recipe } from '@/types/api.types';
import Navbar from '@/components/Navbar';

const categoryService = new CategoryService();
const recipeService = new RecipeService();

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryRecipes, setCategoryRecipes] = useState<{ [key: string]: Recipe[] }>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllPublicCategories();
        setCategories(response);
        
        // Fetch recipes for each category
        const recipesMap: { [key: string]: Recipe[] } = {};
        for (const category of response) {
          try {
            const recipesResponse = await recipeService.getPublicRecipes({ categoryId: category.id, limit: 10 });
            recipesMap[category.id] = recipesResponse.data || [];
          } catch (error) {
            console.error(`Error fetching recipes for category ${category.name}:`, error);
            recipesMap[category.id] = [];
          }
        }
        setCategoryRecipes(recipesMap);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Categories</h1>
          <p className="text-gray-600">Explore recipes by category</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const recipes = categoryRecipes[category.id] || [];
            const recipeCount = recipes.length;
            
            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {category.description || 'Explore delicious recipes in this category'}
                  </p>

                  {/* Sample Recipes */}
                  {recipes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Recipes:</h4>
                      <div className="space-y-1">
                        {recipes.slice(0, 3).map((recipe) => (
                          <Link
                            key={recipe.id}
                            href={`/recipes/${recipe.id}`}
                            className="block text-sm text-blue-600 hover:text-blue-800 truncate"
                          >
                            • {recipe.title}
                          </Link>
                        ))}
                        {recipes.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{recipes.length - 3} more recipes
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/categories/${category.id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 text-center"
                    >
                      View All Recipes
                    </Link>
                    <Link
                      href={`/recipes/create?category=${category.id}`}
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                    >
                      Add Recipe
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-600 mb-4">There are no recipe categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
} 