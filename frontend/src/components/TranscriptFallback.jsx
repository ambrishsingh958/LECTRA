import React, { useState } from 'react';
import { X, Upload, FileText, PlayCircle, AlertTriangle } from 'lucide-react';

export default function TranscriptFallback({
  isOpen,
  onClose,
  onSubmitTranscript,
  onLoadDemo,
  initialVideoId = '',
  errorMessage = ''
}) {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'upload' | 'demo'
  const [pastedText, setPastedText] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState('srt');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'vtt') {
      setFileFormat('vtt');
    } else if (ext === 'srt') {
      setFileFormat('srt');
    } else {
      setFileFormat('raw');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setFileContent(content);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmitTranscript({
        video_id: initialVideoId || 'custom-lecture',
        title: lectureTitle || 'Manual Lecture Transcript',
        text: pastedText,
        format: 'raw'
      });
      onClose();
    } catch (err) {
      setUploadError(err?.detail || 'Failed to process pasted transcript.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!fileContent.trim()) {
      setUploadError('Please select a valid SRT or VTT file.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitTranscript({
        video_id: initialVideoId || 'custom-lecture',
        title: lectureTitle || fileName || 'Subtitled Lecture',
        text: fileContent,
        format: fileFormat
      });
      onClose();
    } catch (err) {
      setUploadError(err?.detail || 'Failed to process file transcript.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--warning-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning)'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Live Transcript Unavailable</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {errorMessage || 'Subtitles could not be extracted directly from YouTube.'}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 20
        }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            <FileText size={14} />
            <span>Paste Transcript</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} />
            <span>Upload SRT/VTT</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            <PlayCircle size={14} />
            <span>Load Demo</span>
          </button>
        </div>

        {uploadError && (
          <div style={{ color: 'var(--critical)', fontSize: '0.85rem', marginBottom: 16 }}>
            {uploadError}
          </div>
        )}

        {/* TAB 1: PASTE TRANSCRIPT */}
        {activeTab === 'paste' && (
          <form onSubmit={handlePasteSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Lecture Title (Optional)
              </label>
              <input
                type="text"
                className="video-input"
                placeholder="e.g. Introduction to Quantum Computing"
                value={lectureTitle}
                onChange={(e) => setLectureTitle(e.target.value)}
                style={{ padding: '8px 12px' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Paste Raw Transcript or Timestamps
              </label>
              <textarea
                className="video-input"
                rows={7}
                placeholder="Paste speech-to-text notes or [00:15] timestamps here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                style={{ padding: '12px', resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting || !pastedText.trim()}>
                {isSubmitting ? 'Processing...' : 'Generate from Pasted Text'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: UPLOAD SRT / VTT */}
        {activeTab === 'upload' && (
          <form onSubmit={handleFileSubmit}>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '30px 20px',
              textAlign: 'center',
              marginBottom: 20,
              background: 'var(--surface-card)'
            }}>
              <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                {fileName ? fileName : 'Choose an .srt or .vtt subtitle file'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Standard SubRip (.srt) or WebVTT (.vtt) format with timestamps
              </p>
              <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <input
                  type="file"
                  accept=".srt,.vtt,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                Browse Files
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting || !fileContent.trim()}>
                {isSubmitting ? 'Processing File...' : 'Generate from File'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: LOAD DEMO LECTURE */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Continue immediately using one of our verified, pre-cached demonstration lectures:
            </p>

            <button
              type="button"
              className="feature-card"
              style={{ cursor: 'pointer', padding: 16 }}
              onClick={() => {
                onLoadDemo('g78utcLQrJ4');
                onClose();
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Photosynthesis: Light & Dark Reactions</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>5–7 mins • Biology & Bioenergetics</div>
                </div>
                <span className="badge-easy">Ready</span>
              </div>
            </button>

            <button
              type="button"
              className="feature-card"
              style={{ cursor: 'pointer', padding: 16 }}
              onClick={() => {
                onLoadDemo('wjZofJX0v4U');
                onClose();
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Neural Networks & Deep Learning</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>19 mins • 3Blue1Brown Chapter 1</div>
                </div>
                <span className="badge-medium">Ready</span>
              </div>
            </button>

            <button
              type="button"
              className="feature-card"
              style={{ cursor: 'pointer', padding: 16 }}
              onClick={() => {
                onLoadDemo('zjkBMFhNj_g');
                onClose();
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>MIT 6.006: Peak Finding & Complexity</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>51 mins • Algorithms & Proofs</div>
                </div>
                <span className="badge-hard">Ready</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
