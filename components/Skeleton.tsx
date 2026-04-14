'use client';
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-lg ${className}`} />
);

export const TripCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col md:flex-row gap-5 overflow-hidden">
    {/* Agency Info */}
    <div className="flex items-center gap-4 md:flex-col md:items-start md:w-44 md:border-r border-gray-100 dark:border-gray-700 md:pr-5">
      <Skeleton className="size-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    {/* Trip Details */}
    <div className="flex-1 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-4 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
    {/* Price & CTA */}
    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-5">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  </div>
);

export const BookingCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
    <div className="flex items-center md:flex-col md:items-start gap-4 md:w-48 md:border-r border-gray-100 dark:border-gray-700">
      <Skeleton className="size-12 rounded-xl flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="flex-1 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 pl-0 md:pl-6 gap-3">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  </div>
);

export const AgencyCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
    <Skeleton className="h-40 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl mt-2" />
    </div>
  </div>
);

export default Skeleton;
