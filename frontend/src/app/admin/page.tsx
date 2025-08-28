'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { recipeService, categoryService, ingredientService, userService, authService } from '@/services';
import { Recipe, User } from '@/types/api.types';
import Navbar from '@/components/Navbar';

interface AdminStats {
  totalUsers: number;
  totalRecipes: number;
  totalCategories: number;
  totalIngredients: number;
  publishedRecipes: number;
  draftRecipes: number;
  featuredRecipes: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [recipesData, categoriesData, ingredientsData, usersData] = await Promise.all([
        recipeService.getPublicRecipes({ limit: 100 }).catch(() => ({ data: [] })),
        categoryService.getAllPublicCategories().catch(() => []),
        ingredientService.getAllPublicIngredients().catch(() => []),
        userService.getAllUsers({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const allRecipes = recipesData.data || [];
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      const ingredients = Array.isArray(ingredientsData) ? ingredientsData : [];
      const allUsers = usersData.data || [];

      const newStats: AdminStats = {
        totalUsers: allUsers.length,
        totalRecipes: allRecipes.length,
        totalCategories: categories.length,
        totalIngredients: ingredients.length,
        publishedRecipes: allRecipes.filter((r: Recipe) => r.status === 'published').length,
        draftRecipes: allRecipes.filter((r: Recipe) => r.status === 'draft').length,
        featuredRecipes: allRecipes.filter((r: Recipe) => r.isFeatured).length,
      };

      setStats(newStats);
      setRecentRecipes(allRecipes.slice(0, 5));
      setRecentUsers(allUsers.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    }
  }, []);

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
        await loadDashboardData();
      } catch (err) {
        console.error('Error checking admin access:', err);
        setError('Failed to verify admin permissions');
      } finally {
        setLoading(false);
      }
    };

    void checkAdminAccess();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-8 text-lg">{error || 'You do not have permission to access this page.'}</p>
              <Link 
                href="/"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-xl transform hover:scale-105"
              >
                Go to Home
                <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Admin Dashboard</h1>
            <p className="text-gray-600 text-xl">Manage your recipe platform with powerful admin tools</p>
          </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-3 shadow-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-3 shadow-lg">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Total Recipes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.totalRecipes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-3 shadow-lg">
                  <span className="text-2xl">📂</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Categories</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.totalCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-3 shadow-lg">
                  <span className="text-2xl">🥕</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600">Ingredients</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">{stats.totalIngredients}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Published Recipes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.publishedRecipes}</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Draft Recipes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.draftRecipes}</p>
                </div>
                <span className="text-3xl">📝</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Featured Recipes</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.featuredRecipes}</p>
                </div>
                <span className="text-3xl">⭐</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl mr-3">👥</span>
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">View and edit user accounts</p>
              </div>
            </Link>

            <Link 
              href="/admin/recipes"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl mr-3">🍽️</span>
              <div>
                <p className="font-medium text-gray-900">Manage Recipes</p>
                <p className="text-sm text-gray-600">Review and moderate recipes</p>
              </div>
            </Link>

            <Link 
              href="/admin/categories"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl mr-3">📂</span>
              <div>
                <p className="font-medium text-gray-900">Manage Categories</p>
                <p className="text-sm text-gray-600">Add and edit categories</p>
              </div>
            </Link>

            <Link 
              href="/admin/ingredients"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-2xl mr-3">🥕</span>
              <div>
                <p className="font-medium text-gray-900">Manage Ingredients</p>
                <p className="text-sm text-gray-600">Add and edit ingredients</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Recipes */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Recent Recipes</h2>
                <Link href="/admin/recipes" className="group inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold">
                  View All
                  <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
            </div>
            <div className="space-y-4">
              {recentRecipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-300 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex items-center">
                      <span className="text-xl mr-4">🍽️</span>
                      <div>
                        <p className="font-semibold text-gray-900">{recipe.title}</p>
                        <p className="text-gray-600">by {recipe.author?.firstName} {recipe.author?.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold shadow-sm ${
                        recipe.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {recipe.status}
                      </span>
                      <Link href={`/recipes/${recipe.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                        View
                      </Link>
                    </div>
                  </div>
              ))}
            </div>
          </div>

            {/* Recent Users */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Recent Users</h2>
                <Link href="/admin/users" className="group inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold">
                  View All
                  <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
            </div>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-300 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-center">
                        <span className="text-xl mr-4">👤</span>
                        <div>
                          <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-semibold shadow-sm ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                          View
                        </Link>
                      </div>
                    </div>
                ))
              ) : (
                  <div className="text-center py-12">
                    <span className="text-5xl mb-6 block">👥</span>
                    <p className="text-gray-500 text-lg font-semibold mb-2">No users found</p>
                    <p className="text-gray-400">Users will appear here once they register</p>
                  </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 