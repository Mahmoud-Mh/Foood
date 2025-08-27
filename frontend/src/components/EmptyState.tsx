import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
  icon,
  className = ''
}) => {
  const defaultIcon = (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  const ActionComponent = () => {
    if (!actionLabel) return null;

    if (actionHref) {
      return (
        <Link 
          href={actionHref}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold inline-block"
        >
          {actionLabel}
        </Link>
      );
    }

    if (actionOnClick) {
      return (
        <button
          onClick={actionOnClick}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold"
        >
          {actionLabel}
        </button>
      );
    }

    return null;
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="bg-gray-50 rounded-xl p-12">
        <div className="bg-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          {icon || defaultIcon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{description}</p>
        <ActionComponent />
      </div>
    </div>
  );
};

export const SearchEmptyState: React.FC<{
  searchTerm?: string;
  onClear?: () => void;
}> = ({ searchTerm, onClear }) => {
  return (
    <EmptyState
      title="No results found"
      description={
        searchTerm 
          ? `No results found for "${searchTerm}". Try adjusting your search terms or filters.`
          : "No items match your current filters. Try adjusting your search criteria."
      }
      actionLabel={onClear ? "Clear filters" : undefined}
      actionOnClick={onClear}
      icon={
        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
    />
  );
};