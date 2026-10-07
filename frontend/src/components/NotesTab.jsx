import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Download,
  Bookmark,
  Sparkles,
  Share2
} from 'lucide-react';
import { formatTime } from '../lib/utils';
import { downloadFile } from '../lib/export';
import { sounds } from '../lib/audio';
import TimestampChip from './TimestampChip';

const SUGGESTED_TAGS = ['#Exam', '#Formula', '#KeyConcept', '#ReviewLater', '#Question'];

export default function NotesTab({
  videoId,
  title,
  currentTime = 0,
  onSeek
}) {
  const storageKey = `lectra_notes_${videoId || 'default'}`;
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        setNotes([]);
      }
    } catch (e) {
      setNotes([]);
    }
  }, [storageKey]);

  // Save to localStorage
  const persistNotes = (updated) => {
    setNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save notes:', e);
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    const trimmed = noteContent.trim();
    if (!trimmed) return;

    sounds.playTick();
    const newNote = {
      id: `note-${Date.now()}`,
      timestamp_sec: Math.floor(currentTime),
      text: selectedTag ? `${selectedTag} ${trimmed}` : trimmed,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Keep sorted by timestamp
    const updated = [...notes, newNote].sort((a, b) => a.timestamp_sec - b.timestamp_sec);
    persistNotes(updated);
    setNoteContent('');
    setSelectedTag('');
  };

  const handleDeleteNote = (id) => {
    sounds.playTick();
    const updated = notes.filter((n) => n.id !== id);
    persistNotes(updated);
  };

  const handleExportNotes = () => {
    sounds.playTick();
    if (notes.length === 0) return;

    let md = `# 📝 Lecture Notes: ${title || videoId}\n\n`;
    md += `> Generated on ${new Date().toLocaleDateString()} with LECTRA\n\n`;
    md += `---\n\n`;

    notes.forEach((n, idx) => {
      const timeStr = formatTime(n.timestamp_sec);
      const url = videoId ? `https://www.youtube.com/watch?v=${videoId}&t=${n.timestamp_sec}s` : '';
      const link = url ? `[${timeStr}](${url})` : `\`${timeStr}\``;
      md += `${idx + 1}. **${link}** — ${n.text} *(Added at ${n.createdAt})*\n\n`;
    });

    downloadFile(md, `LECTRA-Notes-${videoId || 'lecture'}.md`, 'text/markdown');
  };

  return (
    <div className="notes-tab-content">
      {/* Note Creator Form */}
      <form onSubmit={handleAddNote} className="note-editor-card">
        <div className="note-editor-header">
          <div className="timestamp-target">
            <Clock size={14} color="var(--primary)" />
            <span>Anchor at current playback: <strong>{formatTime(currentTime)}</strong></span>
          </div>

          <div className="suggested-tags-row">
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTick();
                  setSelectedTag(selectedTag === tag ? '' : tag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="note-input-wrapper">
          <textarea
            className="note-textarea"
            placeholder="Type your personal takeaway, exam reminder, or question here..."
            rows={3}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </div>

        <div className="note-editor-actions">
          <span className="note-help-text">
            Anchor your thoughts to the exact second in the lecture.
          </span>
          <button
            type="submit"
            className="btn-primary"
            disabled={!noteContent.trim()}
          >
            <Plus size={16} />
            <span>Add Timestamped Note</span>
          </button>
        </div>
      </form>

      {/* Notes List Header */}
      <div className="notes-list-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bookmark size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1.1rem' }}>Saved Notes ({notes.length})</h3>
        </div>

        {notes.length > 0 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportNotes}
            style={{ padding: '6px 12px', fontSize: '0.825rem' }}
          >
            <Download size={14} />
            <span>Export Notes (.md)</span>
          </button>
        )}
      </div>

      {/* Notes Timeline */}
      {notes.length === 0 ? (
        <div className="empty-notes-card">
          <div className="empty-icon-wrapper">
            <FileText size={28} color="var(--primary)" />
          </div>
          <h4>No notes created yet</h4>
          <p>
            Capture your own notes while watching the lecture. Each note will be linked to the video timestamp so you can jump back whenever you study!
          </p>
        </div>
      ) : (
        <div className="notes-timeline">
          {notes.map((note) => (
            <div key={note.id} className="note-item-card">
              <div className="note-item-left">
                <TimestampChip
                  seconds={note.timestamp_sec}
                  onClick={onSeek}
                />
                <span className="note-time-label">{note.createdAt}</span>
              </div>

              <div className="note-item-body">
                <p className="note-item-text">{note.text}</p>
              </div>

              <div className="note-item-actions">
                <button
                  type="button"
                  className="note-delete-btn"
                  onClick={() => handleDeleteNote(note.id)}
                  title="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
