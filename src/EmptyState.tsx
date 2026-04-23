import React from 'react';

// This interface fixes the "Implicit Any" errors in TypeScript
interface EmptyStateProps {
  title?: string;
  desc?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, desc, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 transition-all duration-1000">
      
      {/* Aesthetic Icon Circle */}
      <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      </div>
      
      <h3 className="text-xl font-light tracking-tight text-zinc-800 mb-2">
        {title || "No data available"}
      </h3>
      
      <p className="text-zinc-500 text-sm max-w-[250px] leading-relaxed font-light">
        {desc || "There is nothing to show here at the moment."}
      </p>
      
      <button 
        onClick={onAction}
        className="mt-8 px-6 py-2 bg-black text-white rounded-full text-sm hover:opacity-80 transition-all shadow-sm active:scale-95"
      >
        Get Started
      </button>
    </div>
  );
};

export default EmptyState;