import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Repeat,
  Share2,
  Download,
  Check,
  Gauge
} from 'lucide-react';
import { sounds } from '../lib/audio';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function VideoControlsBar({
  isPlaying,
  onTogglePlay,
  onSkipTime,
  playbackRate = 1,
  onChangeSpeed,
  isLoopingSection,
  onToggleLoopSection,
  onOpenExportModal,
  currentTime = 0,
  videoId
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    sounds.playTick();
    const url = new URL(window.location.origin + window.location.pathname);
    if (videoId) url.searchParams.set('v', videoId);
    if (currentTime > 0) url.searchParams.set('t', Math.floor(currentTime));

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="video-controls-bar">
      <div className="playback-group">
        {/* Rewind 10s */}
        <button
          type="button"
          className="control-btn"
          onClick={() => {
            sounds.playTick();
            onSkipTime(-10);
          }}
          title="Rewind 10 seconds (J / ←)"
        >
          <RotateCcw size={15} />
          <span className="btn-label">-10s</span>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          className="control-btn play-pause-btn"
          onClick={() => {
            sounds.playTick();
            onTogglePlay();
          }}
          title={isPlaying ? "Pause video (Space)" : "Play video (Space)"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
        </button>

        {/* Forward 10s */}
        <button
          type="button"
          className="control-btn"
          onClick={() => {
            sounds.playTick();
            onSkipTime(10);
          }}
          title="Skip forward 10 seconds (L / →)"
        >
          <RotateCw size={15} />
          <span className="btn-label">+10s</span>
        </button>
      </div>

      <div className="aux-controls-group">
        {/* Playback Speed selector */}
        <div className="speed-selector-wrapper">
          <Gauge size={14} className="speed-icon" />
          <div className="speed-chips">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`speed-chip ${playbackRate === s ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTick();
                  onChangeSpeed(s);
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Loop Current Chapter */}
        <button
          type="button"
          className={`control-btn loop-btn ${isLoopingSection ? 'active' : ''}`}
          onClick={() => {
            sounds.playTick();
            onToggleLoopSection();
          }}
          title={isLoopingSection ? "Disable chapter loop" : "Loop this lecture chapter"}
        >
          <Repeat size={14} />
          <span>Loop Chapter</span>
        </button>

        {/* Copy Share Link at Timestamp */}
        <button
          type="button"
          className={`control-btn ${copiedLink ? 'copied' : ''}`}
          onClick={handleCopyLink}
          title="Copy share link at current timestamp"
        >
          {copiedLink ? <Check size={14} color="#10B981" /> : <Share2 size={14} />}
          <span>{copiedLink ? 'Copied Link!' : 'Share Time'}</span>
        </button>

        {/* Export Study Kit */}
        <button
          type="button"
          className="control-btn export-trigger-btn"
          onClick={() => {
            sounds.playTick();
            onOpenExportModal();
          }}
          title="Export Study Kit to Markdown, Anki, or PDF"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
