'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryService } from '@/services/category.service';
import { RecipeService } from '@/services/recipe.service';
import { Category, Recipe } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';

const categoryService = new CategoryService();
const recipeService = new RecipeService();

// Category icons mapping
const categoryIcons: { [key: string]: string } = {
  'breakfast': '🌅',
  'lunch': '🍽️',
  'dinner': '🌙',
  'dessert': '🍰',
  'snack': '🥨',
  'appetizer': '🥟',
  'soup': '🍲',
  'salad': '🥗',
  'pasta': '🍝',
  'pizza': '🍕',
  'seafood': '🐟',
  'meat': '🥩',
  'vegetarian': '🥬',
  'vegan': '🌱',
  'gluten-free': '🌾',
  'quick': '⚡',
  'slow-cooker': '⏰',
  'grill': '🔥',
  'bake': '🍞',
  'drink': '🥤',
  'cocktail': '🍸',
  'smoothie': '🥤',
  'juice': '🧃',
  'coffee': '☕',
  'tea': '🫖'
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryRecipes, setCategoryRecipes] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllPublicCategories();
        setCategories(response);
        
        // Fetch recipes for each category
        const recipesMap: Record<string, any[]> = {};
        for (const category of response) {
          try {
            const recipesResponse = await recipeService.getPublicRecipes({ categoryId: category.id, limit: 6 });
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

  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '-');
    return categoryIcons[normalizedName] || '🍽️';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-red-500 to-pink-500',
      'from-blue-500 to-indigo-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-purple-500 to-pink-500',
      'from-teal-500 to-cyan-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-emerald-500 to-teal-500',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-yellow-500'
    ];
    const selectedColor = colors[index % colors.length];
    return selectedColor;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🍽️ Explore Recipe Categories 🍽️
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover delicious recipes organized by category. From quick breakfasts to gourmet dinners, 
            find the perfect recipe for any occasion.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const recipes = categoryRecipes[category.id] || [];
            const recipeCount = recipes.length;
            const icon = getCategoryIcon(category.name);
            const gradientClass = getCategoryColor(index);
            
            return (
              <div
                key={category.id}
                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
              >
                {/* Clickable Area for Browsing Recipes */}
                <Link href={`/categories/${category.id}`} className="block">
                  <div className={`relative h-32 bg-gradient-to-br ${gradientClass} p-6 flex items-center justify-center cursor-pointer`}>
                    <div className="text-4xl mb-2">{icon}</div>
                    <div className="relative z-10 text-center">
                      <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                      <p className="text-white text-opacity-90 text-sm">{category.description}</p>
                    </div>
                  </div>
                </Link>

                {/* Content Area */}
                <div className="p-6 flex flex-col h-full">
                  {/* Popular Recipes Section */}
                  {recipes.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <span className="text-purple-600 mr-2">🍽️</span>
                        <h4 className="font-semibold text-gray-900">Popular Recipes</h4>
                      </div>
                      <div className="space-y-1">
                        {recipes.slice(0, 3).map((recipe) => (
                          <div key={recipe.id} className="text-sm text-gray-700 truncate">
                            • {recipe.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipe Count */}
                  <div className="mt-auto pt-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="px-6 pb-6">
                  <Link
                    href={`/recipes/create?category=${category.id}`}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200 text-center block"
                  >
                    Add Recipe
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Categories Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              There are no recipe categories available at the moment. Check back later for new categories!
            </p>
            <Link
              href="/recipes/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Create Your First Recipe
            </Link>
          </div>
        )}

        {/* Call to Action */}
        {categories.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Create your own recipe and share it with the community! Your culinary creations can inspire others.
              </p>
              <Link
                href="/recipes/create"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Create New Recipe
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 