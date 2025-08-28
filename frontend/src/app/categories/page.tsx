'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryService } from '@/services/category.service';
import { RecipeService } from '@/services/recipe.service';
import { Category, Recipe } from '@/types/api.types';
import Navbar from '@/components/Navbar';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';

const categoryService = new CategoryService();
const recipeService = new RecipeService();

// Category icons mapping
const categoryIcons: { [key: string]: string } = {
  breakfast: '🌅',
  lunch: '🍽️',
  dinner: '🌙',
  dessert: '🍰',
  snack: '🥨',
  appetizer: '🥟',
  soup: '🍲',
  salad: '🥗',
  pasta: '🍝',
  pizza: '🍕',
  seafood: '🐟',
  meat: '🥩',
  vegetarian: '🥬',
  vegan: '🌱',
  'gluten-free': '🌾',
  quick: '⚡',
  'slow-cooker': '⏰',
  grill: '🔥',
  bake: '🍞',
  drink: '🥤',
  cocktail: '🍸',
  smoothie: '🥤',
  juice: '🧃',
  coffee: '☕',
  tea: '🫖',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRecipes, setCategoryRecipes] = useState<Record<string, Recipe[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllPublicCategories();
        setCategories(response);
        
        // Fetch recipes for each category
        const recipesMap: Record<string, Recipe[]> = {};
        for (const category of response) {
          try {
            const recipesResult = await recipeService.getPublicRecipes({ categoryId: category.id, limit: 6 });
            recipesMap[category.id] = recipesResult.data;
          } catch (err) {
            console.error(`Error fetching recipes for category ${category.name}:`, err);
            recipesMap[category.id] = [];
          }
        }
        setCategoryRecipes(recipesMap);
      } catch (err) {
        console.error('Error fetching categories:', err);
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
      'from-amber-500 to-yellow-500',
    ];
    const selectedColor = colors[index % colors.length];
    return selectedColor;
  };

  if (loading) {
    return <PageLoadingSpinner message="Loading delicious categories..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold">Oops! Something went wrong</h3>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-20 w-60 h-60 bg-gradient-to-br from-green-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-medium mb-6 animate-bounce">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            Explore Categories
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Discover Amazing 
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block animate-pulse">
              Recipe Categories
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            From quick breakfasts to gourmet dinners, explore our curated collection of recipe categories. 
            Find the perfect dish for any occasion and culinary craving.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {categories.map((category, index) => {
            const recipes = categoryRecipes[category.id] || [];
            const icon = getCategoryIcon(category.name);
            const gradientClass = getCategoryColor(index);
            
            return (
              <div
                key={category.id}
                className="group relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-gray-100 animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Header with gradient and icon */}
                <Link href={`/categories/${category.id}`} className="block">
                  <div className={`relative h-32 bg-gradient-to-br ${gradientClass} p-6 flex flex-col items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300`}>
                    <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300"></div>
                    <div className="relative z-10 text-center">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">{category.name}</h3>
                      <p className="text-white/80 text-sm line-clamp-2 group-hover:text-white/70 transition-colors">{category.description}</p>
                    </div>
                  </div>
                </Link>

                {/* Content Area */}
                <div className="p-6">
                  {/* Popular Recipes Section */}
                  {recipes.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-2"></div>
                        <h4 className="font-semibold text-gray-900 text-sm">Popular Recipes</h4>
                      </div>
                      <div className="space-y-2">
                        {recipes.slice(0, 3).map((recipe, idx) => (
                          <div key={recipe.id} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors group">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-3 group-hover:bg-indigo-500 transition-colors"></div>
                            <span className="truncate font-medium">{recipe.title}</span>
                          </div>
                        ))}
                        {recipes.length > 3 && (
                          <div className="text-xs text-gray-400 italic pl-5">
                            +{recipes.length - 3} more recipes
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recipe Count Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href={`/categories/${category.id}`}
                      className="group w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-center block transform hover:scale-105 shadow-lg"
                    >
                      <span className="flex items-center justify-center">
                        Browse Recipes
                        <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </Link>
                    
                    <Link
                      href={`/recipes/create?category=${category.id}`}
                      className="group w-full border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-300 text-center block"
                    >
                      <span className="flex items-center justify-center">
                        Add Recipe
                        <svg className="ml-2 w-4 h-4 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-20">
            <div className="relative max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs px-3 py-1 rounded-full font-medium animate-bounce">
                Coming Soon!
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Categories Available Yet</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're working on organizing amazing recipe categories for you. 
                In the meantime, why not create the first recipe?
              </p>
              <Link
                href="/recipes/create"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center"
              >
                Create Your First Recipe
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Call to Action */}
        {categories.length > 0 && (
          <div className="mt-20">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 text-center relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"></div>
              
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Can't find what you're looking for?
                  </span>
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Create your own recipe and share it with our growing community! Your culinary creations 
                  can inspire others and help build our recipe collection.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/recipes/create"
                    className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center">
                      Create New Recipe
                      <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                  
                  <Link
                    href="/recipes"
                    className="group border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-lg w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center">
                      Browse All Recipes
                      <svg className="ml-2 w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}