import React from 'react';
import '../../styles/Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  shape?: 'rect' | 'circle';
  count?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  shape = 'rect',
  count = 1,
  style = {},
  className = '',
}) => {
  const elements = [];

  for (let i = 0; i < count; i++) {
    elements.push(
      <div
        key={i}
        className={`skeleton-wrapper skeleton-${shape} ${className}`}
        style={{
          width,
          height,
          marginBottom: count > 1 && i !== count - 1 ? '12px' : 0,
          ...style,
        }}
      />
    );
  }

  return <>{elements}</>;
};

export default Skeleton;
