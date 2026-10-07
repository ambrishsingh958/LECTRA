import React from 'react';
import { Play } from 'lucide-react';
import { formatTime } from '../lib/utils';

export default function TimestampChip({ seconds, onClick, active = false, className = '' }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(seconds);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`timestamp-chip ${active ? 'active-chip' : ''} ${className}`}
      title={`Jump video to ${formatTime(seconds)}`}
      aria-label={`Jump video to ${formatTime(seconds)}`}
    >
      <Play size={10} fill="currentColor" />
      <span>{formatTime(seconds)}</span>
    </button>
  );
}
