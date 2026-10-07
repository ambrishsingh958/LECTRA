import React, { useState, useRef } from 'react';
import { formatTime } from '../lib/utils';

export default function ChapterScrubber({
  sections = [],
  currentTime = 0,
  duration = 0,
  activeSectionId,
  onSeek
}) {
  const [hoveredSection, setHoveredSection] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, time: 0 });
  const containerRef = useRef(null);

  if (!sections || sections.length === 0 || duration <= 0) {
    return null;
  }

  // Calculate playhead percentage
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const targetTime = ratio * duration;

    // Find section at this time
    const sec = sections.find(
      (s) => targetTime >= (s.start_sec || 0) && targetTime <= (s.end_sec || duration)
    ) || sections[sections.length - 1];

    setHoverPosition({ x, time: targetTime });
    setHoveredSection(sec);
  };

  const handleMouseLeave = () => {
    setHoveredSection(null);
  };

  const handleScrubberClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const targetTime = Math.max(0, Math.min(duration, ratio * duration));
    onSeek(targetTime);
  };

  return (
    <div className="chapter-scrubber-wrapper">
      <div className="scrubber-header">
        <span className="scrubber-title">Lecture Chapters Breakdown</span>
        <span className="scrubber-stats">{sections.length} segments mapped</span>
      </div>

      <div
        ref={containerRef}
        className="chapter-scrubber-bar"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleScrubberClick}
      >
        {/* Playhead marker line */}
        <div
          className="scrubber-playhead"
          style={{ left: `${playheadPercent}%` }}
        />

        {/* Individual chapter segments */}
        {sections.map((sec, idx) => {
          const start = sec.start_sec || 0;
          const end = sec.end_sec || (idx === sections.length - 1 ? duration : start + 60);
          const widthPercent = Math.max(1.5, ((end - start) / duration) * 100);
          const isActive = activeSectionId === sec.id;
          const isPassed = currentTime >= end;

          return (
            <div
              key={sec.id || idx}
              className={`scrubber-segment ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
              style={{ width: `${widthPercent}%` }}
              title={`${sec.title} (${formatTime(start)})`}
            >
              <div className="segment-fill" />
            </div>
          );
        })}

        {/* Hover Tooltip */}
        {hoveredSection && (
          <div
            className="scrubber-tooltip"
            style={{
              left: Math.min(
                (containerRef.current?.clientWidth || 300) - 100,
                Math.max(80, hoverPosition.x)
              )
            }}
          >
            <div className="tooltip-title">{hoveredSection.title}</div>
            <div className="tooltip-time">
              {formatTime(hoverPosition.time)} (Chapter starts: {formatTime(hoveredSection.start_sec)})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
