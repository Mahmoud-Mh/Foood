'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authService, userService } from '@/services';
import { User } from '@/types/api.types';
import { FormatUtils } from '@/utils/formatters';
import { HttpError } from '@/services/base/http.service';
import { UpdateProfileData } from '@/services/user.service';
import ImageUpload from '@/components/ImageUpload';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import Navbar from '@/components/Navbar';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  bio: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile');
  
  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
    bio: ''
  });
  const [profileErrors, setProfileErrors] = useState<Partial<UpdateProfileData>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordFormData>>({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);
        setProfileData({
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          avatar: currentUser.avatar || '',
          bio: currentUser.bio || ''
        });
      } catch (error) {
        console.error('Profile loading error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      await userService.deleteAccount();
      
      // Account deleted successfully - logout and redirect
      authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error);
      if (error instanceof HttpError) {
        setDeleteError(error.message);
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: Partial<UpdateProfileData> = {};

    if (profileData.bio && profileData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: Partial<PasswordFormData> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one letter, one number and one special character';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setProfileSaving(true);
    setProfileSuccess('');

    try {
      // Always send avatar and bio fields, even if empty (to allow clearing)
      const updateData: UpdateProfileData = {
        avatar: profileData.avatar.trim() || '', // Send empty string instead of undefined
        bio: profileData.bio.trim() || ''
      };

      const updatedUser = await userService.updateProfile(updateData);
      
      setProfileSuccess('Profile updated successfully!');
      
      // Update the user state with new data from server
      setUser(updatedUser);
      
      // Update form data to match server response
      setProfileData(prev => ({
        ...prev,
        avatar: updatedUser.avatar || '',
        bio: updatedUser.bio || ''
      }));
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof HttpError) {
        if (error.message.includes('bio')) {
          setProfileErrors({ bio: error.message });
        } else {
          setProfileErrors({ bio: error.message });
        }
      } else {
        setProfileErrors({ bio: 'Failed to update profile' });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setPasswordSaving(true);
    setPasswordSuccess('');

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof HttpError) {
        if (error.status === 401) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        } else {
          setPasswordErrors({ currentPassword: error.message });
        }
      } else {
        setPasswordErrors({ currentPassword: 'Failed to change password' });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePasswordInputChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (passwordSuccess) {
      setPasswordSuccess('');
    }
  };

  const handleAvatarChange = (imageUrl: string) => {
    setProfileData(prev => ({ ...prev, avatar: imageUrl }));
    if (profileErrors.avatar) {
      setProfileErrors(prev => ({ ...prev, avatar: undefined }));
    }
    if (profileSuccess) {
      setProfileSuccess('');
    }
  };

  const handleAvatarError = (error: string) => {
    setProfileErrors(prev => ({ ...prev, avatar: error }));
  };

  const handleBioChange = (value: string) => {
    setProfileData(prev => ({ ...prev, bio: value }));
    if (profileErrors.bio) {
      setProfileErrors(prev => ({ ...prev, bio: undefined }));
    }
    if (profileSuccess) {
      setProfileSuccess('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your profile</p>
          <Link 
            href="/auth/login"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-6">
            <Image
              src={FormatUtils.getAvatarUrl(user.avatar, FormatUtils.formatUserName(user.firstName, user.lastName))}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {FormatUtils.formatUserName(user.firstName, user.lastName)}
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center space-x-4 mt-3">
                <span className="text-sm text-gray-500">
                  Member since {FormatUtils.formatDateShort(user.createdAt)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                {user.isActive && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Change Password
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'account'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                
                {/* Information about limitations */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> You can only update your avatar and bio. To change your name or email, please contact support.
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {profileSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                      {profileSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={profileData.firstName}
                        disabled
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Contact support to change</p>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={profileData.lastName}
                        disabled
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Contact support to change</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Contact support to change</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-6">
                      <ImageUpload
                        currentImageUrl={profileData.avatar}
                        onImageChange={handleAvatarChange}
                        onError={handleAvatarError}
                        type="avatar"
                        size="lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          Upload a new profile picture. The image will be automatically resized and optimized.
                        </p>
                        {profileErrors.avatar && (
                          <p className="mt-2 text-sm text-red-600">{profileErrors.avatar}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => handleBioChange(e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none ${
                        profileErrors.bio ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Tell us about your cooking passion..."
                      maxLength={500}
                    />
                    <div className="mt-1 flex justify-between">
                      {profileErrors.bio && (
                        <p className="text-sm text-red-600">{profileErrors.bio}</p>
                      )}
                      <p className="text-xs text-gray-500 ml-auto">
                        {profileData.bio.length}/500 characters
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Change Password</h3>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordSaving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-medium text-gray-900 mb-4">Account Information</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">User ID</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                        <dd className="mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                        <dd className="mt-1 text-sm text-gray-900">{FormatUtils.formatDate(user.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900">{FormatUtils.formatDate(user.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-base font-medium text-red-600 mb-4">Danger Zone</h4>
                    
                    {deleteError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
                        {deleteError}
                      </div>
                    )}
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600 mb-4">
                        Once you delete your account, there is no going back. This will permanently delete your profile, 
                        recipes, and all associated data.
                      </p>
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data, including recipes and uploaded images."
          confirmText="Yes, Delete Account"
          cancelText="Cancel"
          isDangerous={true}
          isLoading={isDeleting}
        />
      </div>
    );
  } 