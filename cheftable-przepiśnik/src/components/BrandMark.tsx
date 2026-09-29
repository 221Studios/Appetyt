import React from 'react';

interface BrandMarkProps {
  className?: string;
  alt?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = '', alt = '' }) => (
  <img
    src="/appetyt-mark.svg"
    alt={alt}
    aria-hidden={alt ? undefined : true}
    className={className}
  />
);
