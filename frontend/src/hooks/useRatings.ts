import { useState, useEffect, useCallback } from 'react';
import { ratingService } from '@/services';
import { HttpError } from '@/services/base/http.service';
import { useAsync, useAsyncCallback } from './useAsync';
import { useErrorHandler } from './useErrorHandler';
import { 
  Rating, 
  CreateRatingForm, 
  UpdateRatingForm, 
  RatingSummary, 
  RatingStats,
  PaginatedResult 
} from '@/types/api.types';
import { GetRatingsParams, GetUserRatingsParams } from '@/services/rating.service';

// Hook for managing recipe ratings
export function useRecipeRatings(recipeId: string, params?: GetRatingsParams) {
  const { handleError } = useErrorHandler();

  const ratingsQuery = useAsync(
    () => ratingService.getRecipeRatings(recipeId, params),
    { executeOnMount: true, dependencies: [recipeId, JSON.stringify(params)] }
  );

  const summaryQuery = useAsync(
    () => ratingService.getRecipeRatingSummary(recipeId),
    { executeOnMount: true, dependencies: [recipeId] }
  );

  const userRatingQuery = useAsync(
    async () => {
      try {
        return await ratingService.getUserRecipeRating(recipeId);
      } catch (error) {
        // Handle 404 (user hasn't rated) or auth errors - just return null
        if (error instanceof HttpError && (error.isNotFoundError() || error.isAuthenticationError())) {
          return null;
        }
        // For other errors, re-throw
        throw error;
      }
    },
    { executeOnMount: true, dependencies: [recipeId] }
  );

  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        ratingsQuery.execute(),
        summaryQuery.execute(),
        userRatingQuery.execute()
      ]);
    } catch (error) {
      handleError(error);
    }
  }, [ratingsQuery.execute, summaryQuery.execute, userRatingQuery.execute, handleError]);

  return {
    ratings: ratingsQuery.data,
    ratingsLoading: ratingsQuery.loading,
    ratingsError: ratingsQuery.error,
    summary: summaryQuery.data,
    summaryLoading: summaryQuery.loading,
    summaryError: summaryQuery.error,
    userRating: userRatingQuery.data,
    userRatingLoading: userRatingQuery.loading,
    userRatingError: userRatingQuery.error,
    refresh,
  };
}

// Hook for creating ratings
export function useCreateRating() {
  const { handleError } = useErrorHandler();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { execute, loading, error, reset } = useAsyncCallback(
    async (recipeId: string, ratingData: CreateRatingForm) => {
      const result = await ratingService.createRating(recipeId, ratingData);
      setSuccessMessage('Rating submitted successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      return result;
    }
  );

  const createRating = useCallback(async (recipeId: string, ratingData: CreateRatingForm) => {
    try {
      return await execute(recipeId, ratingData);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [execute, handleError]);

  return {
    createRating,
    loading,
    error,
    successMessage,
    reset,
  };
}

// Hook for updating ratings
export function useUpdateRating() {
  const { handleError } = useErrorHandler();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { execute, loading, error, reset } = useAsyncCallback(
    async (ratingId: string, ratingData: UpdateRatingForm) => {
      const result = await ratingService.updateRating(ratingId, ratingData);
      setSuccessMessage('Rating updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      return result;
    }
  );

  const updateRating = useCallback(async (ratingId: string, ratingData: UpdateRatingForm) => {
    try {
      return await execute(ratingId, ratingData);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [execute, handleError]);

  return {
    updateRating,
    loading,
    error,
    successMessage,
    reset,
  };
}

// Hook for deleting ratings
export function useDeleteRating() {
  const { handleError } = useErrorHandler();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { execute, loading, error, reset } = useAsyncCallback(
    async (ratingId: string) => {
      await ratingService.deleteRating(ratingId);
      setSuccessMessage('Rating deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  );

  const deleteRating = useCallback(async (ratingId: string) => {
    try {
      await execute(ratingId);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [execute, handleError]);

  return {
    deleteRating,
    loading,
    error,
    successMessage,
    reset,
  };
}

// Hook for user's own ratings
export function useMyRatings(params?: GetUserRatingsParams) {
  const { handleError } = useErrorHandler();

  const ratingsQuery = useAsync(
    () => ratingService.getMyRatings(params),
    { executeOnMount: true, dependencies: [JSON.stringify(params)] }
  );

  const statsQuery = useAsync(
    () => ratingService.getMyRatingStats(),
    { executeOnMount: true }
  );

  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        ratingsQuery.execute(),
        statsQuery.execute()
      ]);
    } catch (error) {
      handleError(error);
    }
  }, [ratingsQuery.execute, statsQuery.execute, handleError]);

  return {
    ratings: ratingsQuery.data,
    ratingsLoading: ratingsQuery.loading,
    ratingsError: ratingsQuery.error,
    stats: statsQuery.data,
    statsLoading: statsQuery.loading,
    statsError: statsQuery.error,
    refresh,
  };
}

// Hook for helpful/report actions
export function useRatingActions() {
  const { handleError } = useErrorHandler();
  const [actionMessages, setActionMessages] = useState<{ [key: string]: string }>({});

  const markHelpful = useCallback(async (ratingId: string) => {
    try {
      await ratingService.markHelpful(ratingId);
      setActionMessages(prev => ({ 
        ...prev, 
        [ratingId]: 'Marked as helpful!' 
      }));
      // Clear message after 2 seconds
      setTimeout(() => {
        setActionMessages(prev => {
          const updated = { ...prev };
          delete updated[ratingId];
          return updated;
        });
      }, 2000);
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  const reportRating = useCallback(async (ratingId: string, reason?: string) => {
    try {
      await ratingService.reportRating(ratingId, reason);
      setActionMessages(prev => ({ 
        ...prev, 
        [ratingId]: 'Rating reported!' 
      }));
      setTimeout(() => {
        setActionMessages(prev => {
          const updated = { ...prev };
          delete updated[ratingId];
          return updated;
        });
      }, 2000);
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  return {
    markHelpful,
    reportRating,
    actionMessages,
  };
}

// Combined hook for full rating management on a recipe page
export function useRecipeRatingSystem(recipeId: string) {
  const ratingsData = useRecipeRatings(recipeId);
  const createRating = useCreateRating();
  const updateRating = useUpdateRating();
  const deleteRating = useDeleteRating();
  const actions = useRatingActions();

  // Refresh ratings after successful operations
  const handleRatingCreate = useCallback(async (ratingData: CreateRatingForm) => {
    const result = await createRating.createRating(recipeId, ratingData);
    await ratingsData.refresh();
    return result;
  }, [createRating.createRating, recipeId, ratingsData.refresh]);

  const handleRatingUpdate = useCallback(async (ratingId: string, ratingData: UpdateRatingForm) => {
    const result = await updateRating.updateRating(ratingId, ratingData);
    await ratingsData.refresh();
    return result;
  }, [updateRating.updateRating, ratingsData.refresh]);

  const handleRatingDelete = useCallback(async (ratingId: string) => {
    await deleteRating.deleteRating(ratingId);
    await ratingsData.refresh();
  }, [deleteRating.deleteRating, ratingsData.refresh]);

  const handleMarkHelpful = useCallback(async (ratingId: string) => {
    await actions.markHelpful(ratingId);
    await ratingsData.refresh(); // Refresh to update helpful counts
  }, [actions.markHelpful, ratingsData.refresh]);

  return {
    // Data
    ratings: ratingsData.ratings,
    summary: ratingsData.summary,
    userRating: ratingsData.userRating,
    
    // Loading states
    loading: ratingsData.ratingsLoading || ratingsData.summaryLoading,
    userRatingLoading: ratingsData.userRatingLoading,
    
    // Actions
    createRating: handleRatingCreate,
    updateRating: handleRatingUpdate,
    deleteRating: handleRatingDelete,
    markHelpful: handleMarkHelpful,
    reportRating: actions.reportRating,
    
    // Action states
    createLoading: createRating.loading,
    updateLoading: updateRating.loading,
    deleteLoading: deleteRating.loading,
    
    // Messages
    createSuccess: createRating.successMessage,
    updateSuccess: updateRating.successMessage,
    deleteSuccess: deleteRating.successMessage,
    actionMessages: actions.actionMessages,
    
    // Errors
    error: ratingsData.ratingsError || ratingsData.summaryError,
    createError: createRating.error,
    updateError: updateRating.error,
    deleteError: deleteRating.error,
    
    // Manual refresh
    refresh: ratingsData.refresh,
  };
}