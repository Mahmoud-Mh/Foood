'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { recipeService, authService } from '@/services';
import { Recipe, RecipeStatus } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setError('You must be logged in to access the admin dashboard');
          return;
        }

        const currentUser = await authService.getCurrentUser();
        if (currentUser?.role !== 'admin') {
          setError('You do not have permission to access the admin dashboard');
          return;
        }

        setIsAdmin(true);
        await loadRecipes();
      } catch (error) {
        console.error('Error checking admin access:', error);
        setError('Failed to verify admin permissions');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const loadRecipes = async () => {
    try {
      const response = await recipeService.getPublicRecipes({ limit: 100 });
      setRecipes(response.data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setError('Failed to load recipes');
    }
  };

  const handleStatusChange = async (recipeId: string, newStatus: RecipeStatus) => {
    try {
      await recipeService.updateRecipe(recipeId, { status: newStatus });
      await loadRecipes(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating recipe status:', error);
      setError('Failed to update recipe status');
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      await recipeService.deleteRecipe(recipeId);
      await loadRecipes(); // Reload to get updated data
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setError('Failed to delete recipe');
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesFilter = filter === 'all' || recipe.status === filter;
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error || 'You do not have permission to access this page.'}</p>
            <Link 
              href="/"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Home
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 text-red-700 text-sm font-medium mb-6 animate-bounce">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Admin Panel
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage 
            <span className="bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 bg-clip-text text-transparent block animate-pulse">
              Recipes
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 mb-8">
            Review, moderate and manage all recipes submitted by your community members
          </p>
          
          <Link 
            href="/admin"
            className="group inline-flex items-center border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold backdrop-blur-sm bg-white/50"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 mb-12 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter & Search
            </h3>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search recipes by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 hover:border-gray-300 transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-indigo-200'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                All ({recipes.length})
              </span>
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'published' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 border-2 border-transparent hover:border-green-200'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Published ({recipes.filter(r => r.status === 'published').length})
              </span>
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'draft' 
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 border-2 border-transparent hover:border-yellow-200'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Draft ({recipes.filter(r => r.status === 'draft').length})
              </span>
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                filter === 'archived' 
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 border-2 border-transparent hover:border-red-200'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0-6l-6 6" />
                </svg>
                Archived ({recipes.filter(r => r.status === 'archived').length})
              </span>
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {filteredRecipes.length}
              </span>
              {' '}Recipe{filteredRecipes.length !== 1 ? 's' : ''} Found
            </h2>
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filteredRecipes.map((recipe, index) => (
              <div key={recipe.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                <AdminRecipeCard 
                  recipe={recipe} 
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteRecipe}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="relative max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Recipes Found</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {filter === 'all' 
                  ? 'No recipes have been created yet. When users submit recipes, they will appear here.'
                  : `No ${filter} recipes found. Try selecting a different filter or adjusting your search.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Recipe Card Component
function AdminRecipeCard({ 
  recipe, 
  onStatusChange, 
  onDelete 
}: { 
  recipe: Recipe; 
  onStatusChange: (recipeId: string, newStatus: RecipeStatus) => Promise<void>;
  onDelete: (recipeId: string) => Promise<void>;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group">
      {/* Recipe Image */}
      <div className="relative h-48">
        <Image
          src={FormatUtils.getImageUrl(recipe.imageUrl)}
          alt={recipe.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-colors duration-300"></div>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor(recipe.status)} shadow-lg`}>
            {recipe.status.charAt(0).toUpperCase() + recipe.status.slice(1)}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-white/90 text-sm font-medium backdrop-blur-sm bg-black/20 rounded-full px-3 py-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {FormatUtils.formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)}
            </div>
            <div className="flex items-center text-white/90 text-sm font-medium backdrop-blur-sm bg-black/20 rounded-full px-3 py-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {recipe.viewsCount || 0}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recipe Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-xl mb-2 text-gray-900 leading-tight line-clamp-2">
            {recipe.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {FormatUtils.truncateText(recipe.description, 120)}
          </p>
        </div>
        
        {/* Author & Category */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center text-sm">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
              {recipe.author?.firstName?.[0] || 'U'}
            </div>
            <span className="text-gray-700 font-medium">
              {FormatUtils.formatUserName(recipe.author?.firstName, recipe.author?.lastName)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{recipe.category?.name || 'Uncategorized'}</span>
            <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <Link 
            href={`/recipes/${recipe.id}`}
            className="flex-1 min-w-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-center text-sm font-semibold"
          >
            View
          </Link>
          <Link 
            href={`/recipes/${recipe.id}/edit`}
            className="flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 text-center text-sm font-semibold"
          >
            Edit
          </Link>
          
          {recipe.status === 'draft' && (
            <button
              onClick={() => onStatusChange(recipe.id, RecipeStatus.PUBLISHED)}
              className="flex-1 min-w-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 text-sm font-semibold"
            >
              Publish
            </button>
          )}
          {recipe.status === 'published' && (
            <button
              onClick={() => onStatusChange(recipe.id, RecipeStatus.DRAFT)}
              className="flex-1 min-w-0 bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 text-sm font-semibold"
            >
              Unpublish
            </button>
          )}
          <button
            onClick={() => onDelete(recipe.id)}
            className="flex-1 min-w-0 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 