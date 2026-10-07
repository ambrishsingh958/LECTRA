import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Space'], desc: 'Play / Pause video or Flip active flashcard' },
  { keys: ['←', '→'], desc: 'Previous / Next Flashcard' },
  { keys: ['J', 'L'], desc: 'Rewind 10s / Fast Forward 10s' },
  { keys: ['F'], desc: 'Toggle Fullscreen Focus Mode on Flashcards' },
  { keys: ['M'], desc: 'Toggle UI Sound Effects' },
  { keys: ['1', '2', '3', '4', '5'], desc: 'Switch Study Tabs (Summary, Flashcards, Quiz, Notes, Search)' }
];

export default function ShortcutsModal({
  isOpen,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog shortcuts-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 30, height: 30 }}>
              <Keyboard size={16} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Keyboard Shortcuts</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Boost your study efficiency with these quick keys.
          </p>

          <div className="shortcuts-table">
            {SHORTCUTS.map((s, idx) => (
              <div key={idx} className="shortcut-row">
                <div className="keys-container">
                  {s.keys.map((k, kIdx) => (
                    <kbd key={kIdx} className="kbd-badge">{k}</kbd>
                  ))}
                </div>
                <div className="shortcut-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
