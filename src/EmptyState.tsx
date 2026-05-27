import React from 'react';

interface EmptyStateProps {
  title?: string;
  desc?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, desc, onAction }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, textAlign: 'center', padding: 24, transition: 'all 0.3s ease' }}>

      <div style={{
        width: 80, height: 80, marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-muted)',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 8, margin: '0 0 8px' }}>
        {title || 'No data available'}
      </h3>

      <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 250, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
        {desc || 'There is nothing to show here at the moment.'}
      </p>

      {onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 32,
            padding: '8px 24px',
            background: 'var(--gradient-primary)',
            color: 'white',
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          Get Started
        </button>
      )}
    </div>
  );
};

export default EmptyState;
