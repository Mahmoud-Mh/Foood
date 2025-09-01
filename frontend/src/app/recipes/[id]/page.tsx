'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { recipeService, authService } from '@/services';
import { Recipe, RecipeStatus, RecipeIngredient } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';
import { RatingsList, RatingSummary } from '@/components/RatingsList';
import { RatingForm } from '@/components/RatingForm';
import { useRecipeRatingSystem } from '@/hooks/useRatings';

export default function RecipeDetailPage() {
  const params = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [editingRating, setEditingRating] = useState(false);
  
  // Rating system
  const recipeId = params.id as string;
  const ratingsSystem = useRecipeRatingSystem(recipeId);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const recipeId = params.id as string;
        const recipeData = await recipeService.getRecipeById(recipeId);
        setRecipe(recipeData);
        
        // Check if current user is the owner
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setCurrentUserId(currentUser.id);
            if (recipeData.authorId === currentUser.id) {
              setIsOwner(true);
            }
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <Navbar />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <p className="text-lg text-gray-600">Loading delicious recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <Navbar />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{error || 'The recipe you are looking for does not exist.'}</p>
            <Link 
              href="/recipes"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
            >
              Browse Recipes
            </Link>
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
        <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-gradient-to-br from-green-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navbar />

      {/* Recipe Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Owner Actions */}
        {isOwner && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Recipe Management
                </h3>
                <p className="text-gray-600">Manage your recipe visibility and settings</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-2xl">
                  <span className="text-sm font-medium text-gray-700">Visibility:</span>
                  <button
                    onClick={handleStatusToggle}
                    disabled={updatingStatus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg ${
                      recipe.status === RecipeStatus.PUBLISHED 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        recipe.status === RecipeStatus.PUBLISHED ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {recipe.status === RecipeStatus.PUBLISHED ? '🌍 Public' : '🔒 Private'}
                  </span>
                </div>
                <Link
                  href={`/recipes/${recipe.id}/edit`}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Recipe
                </Link>
              </div>
            </div>
            {updatingStatus && (
              <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-indigo-700 font-medium">Updating recipe status...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recipe Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden mb-12 border border-gray-100">
          <div className="relative h-64 md:h-96">
            <Image
              src={FormatUtils.getImageUrl(recipe.imageUrl)}
              alt={recipe.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <span className={`px-4 py-2 rounded-2xl text-sm font-semibold border backdrop-blur-sm shadow-lg ${FormatUtils.getDifficultyColor(recipe.difficulty)}`}>
                {FormatUtils.formatDifficulty(recipe.difficulty)}
              </span>
              {isOwner && (
                <span className={`px-4 py-2 rounded-2xl text-sm font-semibold border backdrop-blur-sm shadow-lg ${
                  recipe.status === RecipeStatus.PUBLISHED 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}>
                  {recipe.status === RecipeStatus.PUBLISHED ? 'Published' : 'Draft'}
                </span>
              )}
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">{recipe.title}</h1>
            </div>
          </div>
          
          <div className="p-8">
            <div className="mb-8">
              <p className="text-xl text-gray-600 leading-relaxed">{recipe.description}</p>
            </div>
            
            {/* Recipe Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-indigo-600 mb-1">{recipe.prepTimeMinutes}</div>
                <div className="text-sm text-gray-600 font-medium">Prep Time (min)</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">{recipe.cookTimeMinutes}</div>
                <div className="text-sm text-gray-600 font-medium">Cook Time (min)</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">{recipe.servings}</div>
                <div className="text-sm text-gray-600 font-medium">Servings</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{recipe.ingredients?.length || 0}</div>
                <div className="text-sm text-gray-600 font-medium">Ingredients</div>
              </div>
              
              {/* Rating Stats */}
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {ratingsSystem.summary ? ratingsSystem.summary.averageRating.toFixed(1) : '—'}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Rating ({ratingsSystem.summary?.ratingsCount || 0})
                </div>
              </div>
            </div>

            {/* Recipe Meta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                {recipe.category && (
                  <span className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium border border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-300">
                    <span className="mr-2 text-lg">{recipe.category.icon}</span>
                    {recipe.category.name}
                  </span>
                )}
                <div className="flex items-center gap-6 text-gray-500 text-sm">
                  <span className="flex items-center bg-white px-3 py-2 rounded-full border border-gray-200">
                    <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-medium">{recipe.viewsCount || 0}</span>
                    <span className="text-gray-400 ml-1">views</span>
                  </span>
                  <span className="flex items-center bg-white px-3 py-2 rounded-full border border-gray-200">
                    <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium">{recipe.likesCount || 0}</span>
                    <span className="text-gray-400 ml-1">likes</span>
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">{new Date(recipe.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {recipe.author && (
                <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-2xl border border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {recipe.author.firstName?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {FormatUtils.formatUserName(recipe.author.firstName, recipe.author.lastName)}
                    </div>
                    <div className="text-xs text-gray-500">Recipe Author</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 sticky top-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                Ingredients
              </h2>
              <div className="space-y-4">
                {recipe.ingredients?.map((ingredient: RecipeIngredient, index: number) => (
                  <div key={index} className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl hover:from-green-100 hover:to-emerald-100 transition-all duration-300 group border border-green-100 hover:border-green-200">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                        {ingredient.quantity} {ingredient.unit} {ingredient.ingredient?.name || 'Unknown'}
                      </div>
                      {ingredient.preparation && (
                        <div className="text-sm text-gray-600 mt-1 italic">{ingredient.preparation}</div>
                      )}
                    </div>
                    {ingredient.isOptional && (
                      <span className="text-xs text-gray-500 bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full font-medium">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Instructions
              </h2>
              <div className="space-y-8">
                {recipe.steps?.map((step, index) => (
                  <div key={index} className="flex space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                        {step.stepNumber}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">{step.instructions}</p>
                      
                      {step.imageUrl && (
                        <div className="relative h-64 mb-4 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                          <Image
                            src={FormatUtils.getImageUrl(step.imageUrl)}
                            alt={step.title}
                            fill
                            className="object-cover hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 text-sm mb-4">
                        {step.timeMinutes && step.timeMinutes > 0 && (
                          <span className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {step.timeMinutes} min
                          </span>
                        )}
                        {step.temperature && (
                          <span className="flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {step.temperature}
                          </span>
                        )}
                        {step.tips && (
                          <span className="flex items-center bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            {step.tips}
                          </span>
                        )}
                      </div>
                      
                      {step.equipment && step.equipment.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                          <span className="text-sm font-medium text-blue-800 flex items-center mb-2">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Equipment needed:
                          </span>
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
          <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Additional Information
            </h2>
            
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <span key={index} className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium border border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {recipe.notes && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Notes
                </h3>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{recipe.notes}</p>
                </div>
              </div>
            )}
            
            {recipe.nutritionalInfo && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Nutritional Information (per serving)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {recipe.nutritionalInfo.calories && (
                    <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-red-600 mb-1">{recipe.nutritionalInfo.calories}</div>
                      <div className="text-sm text-gray-600 font-medium">Calories</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.protein && (
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{recipe.nutritionalInfo.protein}g</div>
                      <div className="text-sm text-gray-600 font-medium">Protein</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.carbs && (
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h1a1 1 0 011 1v2h3V2a1 1 0 011-1h1a1 1 0 011 1v2h.5A1.5 1.5 0 0117 5.5v.55c0 1.84-1.23 3.43-2.96 3.9-.866.235-1.79.235-2.66 0C10.66 9.64 10 8.84 10 8v-.5A1.5 1.5 0 0111.5 6H12V4H9z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">{recipe.nutritionalInfo.carbs}g</div>
                      <div className="text-sm text-gray-600 font-medium">Carbs</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.fat && (
                    <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-yellow-600 mb-1">{recipe.nutritionalInfo.fat}g</div>
                      <div className="text-sm text-gray-600 font-medium">Fat</div>
                    </div>
                  )}
                  {recipe.nutritionalInfo.fiber && (
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">{recipe.nutritionalInfo.fiber}g</div>
                      <div className="text-sm text-gray-600 font-medium">Fiber</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rating Section */}
        <div className="mt-8 space-y-8">
          {/* Rating Summary */}
          {ratingsSystem.summary && (
            <RatingSummary
              averageRating={ratingsSystem.summary.averageRating}
              totalRatings={ratingsSystem.summary.ratingsCount}
              distribution={ratingsSystem.summary.ratingDistribution}
              className="bg-white/80 backdrop-blur-lg shadow-xl border border-gray-100"
            />
          )}

          {/* Rating Form for Authenticated Users */}
          {currentUserId && !isOwner && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </span>
                  {ratingsSystem.userRating ? 'Update Your Review' : 'Share Your Experience'}
                </h3>
              </div>
              
              {ratingsSystem.userRating && !editingRating ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 font-medium mb-2">You've already reviewed this recipe!</p>
                      <p className="text-blue-600 text-sm">You can edit your review or view it in the list below.</p>
                    </div>
                    <button
                      onClick={() => setEditingRating(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Edit Review
                    </button>
                  </div>
                </div>
              ) : (
                <RatingForm
                  recipeId={recipeId}
                  recipeName={recipe?.title}
                  existingRating={ratingsSystem.userRating ? {
                    id: ratingsSystem.userRating.id,
                    rating: ratingsSystem.userRating.rating,
                    comment: ratingsSystem.userRating.comment
                  } : undefined}
                  isSubmitting={ratingsSystem.createLoading || ratingsSystem.updateLoading}
                  onSubmit={async (data) => {
                    if (ratingsSystem.userRating) {
                      await ratingsSystem.updateRating(ratingsSystem.userRating.id, data);
                      setEditingRating(false);
                    } else {
                      await ratingsSystem.createRating(data);
                    }
                  }}
                  onCancel={ratingsSystem.userRating ? () => setEditingRating(false) : undefined}
                  showRecipeName={false}
                />
              )}
            </div>
          )}

          {/* Rating List */}
          {ratingsSystem.ratings && ratingsSystem.ratings.data && ratingsSystem.ratings.data.length > 0 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                Reviews ({ratingsSystem.ratings.total})
              </h3>
              
              <RatingsList
                ratings={ratingsSystem.ratings.data}
                currentUserId={currentUserId}
                onEdit={(rating) => {
                  setEditingRating(true);
                }}
                onDelete={async (ratingId) => {
                  if (window.confirm('Are you sure you want to delete your review?')) {
                    await ratingsSystem.deleteRating(ratingId);
                  }
                }}
                onReport={async (ratingId) => {
                  const reason = window.prompt('Why are you reporting this review? (optional)');
                  await ratingsSystem.reportRating(ratingId, reason || undefined);
                }}
                onHelpful={ratingsSystem.markHelpful}
              />

              {/* Load More Ratings */}
              {ratingsSystem.ratings.hasNext && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      // TODO: Implement pagination
                      console.log('Load more ratings...');
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg"
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State for No Ratings */}
          {ratingsSystem.ratings && ratingsSystem.ratings.data && ratingsSystem.ratings.data.length === 0 && (
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600">Be the first to share your experience with this recipe!</p>
            </div>
          )}

          {/* Success Messages */}
          {(ratingsSystem.createSuccess || ratingsSystem.updateSuccess || ratingsSystem.deleteSuccess) && (
            <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {ratingsSystem.createSuccess || ratingsSystem.updateSuccess || ratingsSystem.deleteSuccess}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 