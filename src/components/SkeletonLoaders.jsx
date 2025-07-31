import React from 'react';

// Table Skeleton for AdminDashboard-style pages
export const TableSkeleton = ({ rows = 6, columns = 9 }) => {
  const skeletonRows = Array.from({ length: rows }, (_, i) => i);
  
  return (
    <>
      {skeletonRows.map((index) => (
        <tr key={index} className="border-b border-gray-200">
          {/* Name column with avatar */}
          <td className="px-2 py-1.5 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-gray-300 rounded-full mr-2 flex-shrink-0 shimmer"></div>
              <div className="min-w-0">
                <div className="h-3 bg-gray-300 rounded w-20 shimmer"></div>
              </div>
            </div>
          </td>
          {/* Remaining columns */}
          {Array.from({ length: columns - 1 }, (_, i) => (
            <td key={i} className="px-1 py-1.5 whitespace-nowrap">
              <div className={`h-3 bg-gray-300 rounded shimmer ${
                i === columns - 2 ? 'w-12' : // Actions column
                i === columns - 3 ? 'w-4' :  // Status dots
                i >= columns - 6 ? 'w-8' :   // Badge columns
                'w-16'                       // Text columns
              }`}></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Card Skeleton for AdminBanners, AdminDepartments-style pages
export const CardSkeleton = ({ cards = 6 }) => {
  const skeletonCards = Array.from({ length: cards }, (_, i) => i);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skeletonCards.map((index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
          {/* Card Header */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-gray-300 rounded w-24 shimmer"></div>
              <div className="flex space-x-2">
                <div className="w-6 h-6 bg-gray-300 rounded shimmer"></div>
                <div className="w-6 h-6 bg-gray-300 rounded shimmer"></div>
              </div>
            </div>
            
            {/* Card Content */}
            <div className="space-y-3">
              <div className="h-3 bg-gray-300 rounded w-full shimmer"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4 shimmer"></div>
            </div>
            
            {/* Card Footer */}
            <div className="mt-4 flex items-center justify-between">
              <div className="h-4 bg-gray-300 rounded w-16 shimmer"></div>
              <div className="h-6 bg-gray-300 rounded-full w-12 shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Banner Card Skeleton (specific for AdminBanners with image)
export const BannerCardSkeleton = ({ cards = 6 }) => {
  const skeletonCards = Array.from({ length: cards }, (_, i) => i);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skeletonCards.map((index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
          {/* Image Skeleton */}
          <div className="h-48 bg-gray-300 shimmer"></div>
          
          {/* Card Content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-gray-300 rounded w-32 shimmer"></div>
              <div className="flex space-x-2">
                <div className="w-7 h-7 bg-gray-300 rounded shimmer"></div>
                <div className="w-7 h-7 bg-gray-300 rounded shimmer"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-20 shimmer"></div>
              <div className="h-3 bg-gray-300 rounded w-24 shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// List Item Skeleton for AdminMeals, Meetings-style pages
export const ListItemSkeleton = ({ items = 8 }) => {
  const skeletonItems = Array.from({ length: items }, (_, i) => i);
  
  return (
    <div className="space-y-3">
      {skeletonItems.map((index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200/50 p-4">
          <div className="flex items-center justify-between">
            {/* Left side - User info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full shimmer"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24 shimmer"></div>
                <div className="h-3 bg-gray-300 rounded w-16 shimmer"></div>
              </div>
            </div>
            
            {/* Middle - Content */}
            <div className="flex-1 mx-6 space-y-2">
              <div className="h-3 bg-gray-300 rounded w-3/4 shimmer"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2 shimmer"></div>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded shimmer"></div>
              <div className="w-8 h-8 bg-gray-300 rounded shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Stats Cards Skeleton for dashboard-style statistics
export const StatsCardSkeleton = ({ cards = 4 }) => {
  const skeletonCards = Array.from({ length: cards }, (_, i) => i);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {skeletonCards.map((index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-lg shimmer"></div>
            <div className="ml-4 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-16 shimmer"></div>
              <div className="h-6 bg-gray-300 rounded w-12 shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Form Skeleton for form-heavy pages
export const FormSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-5 bg-gray-300 rounded w-32 shimmer"></div>
        <div className="h-3 bg-gray-300 rounded w-48 shimmer"></div>
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-20 shimmer"></div>
            <div className="h-10 bg-gray-300 rounded w-full shimmer"></div>
          </div>
        ))}
      </div>
      
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-300 rounded w-20 shimmer"></div>
        <div className="h-10 bg-gray-300 rounded w-16 shimmer"></div>
      </div>
    </div>
  );
};

// Generic Content Skeleton
export const ContentSkeleton = ({ lines = 6 }) => {
  const skeletonLines = Array.from({ length: lines }, (_, i) => i);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 space-y-3">
      {skeletonLines.map((index) => (
        <div key={index} className={`h-4 bg-gray-300 rounded shimmer ${
          index === lines - 1 ? 'w-2/3' : 'w-full'
        }`}></div>
      ))}
    </div>
  );
};

// Grid Skeleton for div-based grid layouts (like AdminVehicles)
export const GridSkeleton = ({ rows = 6 }) => {
  const skeletonRows = Array.from({ length: rows }, (_, i) => i);
  
  return (
    <div className="divide-y divide-gray-200">
      {skeletonRows.map((index) => (
        <div key={index} className="px-4 py-3">
          <div className="grid grid-cols-12 gap-4 items-center text-sm">
            {/* Vehicle Name - col-span-4 */}
            <div className="col-span-4">
              <div className="h-4 bg-gray-300 rounded w-32 shimmer"></div>
            </div>
            {/* Vehicle Number - col-span-3 */}
            <div className="col-span-3">
              <div className="h-6 bg-gray-300 rounded w-20 shimmer"></div>
            </div>
            {/* Created Date - col-span-3 */}
            <div className="col-span-3">
              <div className="h-4 bg-gray-300 rounded w-24 shimmer"></div>
            </div>
            {/* Actions - col-span-2 */}
            <div className="col-span-2 flex justify-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-lg shimmer"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-lg shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 