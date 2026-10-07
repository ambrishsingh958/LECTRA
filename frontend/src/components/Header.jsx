import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  Keyboard,
  Download
} from 'lucide-react';
import { sounds } from '../lib/audio';

export default function Header({
  activeView,
  onNavigate,
  hasActiveKit,
  apiHealth,
  onOpenShortcuts,
  onOpenExport
}) {
  const [isMuted, setIsMuted] = useState(sounds.isMuted());

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
    if (!next) sounds.playTick();
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand" onClick={() => onNavigate('home')}>
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          <div className="brand-text-col">
            <span className="brand-name">LECTRA</span>
            <span className="brand-tagline">AI STUDY KIT</span>
          </div>
        </div>

        <nav className="nav-links">
          {activeView === 'study' && (
            <button
              type="button"
              className="btn-secondary nav-action-btn"
              onClick={() => onNavigate('home')}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}

          <button
            type="button"
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>

          {hasActiveKit && (
            <button
              type="button"
              className={`nav-item ${activeView === 'study' ? 'active' : ''}`}
              onClick={() => onNavigate('study')}
            >
              Study Kit
            </button>
          )}

          <button
            type="button"
            className={`nav-item ${activeView === 'demo' ? 'active' : ''}`}
            onClick={() => onNavigate('demo')}
          >
            Demos
          </button>

          <button
            type="button"
            className={`nav-item ${activeView === 'about' ? 'active' : ''}`}
            onClick={() => onNavigate('about')}
          >
            Architecture
          </button>

          {/* Export Quick Button if kit is open */}
          {hasActiveKit && activeView === 'study' && (
            <button
              type="button"
              className="header-icon-btn"
              onClick={onOpenExport}
              title="Export Study Kit"
            >
              <Download size={16} />
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            type="button"
            className={`header-icon-btn ${isMuted ? 'muted' : ''}`}
            onClick={handleToggleSound}
            title={isMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Shortcuts Info */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
          >
            <Keyboard size={16} />
          </button>

          {/* Health indicator badge */}
          <div className="status-badge">
            <span
              className="status-dot"
              style={{
                backgroundColor: apiHealth?.gemini_configured ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 8px ${apiHealth?.gemini_configured ? '#10B981' : '#F59E0B'}`
              }}
            />
            <span>{apiHealth?.gemini_configured ? 'AI Live' : 'Demo Ready'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
