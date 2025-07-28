'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { recipeService, categoryService, ingredientService, userService, authService } from '@/services';
import { Recipe, Category, Ingredient } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
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

interface RecentActivity {
  type: 'user' | 'recipe' | 'category' | 'ingredient';
  action: string;
  item: any;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
      } catch (error) {
        console.error('Error checking admin access:', error);
        setError('Failed to verify admin permissions');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [
        recipesData,
        categoriesData,
        ingredientsData,
        usersData
      ] = await Promise.all([
        recipeService.getPublicRecipes({ limit: 100 }).catch(() => ({ data: [] })),
        categoryService.getAllPublicCategories().catch(() => []),
        ingredientService.getAllPublicIngredients().catch(() => []),
        userService.getAllUsers({ limit: 100 }).catch(() => ({ data: [] }))
      ]);

      const allRecipes = recipesData.data || [];
      const categories = Array.isArray(categoriesData) ? categoriesData : [];
      const ingredients = Array.isArray(ingredientsData) ? ingredientsData : [];
      const allUsers = usersData.data || [];

      // Calculate stats
      const stats: AdminStats = {
        totalUsers: allUsers.length,
        totalRecipes: allRecipes.length,
        totalCategories: categories.length,
        totalIngredients: ingredients.length,
        publishedRecipes: allRecipes.filter((r: Recipe) => r.status === 'published').length,
        draftRecipes: allRecipes.filter((r: Recipe) => r.status === 'draft').length,
        featuredRecipes: allRecipes.filter((r: Recipe) => r.isFeatured).length
      };

      setStats(stats);
      setRecentRecipes(allRecipes.slice(0, 5)); // Show 5 most recent
      setRecentUsers(allUsers.slice(0, 5)); // Show 5 most recent users
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your recipe platform</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-3">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recipes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecipes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-lg p-3">
                  <span className="text-2xl">📂</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-lg p-3">
                  <span className="text-2xl">🥕</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingredients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalIngredients}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published Recipes</p>
                  <p className="text-2xl font-bold text-green-600">{stats.publishedRecipes}</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft Recipes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.draftRecipes}</p>
                </div>
                <span className="text-3xl">📝</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Featured Recipes</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.featuredRecipes}</p>
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Recipes</h2>
              <Link href="/admin/recipes" className="text-indigo-600 hover:text-indigo-700 text-sm">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentRecipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🍽️</span>
                    <div>
                      <p className="font-medium text-gray-900">{recipe.title}</p>
                      <p className="text-sm text-gray-600">by {recipe.author?.firstName} {recipe.author?.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      recipe.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {recipe.status}
                    </span>
                    <Link href={`/recipes/${recipe.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
              <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-700 text-sm">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">👤</span>
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                      <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                        View
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">👥</span>
                  <p className="text-gray-500">No users found</p>
                  <p className="text-sm text-gray-400">Users will appear here once they register</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 