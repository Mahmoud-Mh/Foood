'use client';

import React, { useState, useCallback } from 'react';
import { Star, Send, X, AlertCircle, CheckCircle } from 'lucide-react';
import { InteractiveStarRating } from './StarRating';

export interface RatingFormData {
  rating: number;
  comment?: string;
}

export interface RatingFormProps {
  recipeId: string;
  recipeName?: string;
  existingRating?: {
    id: string;
    rating: number;
    comment?: string;
  };
  isSubmitting?: boolean;
  onSubmit: (data: RatingFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  showRecipeName?: boolean;
  mode?: 'create' | 'edit';
}

export const RatingForm: React.FC<RatingFormProps> = ({
  recipeId,
  recipeName,
  existingRating,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className = '',
  showRecipeName = true,
  mode = existingRating ? 'edit' : 'create',
}) => {
  const [rating, setRating] = useState<number>(existingRating?.rating || 0);
  const [comment, setComment] = useState<string>(existingRating?.comment || '');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleRatingChange = useCallback((newRating: number) => {
    setRating(newRating);
    setError('');
  }, []);

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 1000) {
      setComment(value);
      setError('');
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length > 1000) {
      setError('Comment must be less than 1000 characters');
      return;
    }

    try {
      await onSubmit({
        rating,
        comment: comment.trim() || undefined,
      });
      
      setSuccess(true);
      
      // Clear form if creating new rating
      if (mode === 'create') {
        setRating(0);
        setComment('');
      }
      
      // Auto-hide success message
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    }
  }, [rating, comment, onSubmit, mode]);

  const handleCancel = useCallback(() => {
    setRating(existingRating?.rating || 0);
    setComment(existingRating?.comment || '');
    setError('');
    setSuccess(false);
    onCancel?.();
  }, [existingRating, onCancel]);

  const isValid = rating > 0;
  const hasChanges = mode === 'edit' ? 
    (rating !== existingRating?.rating || comment !== existingRating?.comment) :
    rating > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            {showRecipeName && recipeName && (
              <p className="text-sm text-gray-600 mt-1">
                for <span className="font-medium">{recipeName}</span>
              </p>
            )}
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Rating Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <InteractiveStarRating
              rating={rating}
              onRatingChange={handleRatingChange}
              size="lg"
              disabled={isSubmitting}
            />
            {rating > 0 && (
              <span className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <div className="space-y-2">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Review Comment <span className="text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <textarea
              id="comment"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Share your thoughts about this recipe... What did you like? Any tips or modifications?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              rows={4}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {comment.length}/1000
            </div>
          </div>
          {comment.length > 900 && (
            <p className="text-xs text-amber-600">
              {1000 - comment.length} characters remaining
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">
              {mode === 'edit' ? 'Review updated successfully!' : 'Review submitted successfully!'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={!isValid || !hasChanges || isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'edit' ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {mode === 'edit' ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Compact version for inline use
export interface CompactRatingFormProps {
  recipeId: string;
  onSubmit: (data: RatingFormData) => Promise<void>;
  className?: string;
}

export const CompactRatingForm: React.FC<CompactRatingFormProps> = ({
  recipeId,
  onSubmit,
  className = '',
}) => {
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onSubmit({ rating });
      setRating(0); // Reset after success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, onSubmit]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Quick Rate:</span>
      <InteractiveStarRating
        rating={rating}
        onRatingChange={setRating}
        size="md"
        disabled={isSubmitting}
      />
      {rating > 0 && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="w-3 h-3 border border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          Submit
        </button>
      )}
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
};

export default RatingForm;