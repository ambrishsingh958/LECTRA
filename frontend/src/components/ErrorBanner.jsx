import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      maxWidth: 420,
      background: 'var(--surface-card)',
      border: '1px solid var(--critical)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animation: 'fadeIn 0.25s ease'
    }}>
      <AlertCircle size={20} color="var(--critical)" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', flex: 1 }}>
        {message}
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 2 }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
