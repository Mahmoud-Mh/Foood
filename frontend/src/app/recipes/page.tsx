'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { recipeService, categoryService } from '@/services';
import { Recipe, Category } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';
import { ApiErrorBoundary } from '@/components/ApiErrorBoundary';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';

export default function BrowseRecipesPage() {
  return (
    <Suspense fallback={<PageLoadingSpinner message="Loading amazing recipes..." />}>
      <BrowseRecipesContent />
    </Suspense>
  );
}

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
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

function BrowseRecipesContent() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    search: searchParams.get('search') || '',
  });

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedFilters = { ...filters, search: debouncedSearch };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only show full page loading on initial load
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setSearchLoading(true);
        }
        
        const [recipesResult, categoriesData] = await Promise.all([
          recipeService.getPublicRecipes({
            page: 1,
            limit: 20,
            categoryId: debouncedFilters.category || undefined,
            difficulty: debouncedFilters.difficulty || undefined,
            search: debouncedFilters.search || undefined,
          }),
          // Only fetch categories on initial load
          isInitialLoad ? categoryService.getAllPublicCategories() : Promise.resolve(categories)
        ]);

        setRecipes(recipesResult.data || []);
        if (isInitialLoad) {
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('Failed to load recipes:', error);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    };

    loadData();
  }, [debouncedFilters.category, debouncedFilters.difficulty, debouncedSearch]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = () => {
    setFilters({ category: '', difficulty: '', search: '' });
  };

  if (loading) {
    return <PageLoadingSpinner message="Loading delicious recipes..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-gradient-to-br from-green-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-medium mb-6 animate-bounce">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            Recipe Collection
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Browse Amazing 
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block animate-pulse">
              Recipes
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Discover incredible recipes from our passionate community of home chefs and culinary enthusiasts
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 mb-12 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Search Recipes</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {searchLoading ? (
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 hover:border-gray-300 transition-all duration-300"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 hover:border-gray-300 transition-all duration-300 appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 hover:border-gray-300 transition-all duration-300 appearance-none bg-white"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="group w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-semibold"
              >
                <span className="flex items-center justify-center">
                  Clear Filters
                  <svg className="ml-2 w-4 h-4 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-8 rounded-2xl max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold">Oops! Something went wrong</h3>
              </div>
              <p className="text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Recipes Found</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {filters.search || filters.category || filters.difficulty 
                  ? 'Try adjusting your filters or search terms to discover more recipes.'
                  : 'No recipes have been created yet. Be the first to share your culinary masterpiece!'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/recipes/create"
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    Create Your First Recipe
                    <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                {(filters.search || filters.category || filters.difficulty) && (
                  <button
                    onClick={clearFilters}
                    className="group border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-lg"
                  >
                    <span className="flex items-center justify-center">
                      Clear Filters
                      <svg className="ml-2 w-5 h-5 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {recipes.length}
                  </span>
                  {' '}Recipe{recipes.length !== 1 ? 's' : ''} Found
                </h2>
              </div>
              
              <Link
                href="/recipes/create"
                className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
              >
                <span className="flex items-center">
                  Add Recipe
                  <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </Link>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 ${searchLoading ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-300`}>
              {recipes.map((recipe, index) => (
                <div key={recipe.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
            
            {searchLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-2 text-indigo-600">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Searching recipes...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Recipe Card Component
function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block h-full">
      <div className="h-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-gray-100 flex flex-col">
        <div className="relative h-48 flex-shrink-0">
          <Image
            src={FormatUtils.getImageUrl(recipe.imageUrl)}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-colors duration-300"></div>
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${FormatUtils.getDifficultyColor(recipe.difficulty)} shadow-lg`}>
              {FormatUtils.formatDifficulty(recipe.difficulty)}
            </span>
          </div>
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center text-white/90 text-sm font-medium backdrop-blur-sm bg-black/20 rounded-full px-3 py-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {FormatUtils.formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)}
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
              {recipe.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed min-h-[4.5rem]">
              {FormatUtils.truncateText(recipe.description, 100)}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {FormatUtils.formatServings(recipe.servings)}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {recipe.viewsCount || 0}
              </div>
            </div>
            
            <div className="text-indigo-600 group-hover:text-purple-600 transition-colors">
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}