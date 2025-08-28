'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { recipeService, categoryService, authService } from '@/services';
import { Recipe, Category } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ApiErrorBoundary } from '@/components/ApiErrorBoundary';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRecipes, setCategoryRecipes] = useState<Record<string, Recipe[]>>({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { handleApiError } = useErrorHandler();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication status
        setIsAuthenticated(authService.isAuthenticated());

        // Since specific featured/popular endpoints don't exist yet,
        // we'll use the general published recipes endpoint for both
        const [publishedRecipesResult, categoriesData] = await Promise.all([
          // Get published recipes and use them for both featured and popular
          recipeService.getPublicRecipes({ limit: 12 }).catch(() => ({ data: [] })),
          // Try to get categories, fallback to empty array if it fails
          categoryService.getAllPublicCategories().catch(() => [])
        ]);

        // Split the published recipes between featured and popular
        const allRecipes = publishedRecipesResult?.data?.data || [];
        setFeaturedRecipes(allRecipes.slice(0, 6)); // First 6 for featured
        setPopularRecipes(allRecipes.slice(6, 14)); // Next 8 for popular

        const categoriesList = Array.isArray(categoriesData) ? categoriesData.slice(0, 6) : [];
        setCategories(categoriesList);

        // Fetch recipes for each category to get counts
        const recipesMap: Record<string, Recipe[]> = {};
        for (const category of categoriesList) {
          try {
            const recipesResponse = await recipeService.getPublicRecipes({ categoryId: category.id, limit: 6 });
            recipesMap[category.id] = recipesResponse?.data || [];
          } catch (error) {
            console.error(`Error fetching recipes for category ${category.name}:`, error);
            recipesMap[category.id] = [];
          }
        }
        setCategoryRecipes(recipesMap);
      } catch (error) {
        handleApiError(error, {
          showToast: true,
          customMessage: 'Failed to load recipes. Please refresh the page.',
        });
        // Set empty arrays as fallback
        setFeaturedRecipes([]);
        setPopularRecipes([]);
        setCategories([]);
        setCategoryRecipes({});
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [handleApiError]);

  if (loading) {
    return <PageLoadingSpinner message="Preparing something delicious..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-orange-50 min-h-screen flex items-center">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-20 left-20 sm:top-40 sm:left-40 w-30 h-30 sm:w-60 sm:h-60 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            {/* Animated Badge */}
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-bounce">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
              Welcome to Recipe Hub
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Discover & Share
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block animate-pulse">
                Amazing Recipes
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
              Join our community of passionate food lovers. Explore thousands of delicious recipes,
              share your culinary masterpieces, and connect with fellow chefs around the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <Link 
                href="/recipes"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto text-center"
              >
                <span className="flex items-center justify-center">
                  Explore Recipes
                  <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              
              {!isAuthenticated && (
                <Link 
                  href="/auth/register"
                  className="group border-2 border-gray-300 text-gray-700 px-8 sm:px-10 py-3 sm:py-4 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-base sm:text-lg backdrop-blur-sm bg-white/50 w-full sm:w-auto text-center"
                >
                  <span className="flex items-center justify-center">
                    Join Community
                    <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </span>
                </Link>
              )}
            </div>
            
            {/* Stats Section */}
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto px-4">
              <div className="text-center p-4 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1 sm:mb-2">1000+</div>
                <div className="text-gray-600 text-sm sm:text-base">Delicious Recipes</div>
              </div>
              <div className="text-center p-4 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">500+</div>
                <div className="text-gray-600 text-sm sm:text-base">Food Lovers</div>
              </div>
              <div className="text-center p-4 sm:p-0">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600 mb-1 sm:mb-2">50+</div>
                <div className="text-gray-600 text-sm sm:text-base">Recipe Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      {featuredRecipes.length > 0 && (
        <ApiErrorBoundary
          fallback={(error, retry) => (
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">Featured Recipes</h2>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-red-600 mb-4">Failed to load featured recipes. Please try again.</p>
                    <button 
                      onClick={retry} 
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        >
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 text-sm font-medium mb-6">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured Recipes
                </div>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
                  Chef's
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"> Picks</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                  Discover handpicked recipes from our community of talented home chefs and culinary experts
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {featuredRecipes.map((recipe, index) => (
                  <div key={recipe.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <RecipeCard recipe={recipe} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ApiErrorBoundary>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
                Explore by 
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Category</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                Discover amazing recipes organized by your favorite cuisine types and cooking styles
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
              {categories.map((category) => {
                const recipes = categoryRecipes[category.id] || [];
                return (
                  <CategoryCard key={category.id} category={category} recipeCount={recipes.length} />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Popular Recipes Section */}
      {popularRecipes.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">More Great Recipes</h2>
              <p className="text-gray-600 px-4">Continue exploring our recipe collection</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {popularRecipes.map((recipe) => (
                <CompactRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Join Community Section - Show if no recipes or user not authenticated */}
      {(featuredRecipes.length === 0 && popularRecipes.length === 0) || !isAuthenticated ? (
        <section className="py-16 sm:py-20 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 sm:w-60 sm:h-60 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 sm:w-60 sm:h-60 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100">
              {/* Icon with gradient background */}
              <div className="relative mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs px-3 py-1 rounded-full font-medium animate-bounce">
                  New!
                </div>
              </div>
              
              <h3 className="text-3xl sm:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to Recipe Hub!
                </span>
              </h3>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {featuredRecipes.length === 0 && popularRecipes.length === 0 
                  ? "Our community is just getting started. Be among the first to share your amazing recipes and help build this delicious platform together!"
                  : "Join our growing community of passionate food lovers and discover amazing recipes from around the world."
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/auth/register"
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center">
                    Join & Share Your First Recipe
                    <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                <Link 
                  href="/recipes"
                  className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-lg backdrop-blur-sm bg-white/50 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center">
                    Browse Recipes
                    <svg className="ml-2 w-5 h-5 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="sm:col-span-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-0 sm:mr-4">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Recipe Hub
                </h3>
              </div>
              <p className="text-gray-300 text-base sm:text-lg max-w-md mb-6 text-center sm:text-left">
                Bringing food lovers together, one delicious recipe at a time. Join our community of passionate chefs and home cooks.
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center sm:justify-start space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors group">
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors group">
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors group">
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.74.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.758-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.986C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="text-center sm:text-left">
              <h4 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">Quick Links</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="/recipes" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Browse Recipes
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link href="/recipes/create" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Share Recipe
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support */}
            <div className="text-center sm:text-left">
              <h4 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">Support</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Recipe Hub. All rights reserved. Made with ❤️ for food lovers.
              </p>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <span className="text-gray-400 text-sm">Powered by</span>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded"></div>
                  <span className="text-gray-300 text-sm font-medium">Recipe Hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Recipe Card Component
function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={FormatUtils.getImageUrl(recipe.imageUrl)}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Difficulty Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${FormatUtils.getDifficultyColor(recipe.difficulty)} shadow-lg`}>
              {FormatUtils.formatDifficulty(recipe.difficulty)}
            </span>
          </div>
          
          {/* Favorite Button */}
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
            {recipe.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {FormatUtils.truncateText(recipe.description, 120)}
          </p>
          
          {/* Recipe Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {FormatUtils.formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)}
              </div>
              
              <div className="flex items-center text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {FormatUtils.formatServings(recipe.servings)}
              </div>
            </div>
            
            <div className="flex items-center text-indigo-500 font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {FormatUtils.formatNumber(recipe.viewsCount || 0)}
            </div>
          </div>
          
          {/* Author Info */}
          {recipe.author && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {recipe.author.firstName?.[0] || 'U'}
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  by {FormatUtils.formatUserName(recipe.author.firstName, recipe.author.lastName)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Category Card Component
function CategoryCard({ category, recipeCount }: { category: Category, recipeCount: number }) {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-purple-500 to-pink-600', 
    'from-pink-500 to-red-600',
    'from-orange-500 to-red-600',
    'from-yellow-500 to-orange-600',
    'from-green-500 to-emerald-600',
    'from-blue-500 to-indigo-600',
    'from-teal-500 to-cyan-600'
  ];
  
  const gradientClass = gradients[Math.abs(category.name.length) % gradients.length];
  
  return (
    <Link href={`/recipes?category=${category.id}`} className="group">
      <div className="text-center transform transition-all duration-300 hover:-translate-y-2">
        {/* Icon Container */}
        <div className="relative mb-6">
          <div 
            className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br ${gradientClass} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
          >
            {category.icon || category.name.charAt(0)}
          </div>
          
          {/* Floating Badge */}
          <div className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
            <span className="text-xs font-bold text-gray-700">{recipeCount}</span>
          </div>
        </div>
        
        {/* Category Info */}
        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 mb-2">
          {category.name}
        </h3>
        
        <p className="text-sm text-gray-500 font-medium">
          {FormatUtils.formatNumber(recipeCount)} 
          <span className="text-gray-400"> recipe{recipeCount !== 1 ? 's' : ''}</span>
        </p>
        
        {/* Hover Effect Line */}
        <div className="w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-2 group-hover:w-12 transition-all duration-300"></div>
      </div>
    </Link>
  );
}

// Compact Recipe Card Component
function CompactRecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
        <div className="relative h-32">
          <Image
            src={FormatUtils.getImageUrl(recipe.imageUrl)}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h4 className="font-medium text-sm mb-2 group-hover:text-indigo-600 transition">
            {FormatUtils.truncateText(recipe.title, 40)}
          </h4>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{FormatUtils.formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)}</span>
            <div className="flex items-center">
              <span className="text-indigo-500">👀</span>
              <span className="ml-1">{recipe.viewsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
