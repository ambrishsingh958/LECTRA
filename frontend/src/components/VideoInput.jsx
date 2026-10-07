import React, { useState } from 'react';
import { Search, Video, Sparkles, FileText, PlayCircle } from 'lucide-react';
import { parseVideoId } from '../lib/youtube';

export default function VideoInput({
  onSubmitUrl,
  onLoadDemo,
  onOpenPasteModal,
  demos = [],
  isLoading = false
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a YouTube video URL or video ID.');
      return;
    }

    const videoId = parseVideoId(trimmed);
    if (!videoId) {
      setErrorMsg('Please enter a valid YouTube video URL or video ID.');
      return;
    }

    onSubmitUrl(trimmed);
  };

  const handleSelectDemo = (demoId) => {
    setErrorMsg('');
    onLoadDemo(demoId);
  };

  return (
    <div className="input-card">
      <form onSubmit={handleSubmit}>
        <div className="input-row">
          <div className="input-field-wrapper">
            <Video size={20} className="input-icon" />
            <input
              type="text"
              className="video-input"
              placeholder="Paste YouTube lecture URL (e.g., https://www.youtube.com/watch?v=g78utcLQrJ4)"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !inputUrl.trim()}
          >
            <Sparkles size={16} />
            <span>{isLoading ? 'Processing...' : 'Generate Study Kit'}</span>
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--critical)', fontSize: '0.85rem', marginTop: 10, textAlign: 'left', paddingLeft: 4 }}>
            {errorMsg}
          </div>
        )}

        <div className="secondary-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleSelectDemo('g78utcLQrJ4')}
            disabled={isLoading}
          >
            <PlayCircle size={14} color="#10B981" />
            <span>Load Demo (Photosynthesis)</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenPasteModal}
            disabled={isLoading}
          >
            <FileText size={14} color="#34D399" />
            <span>Paste Transcript</span>
          </button>
        </div>

        {demos && demos.length > 0 && (
          <div className="quick-picks">
            <span className="quick-label">Or try verified lectures:</span>
            {demos.map((d) => (
              <button
                key={d.id}
                type="button"
                className="demo-chip"
                onClick={() => handleSelectDemo(d.id)}
                disabled={isLoading}
                title={d.description}
              >
                <span>{d.title.split(':')[0]}</span>
                <span className="tag-pill">{d.duration_label}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
