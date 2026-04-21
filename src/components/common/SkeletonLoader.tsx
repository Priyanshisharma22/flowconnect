import React from 'react'
import './SkeletonLoader.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

/**
 * Reusable Skeleton Loader Components
 * Pure CSS pulse animations - no external libraries
 */

// Basic skeleton text/line
export const SkeletonText: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
  style,
}) => (
  <div
    className={`skeleton-text ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      ...style,
    }}
  />
)

// Card skeleton - for integration cards, dashboard cards
export const SkeletonCard: React.FC<{ count?: number; variant?: 'default' | 'compact' }> = ({
  count = 1,
  variant = 'default',
}) => (
  <div className="skeleton-card-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div key={`card-${i}`} className="skeleton-card">
        {variant === 'default' && (
          <>
            <SkeletonText key={`card-${i}-text1`} width="60%" height={20} className="mb-3" />
            <SkeletonText key={`card-${i}-text2`} width="100%" height={12} className="mb-2" />
            <SkeletonText key={`card-${i}-text3`} width="85%" height={12} />
          </>
        )}
        {variant === 'compact' && (
          <>
            <SkeletonText key={`card-${i}-text1`} width="70%" height={16} className="mb-2" />
            <SkeletonText key={`card-${i}-text2`} width="90%" height={12} />
          </>
        )}
      </div>
    ))}
  </div>
)

// Row skeleton - for table/list rows
export const SkeletonRow: React.FC<{ columns?: number; count?: number }> = ({
  columns = 5,
  count = 3,
}) => (
  <div className="skeleton-row-container">
    {Array.from({ length: count }).map((_, rowIdx) => (
      <div key={`row-${rowIdx}`} className="skeleton-row">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <SkeletonText
            key={`col-${rowIdx}-${colIdx}`}
            width="90%"
            height={14}
          />
        ))}
      </div>
    ))}
  </div>
)

// Stats skeleton - for dashboard statistics
export const SkeletonStat: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="skeleton-stat-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div key={`stat-${i}`} className="skeleton-stat-card">
        <SkeletonText key={`stat-${i}-text1`} width="40%" height={14} className="mb-3" />
        <SkeletonText key={`stat-${i}-text2`} width="80%" height={24} className="mb-2" />
        <SkeletonText key={`stat-${i}-text3`} width="50%" height={12} />
      </div>
    ))}
  </div>
)


