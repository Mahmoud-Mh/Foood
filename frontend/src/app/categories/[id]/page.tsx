'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryService } from '@/services/category.service';
import { RecipeService } from '@/services/recipe.service';
import { Category, Recipe } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';

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
        const categoryResponse = await categoryService.getCategoryById(categoryId);
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
    return <PageLoadingSpinner message="Loading amazing category..." />;
  }

  if (error || !category) {
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
                <h3 className="text-lg font-semibold">Category Not Found</h3>
              </div>
              <p className="text-sm mb-6">{error || 'The requested category could not be found.'}</p>
              <Link
                href="/categories"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  Back to Categories
                  <svg className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
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
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/categories"
            className="group inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors duration-300 bg-white/80 backdrop-blur-lg rounded-xl px-4 py-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-medium mb-6 animate-bounce">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
            Category Recipes
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {category.name}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block animate-pulse text-3xl sm:text-4xl md:text-5xl mt-2">
              Collection
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 mb-8">
            {category.description}
          </p>

          {/* Recipe Count & Add Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-medium shadow-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </div>
            
            <Link
              href={`/recipes/create?category=${category.id}`}
              className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
            >
              <span className="flex items-center">
                Add Recipe
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Recipes Grid */}
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {recipes.map((recipe, index) => (
              <div 
                key={recipe.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="relative max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs px-3 py-1 rounded-full font-medium animate-bounce">
                Be First!
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Recipes Yet</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                This category is waiting for its first delicious recipe. 
                Why not be the first to contribute?
              </p>
              <Link
                href={`/recipes/create?category=${category.id}`}
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center"
              >
                Add First Recipe
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && recipes.length > 0 && (
          <div className="text-center">
            <button
              onClick={loadMoreRecipes}
              className="group bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
            >
              <span className="flex items-center">
                Load More Recipes
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
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