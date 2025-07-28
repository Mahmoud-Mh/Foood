'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authService, recipeService } from '@/services';
import { User, Recipe } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Get current user
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        setUser(currentUser);

        // Get user's recipes - handle gracefully if it fails
        try {
          const recipesResult = await recipeService.getMyRecipes({ limit: 6 });
          setMyRecipes(recipesResult.data || []);
        } catch (recipeError) {
          // If recipes fail to load, just show empty state
          console.warn('Failed to load user recipes:', recipeError);
          setMyRecipes([]);
        }

      } catch (error) {
        console.error('Dashboard error:', error);
        setError('Failed to load dashboard data');
        // Redirect to login if authentication fails
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to load dashboard'}</p>
            <Link 
              href="/auth/login"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image
                  src={FormatUtils.getAvatarUrl(user.avatar, FormatUtils.formatUserName(user.firstName, user.lastName))}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Ready to create something delicious today?
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link
                href="/recipes/create"
                className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-lg"
              >
                <span className="mr-3">✨</span>
                Create New Recipe
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Recipes</p>
                <p className="text-2xl font-bold text-gray-900">{myRecipes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myRecipes.filter(r => r.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myRecipes.filter(r => r.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Recipes Section */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Recipes</h2>
              <p className="text-gray-600">Your culinary creations</p>
            </div>
            {myRecipes.length > 0 && (
              <Link 
                href="/recipes/my-recipes"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all →
              </Link>
            )}
          </div>

          {myRecipes && myRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No recipes yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start sharing your delicious recipes with the community! Create your first recipe and inspire others.
              </p>
              <Link 
                href="/recipes/create"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Create Your First Recipe
              </Link>
            </div>
          )}
        </div>

        {/* Quick Tips Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 Quick Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Add Photos</h4>
                <p className="text-sm text-gray-600">Include high-quality photos to make your recipes more appealing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Clear Instructions</h4>
                <p className="text-sm text-gray-600">Write step-by-step instructions that are easy to follow</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Be Specific</h4>
                <p className="text-sm text-gray-600">Include exact measurements and cooking times for best results</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Share Your Story</h4>
                <p className="text-sm text-gray-600">Add personal touches and stories to make your recipes unique</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recipe Card Component
function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group">
      <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition">
        <div className="relative h-32">
          <Image
            src={FormatUtils.getImageUrl(recipe.imageUrl)}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${FormatUtils.getDifficultyColor(recipe.difficulty)}`}>
              {FormatUtils.formatDifficulty(recipe.difficulty)}
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              recipe.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {recipe.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 group-hover:text-indigo-600 transition">
            {FormatUtils.truncateText(recipe.title, 40)}
          </h3>
          <div className="flex items-center justify-between text-sm text-gray-500">
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