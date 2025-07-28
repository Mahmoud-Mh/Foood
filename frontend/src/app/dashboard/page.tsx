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

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user.firstName}! 👋
              </h1>
              <p className="text-gray-600">
                Ready to create something delicious today?
              </p>
            </div>
            <div className="mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-3 md:flex">
              <Link
                href="/recipes/create"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <span className="mr-2">✨</span>
                Create New Recipe
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <span className="mr-2">🔍</span>
                Browse Recipes
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            href="/recipes/create"
            className="bg-indigo-600 text-white p-6 rounded-xl hover:bg-indigo-700 transition group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Create Recipe</h3>
                <p className="text-indigo-100 text-sm">Share your culinary creation</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/recipes"
            className="bg-white border-2 border-gray-200 p-6 rounded-xl hover:border-indigo-300 transition group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Recipes</h3>
                <p className="text-gray-600 text-sm">Discover new dishes</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/profile"
            className="bg-white border-2 border-gray-200 p-6 rounded-xl hover:border-indigo-300 transition group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Profile</h3>
                <p className="text-gray-600 text-sm">Manage your account</p>
              </div>
            </div>
          </Link>
        </div>

        {/* My Recipes Section */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Recipes</h2>
            <Link 
              href="/recipes/my-recipes"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {/* Fixed: Added proper null/undefined checking */}
          {myRecipes && myRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
              <p className="text-gray-600 mb-6">
                Start sharing your delicious recipes with the community!
              </p>
              <Link 
                href="/recipes/create"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Recipe
              </Link>
            </div>
          )}
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