'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { userService, authService } from '@/services';
import { User, UserRole } from '@/types/api.types';
import Navbar from '@/components/Navbar';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const userId = params.id as string;
      const currentUser = await authService.getCurrentUser();
      
      // Check if viewing own profile
      if (currentUser?.id === userId) {
        setIsCurrentUser(true);
      }

      // Note: This endpoint might not exist yet in the backend
      // We'll need to implement it in the backend
      const userData = await userService.getUserById(userId);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load user data. The backend endpoint might not be implemented yet.');
    }
  }, [params.id]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const currentUser = await authService.getCurrentUser();
        if (currentUser?.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          return;
        }

        setIsAdmin(true);
        await loadUserData();
      } catch (error) {
        console.error('Failed to check admin access:', error);
        setError('Failed to verify admin access.');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router, loadUserData]);

  const handleToggleRole = async () => {
    if (!user) return;
    
    const newRole = user.role === UserRole.USER ? UserRole.ADMIN : UserRole.USER;
    
    try {
      await userService.updateUserRole(user.id, newRole);
      await loadUserData(); // Reload the user data
    } catch (error: unknown) {
      console.error('Failed to update user role:', error);
      let errorMessage = 'Failed to update user role.';
      
      if (error instanceof Error) {
        if (error.message?.includes('404')) {
          errorMessage = 'User not found or role update endpoint not available.';
        } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          errorMessage = 'You cannot change your own role.';
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      router.push('/admin/users');
    } catch (error: unknown) {
      console.error('Failed to delete user:', error);
      let errorMessage = 'Failed to delete user.';
      
      if (error instanceof Error) {
        if (error.message?.includes('500')) {
          errorMessage = 'Failed to delete user. The user may have associated data (recipes, etc.) that prevents deletion.';
        } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          errorMessage = 'You cannot delete yourself. Please use a different admin account.';
        } else if (error.message?.includes('404')) {
          errorMessage = 'User not found.';
        }
      }
      
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
            <p className="text-gray-600 mb-6">The user you are looking for does not exist.</p>
            <button 
              onClick={() => router.push('/admin/users')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600 mt-2">View and manage user information</p>
            </div>
            <button
              onClick={() => router.push('/admin/users')}
              className="text-gray-600 hover:text-gray-800 transition"
            >
              ← Back to Users
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Information */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-medium text-indigo-800">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
                {isCurrentUser && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    You
                  </span>
                )}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.bio || 'No bio provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Avatar</dt>
                  <dd className="mt-1">
                    {user.avatar ? (
                      <Image src={user.avatar} alt="Avatar" className="h-12 w-12 rounded-full" width={48} height={48} />
                    ) : (
                      <span className="text-sm text-gray-500">No avatar</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isCurrentUser && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="flex space-x-4">
              <button
                onClick={handleToggleRole}
                className={`px-4 py-2 rounded-lg transition ${
                  user.role === 'admin'
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {user.role === 'admin' ? 'Remove Admin Role' : 'Make Admin'}
              </button>
              <button
                onClick={handleDeleteUser}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg transition"
              >
                Delete User
              </button>
            </div>
          </div>
        )}

        {isCurrentUser && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Current User</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You cannot modify your own account from the admin panel. Use your profile page instead.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 