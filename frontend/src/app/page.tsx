'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { recipeService, categoryService, authService } from '@/services';
import { Recipe, Category } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRecipes, setCategoryRecipes] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        const allRecipes = publishedRecipesResult.data || [];
        setFeaturedRecipes(allRecipes.slice(0, 6)); // First 6 for featured
        setPopularRecipes(allRecipes.slice(6, 14)); // Next 8 for popular

        const categoriesList = Array.isArray(categoriesData) ? categoriesData.slice(0, 6) : [];
        setCategories(categoriesList);

        // Fetch recipes for each category to get counts
        const recipesMap: Record<string, any[]> = {};
        for (const category of categoriesList) {
          try {
            const recipesResponse = await recipeService.getPublicRecipes({ categoryId: category.id, limit: 6 });
            recipesMap[category.id] = recipesResponse.data || [];
          } catch (error) {
            console.error(`Error fetching recipes for category ${category.name}:`, error);
            recipesMap[category.id] = [];
          }
        }
        setCategoryRecipes(recipesMap);
      } catch (error) {
        console.error('Error loading homepage data:', error);
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover & Share
              <span className="text-indigo-600 block">Amazing Recipes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join our community of food lovers. Explore thousands of delicious recipes,
              share your culinary creations, and connect with fellow chefs around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/recipes"
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold"
              >
                Explore Recipes
              </Link>
              {!isAuthenticated && (
                <Link 
                  href="/auth/register"
                  className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-xl hover:bg-indigo-50 transition font-semibold"
                >
                  Join Community
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      {featuredRecipes.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Recipes</h2>
              <p className="text-gray-600">Discover amazing recipes from our community</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse Categories</h2>
              <p className="text-gray-600">Find recipes by your favorite cuisine type</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">More Great Recipes</h2>
              <p className="text-gray-600">Continue exploring our recipe collection</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularRecipes.map((recipe) => (
                <CompactRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State - Show if no recipes are available */}
      {featuredRecipes.length === 0 && popularRecipes.length === 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gray-50 rounded-xl p-12">
              <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Recipe Hub!</h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Our community is just getting started. Be among the first to share your amazing recipes 
                and help build this delicious platform together!
              </p>
              <Link 
                href="/auth/register"
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold inline-block"
              >
                Join & Share Your First Recipe
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Join Community Section - Only for non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Recipe Hub!</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our community is just getting started. Be among the first to share your amazing recipes 
              and help build this delicious platform together!
            </p>
            <Link 
              href="/auth/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold inline-block"
            >
              Join & Share Your First Recipe
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Recipe Hub</h3>
            <p className="text-gray-400 mb-6">
              Bringing food lovers together, one recipe at a time.
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-white transition">
                About
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition">
                Terms
              </Link>
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
        <div className="relative h-48">
          <Image
            src={FormatUtils.getImageUrl(recipe.imageUrl)}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${FormatUtils.getDifficultyColor(recipe.difficulty)}`}>
              {FormatUtils.formatDifficulty(recipe.difficulty)}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition">
            {recipe.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {FormatUtils.truncateText(recipe.description, 100)}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{FormatUtils.formatDuration(recipe.prepTimeMinutes + recipe.cookTimeMinutes)}</span>
            <span>{FormatUtils.formatServings(recipe.servings)}</span>
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

// Category Card Component
function CategoryCard({ category, recipeCount }: { category: Category, recipeCount: number }) {
  return (
    <Link href={`/recipes?category=${category.id}`} className="group">
      <div className="text-center">
        <div 
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 group-hover:scale-110 transition-transform bg-indigo-500"
        >
          {category.icon || category.name.charAt(0)}
        </div>
        <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition">
          {category.name}
        </h3>
        <p className="text-sm text-gray-500">
          {FormatUtils.formatNumber(recipeCount)} recipes
        </p>
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
