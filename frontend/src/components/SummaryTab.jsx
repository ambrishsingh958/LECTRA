import React from 'react';
import { Clock, BookOpen, Layers, HelpCircle, CheckCircle } from 'lucide-react';
import TimestampChip from './TimestampChip';
import { formatTime } from '../lib/utils';

export default function SummaryTab({
  studyKit,
  currentTime,
  activeSectionId,
  activeKeyPointId,
  onSeek
}) {
  const { summary, flashcards, quiz, title } = studyKit;
  const sections = summary?.sections || [];

  const totalDuration = sections.length > 0
    ? Math.max(...sections.map(s => s.end_sec || 0))
    : 0;

  return (
    <div className="summary-tab-content">
      {/* Quick Lecture Stats Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        padding: '12px 16px',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <Clock size={14} color="var(--primary)" />
          <span>Duration: <strong style={{ color: 'var(--text-main)' }}>{formatTime(totalDuration)}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <BookOpen size={14} color="#60A5FA" />
          <span>Sections: <strong style={{ color: 'var(--text-main)' }}>{sections.length}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <Layers size={14} color="#34D399" />
          <span>Flashcards: <strong style={{ color: 'var(--text-main)' }}>{flashcards?.length || 0}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <HelpCircle size={14} color="#FBBF24" />
          <span>Quiz: <strong style={{ color: 'var(--text-main)' }}>{quiz?.length || 0} questions</strong></span>
        </div>
      </div>

      {/* TL;DR Box */}
      {summary?.tldr && (
        <div className="summary-tldr-card">
          <div className="section-label">Executive TL;DR</div>
          <p className="tldr-text">{summary.tldr}</p>
        </div>
      )}

      {/* Sections List */}
      <div className="sections-container">
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Lecture Breakdown & Key Moments</span>
        </h3>

        {sections.map((sec, index) => {
          const isSectionActive = activeSectionId === sec.id;
          return (
            <div
              key={sec.id || index}
              id={`section-${sec.id || index}`}
              className={`section-block ${isSectionActive ? 'active-section' : ''}`}
            >
              <div className="section-header">
                <div className="section-title">
                  {sec.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TimestampChip
                    seconds={sec.start_sec}
                    onClick={onSeek}
                    active={isSectionActive}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    to {formatTime(sec.end_sec)}
                  </span>
                </div>
              </div>

              <p className="section-summary-text">{sec.summary}</p>

              {sec.key_points && sec.key_points.length > 0 && (
                <div className="key-points-list">
                  {sec.key_points.map((kp, kpIdx) => {
                    const kpKey = `kp-${sec.id || index}-${kpIdx}`;
                    const isKpActive = activeKeyPointId === kpKey;
                    return (
                      <div
                        key={kpKey}
                        id={kpKey}
                        className={`key-point-item ${isKpActive ? 'active-item' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: 'var(--primary)', marginTop: 2, fontSize: '0.75rem' }}>•</span>
                          <span className="key-point-text">{kp.text}</span>
                        </div>
                        <TimestampChip
                          seconds={kp.timestamp_sec}
                          onClick={onSeek}
                          active={isKpActive}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
