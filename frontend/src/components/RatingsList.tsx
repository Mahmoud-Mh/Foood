'use client';

import React, { useState, useCallback } from 'react';
import { User, Calendar, MoreVertical, Edit2, Trash2, Flag, ThumbsUp } from 'lucide-react';
import { ReadOnlyStarRating } from './StarRating';

export interface Rating {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  userFullName: string;
  userAvatar?: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingsListProps {
  ratings: Rating[];
  loading?: boolean;
  currentUserId?: string;
  onEdit?: (rating: Rating) => void;
  onDelete?: (ratingId: string) => void;
  onReport?: (ratingId: string) => void;
  onHelpful?: (ratingId: string) => void;
  className?: string;
  showActions?: boolean;
  emptyMessage?: string;
}

export const RatingsList: React.FC<RatingsListProps> = ({
  ratings,
  loading = false,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  onHelpful,
  className = '',
  showActions = true,
  emptyMessage = 'No reviews yet. Be the first to review this recipe!',
}) => {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const handleMenuToggle = useCallback((ratingId: string) => {
    setActionMenuOpen(actionMenuOpen === ratingId ? null : ratingId);
  }, [actionMenuOpen]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  }, []);

  const isOwnRating = useCallback((rating: Rating) => {
    return currentUserId === rating.userId;
  }, [currentUserId]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                <div className="flex-1">
                  <div className="w-32 h-4 bg-gray-300 rounded mb-1" />
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-32 h-4 bg-gray-300 rounded mb-3" />
              <div className="space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded" />
                <div className="w-3/4 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
          <ReadOnlyStarRating rating={0} size="lg" />
        </div>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ratings.map((rating) => (
        <div
          key={rating.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
        >
          {/* Rating Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {rating.userAvatar ? (
                  <img
                    src={rating.userAvatar}
                    alt={rating.userFullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {rating.userFullName}
                  </h4>
                  {rating.isVerified && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  )}
                  {isOwnRating(rating) && (
                    <span className="text-xs text-gray-500">(You)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(rating.createdAt)}</span>
                  {rating.updatedAt !== rating.createdAt && (
                    <span className="text-gray-400">• Edited</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            {showActions && (
              <div className="relative">
                <button
                  onClick={() => handleMenuToggle(rating.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {actionMenuOpen === rating.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActionMenuOpen(null)}
                    />
                    <div className="absolute right-0 top-6 z-20 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                      {isOwnRating(rating) && onEdit && (
                        <button
                          onClick={() => {
                            onEdit(rating);
                            setActionMenuOpen(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Review
                        </button>
                      )}
                      
                      {isOwnRating(rating) && onDelete && (
                        <button
                          onClick={() => {
                            onDelete(rating.id);
                            setActionMenuOpen(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Review
                        </button>
                      )}
                      
                      {!isOwnRating(rating) && onReport && (
                        <button
                          onClick={() => {
                            onReport(rating.id);
                            setActionMenuOpen(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Flag className="w-3 h-3" />
                          Report Review
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Star Rating */}
          <div className="mb-3">
            <ReadOnlyStarRating rating={rating.rating} size="sm" showValue />
          </div>

          {/* Comment */}
          {rating.comment && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {rating.comment}
              </p>
            </div>
          )}

          {/* Rating Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              {/* Helpful Button */}
              {!isOwnRating(rating) && onHelpful && (
                <button
                  onClick={() => onHelpful(rating.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful</span>
                  {rating.helpfulCount > 0 && (
                    <span className="ml-1 text-gray-400">({rating.helpfulCount})</span>
                  )}
                </button>
              )}
            </div>

            {/* Rating Quality Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {rating.rating >= 4 && (
                <span className="text-green-600 font-medium">Recommends</span>
              )}
              {rating.rating === 3 && (
                <span className="text-yellow-600 font-medium">Mixed</span>
              )}
              {rating.rating <= 2 && (
                <span className="text-red-600 font-medium">Not Recommended</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Summary component showing rating distribution
interface RatingSummaryProps {
  averageRating: number;
  totalRatings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  className?: string;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({
  averageRating,
  totalRatings,
  distribution,
  className = '',
}) => {
  // Provide default values if undefined or invalid
  const safeDistribution = distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const safeAverageRating = isNaN(averageRating) ? 0 : averageRating;
  const safeTotalRatings = isNaN(totalRatings) ? 0 : totalRatings;
  const maxCount = Math.max(...Object.values(safeDistribution));

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-6 mb-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {safeAverageRating.toFixed(1)}
          </div>
          <ReadOnlyStarRating rating={safeAverageRating} size="md" />
          <div className="text-sm text-gray-600 mt-1">
            {safeTotalRatings.toLocaleString()} review{safeTotalRatings !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 max-w-xs">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600 w-8">{star}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{
                    width: maxCount > 0 ? `${(safeDistribution[star as keyof typeof safeDistribution] / maxCount) * 100}%` : '0%',
                  }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8 text-right">
                {safeDistribution[star as keyof typeof safeDistribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingsList;