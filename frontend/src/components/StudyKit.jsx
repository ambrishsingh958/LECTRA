import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Layers,
  HelpCircle,
  Search,
  ShieldCheck,
  Database,
  FileEdit
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import ChapterScrubber from './ChapterScrubber';
import VideoControlsBar from './VideoControlsBar';
import SummaryTab from './SummaryTab';
import FlashcardsTab from './FlashcardsTab';
import QuizTab from './QuizTab';
import NotesTab from './NotesTab';
import SearchTab from './SearchTab';
import ExportModal from './ExportModal';
import { SeekLockManager, findActiveTimelineItem, scrollItemIntoView } from '../lib/sync';
import { formatTime } from '../lib/utils';
import { sounds } from '../lib/audio';

export default function StudyKit({
  studyKit,
  initialTime = 0,
  onBackToHome
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'flashcards' | 'quiz' | 'notes' | 'search'
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeKeyPointId, setActiveKeyPointId] = useState(null);

  // Playback control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoopingSection, setIsLoopingSection] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const playerRef = useRef(null);
  const seekLockRef = useRef(new SeekLockManager(600));

  const sections = studyKit?.summary?.sections || [];

  // Find active section object
  const activeSection = useMemo(() => {
    if (!sections.length) return null;
    return sections.find((s) => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  // Build sorted timeline items for binary search sync
  const timelineItems = useMemo(() => {
    if (!sections.length) return [];
    const items = [];

    sections.forEach((sec, sIdx) => {
      items.push({
        type: 'section',
        id: sec.id || `sec-${sIdx}`,
        sectionId: sec.id || `sec-${sIdx}`,
        timestamp_sec: sec.start_sec || 0
      });

      (sec.key_points || []).forEach((kp, kpIdx) => {
        items.push({
          type: 'keypoint',
          id: `kp-${sec.id || sIdx}-${kpIdx}`,
          sectionId: sec.id || `sec-${sIdx}`,
          timestamp_sec: kp.timestamp_sec || 0
        });
      });
    });

    return items.sort((a, b) => a.timestamp_sec - b.timestamp_sec);
  }, [sections]);

  // Handle player time update (called ~every 250ms)
  const handleTimeUpdate = useCallback((time, vidDuration) => {
    setCurrentTime(time);
    if (vidDuration && vidDuration > 0) setDuration(vidDuration);

    // Section Loop Check
    if (isLoopingSection && activeSection && activeSection.end_sec) {
      if (time >= activeSection.end_sec - 0.5) {
        if (playerRef.current) {
          playerRef.current.seekTo(activeSection.start_sec || 0, true);
        }
        return;
      }
    }

    // If locked after a manual seek, skip auto-sync selection for 600ms
    if (seekLockRef.current.isLocked()) {
      return;
    }

    // Binary search for active timeline item
    const matched = findActiveTimelineItem(timelineItems, time);
    if (matched) {
      if (matched.sectionId && matched.sectionId !== activeSectionId) {
        setActiveSectionId(matched.sectionId);
      }
      if (matched.type === 'keypoint') {
        if (matched.id !== activeKeyPointId) {
          setActiveKeyPointId(matched.id);
          if (activeTab === 'summary') {
            scrollItemIntoView(matched.id);
          }
        }
      }
    }
  }, [timelineItems, activeSectionId, activeKeyPointId, activeTab, isLoopingSection, activeSection]);

  // User clicked a timestamp anywhere in study kit
  const handleSeek = useCallback((timestampSec) => {
    const target = Math.max(0, timestampSec - 1);
    seekLockRef.current.lock();

    if (playerRef.current) {
      playerRef.current.seekTo(target, true);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }

    const matched = findActiveTimelineItem(timelineItems, timestampSec);
    if (matched) {
      setActiveSectionId(matched.sectionId);
      if (matched.type === 'keypoint') {
        setActiveKeyPointId(matched.id);
      }
    }
  }, [timelineItems]);

  // Controls handlers
  const handleTogglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const handleSkipTime = (offsetSec) => {
    const nextTime = Math.max(0, currentTime + offsetSec);
    handleSeek(nextTime);
  };

  const handleChangeSpeed = (speed) => {
    setPlaybackRate(speed);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Keyboard number shortcuts to switch tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '1') {
        sounds.playTick();
        setActiveTab('summary');
      } else if (e.key === '2') {
        sounds.playTick();
        setActiveTab('flashcards');
      } else if (e.key === '3') {
        sounds.playTick();
        setActiveTab('quiz');
      } else if (e.key === '4') {
        sounds.playTick();
        setActiveTab('notes');
      } else if (e.key === '5') {
        sounds.playTick();
        setActiveTab('search');
      } else if (e.key === 'j' || e.key === 'J') {
        handleSkipTime(-10);
      } else if (e.key === 'l' || e.key === 'L') {
        handleSkipTime(10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime]);

  const { video_id, title, cached } = studyKit;

  return (
    <div className="container">
      <div className="study-workspace">
        {/* LEFT COLUMN (42%): Sticky Video, Controls, Scrubber & Metadata */}
        <div className="video-column">
          <VideoPlayer
            ref={playerRef}
            videoId={video_id}
            initialTime={initialTime}
            onTimeUpdate={handleTimeUpdate}
            onPlayStateChange={(playing) => setIsPlaying(playing)}
          />

          {/* Interactive Chapter Scrubber */}
          <ChapterScrubber
            sections={sections}
            currentTime={currentTime}
            duration={duration}
            activeSectionId={activeSectionId}
            onSeek={handleSeek}
          />

          {/* Enhanced Video Playback Controls Bar */}
          <VideoControlsBar
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onSkipTime={handleSkipTime}
            playbackRate={playbackRate}
            onChangeSpeed={handleChangeSpeed}
            isLoopingSection={isLoopingSection}
            onToggleLoopSection={() => setIsLoopingSection(!isLoopingSection)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            currentTime={currentTime}
            videoId={video_id}
          />

          {/* Video Metadata Card */}
          <div className="video-meta-card">
            <div className="video-title-row">
              <h2 className="video-heading">{title || `Lecture ${video_id}`}</h2>
              <div className="verified-badge" title="Guaranteed: 100% of study kit timestamps snap to real transcript chunk starts">
                <ShieldCheck size={14} />
                <span>Timestamp-Verified</span>
              </div>
            </div>

            <div className="sync-status-indicator">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot" />
                <span>Timeline Synchronized (250ms Poll)</span>
              </div>

              <div className="timekeeper">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {cached && (
              <div style={{
                marginTop: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)'
              }}>
                <Database size={12} color="var(--primary)" />
                <span>Loaded from verified cache</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (58%): Interactive Study Workspace */}
        <div className="study-column">
          {/* Tabs Navigation */}
          <div className="tabs-navigation" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'summary'}
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTick();
                setActiveTab('summary');
              }}
            >
              <BookOpen size={16} />
              <span>Summary</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'flashcards'}
              className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTick();
                setActiveTab('flashcards');
              }}
            >
              <Layers size={16} />
              <span>Flashcards ({studyKit.flashcards?.length || 0})</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'quiz'}
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTick();
                setActiveTab('quiz');
              }}
            >
              <HelpCircle size={16} />
              <span>Quiz ({studyKit.quiz?.length || 0})</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'notes'}
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTick();
                setActiveTab('notes');
              }}
            >
              <FileEdit size={16} />
              <span>Notes</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'search'}
              className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTick();
                setActiveTab('search');
              }}
            >
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="tab-content-area" role="tabpanel">
            {activeTab === 'summary' && (
              <SummaryTab
                studyKit={studyKit}
                currentTime={currentTime}
                activeSectionId={activeSectionId}
                activeKeyPointId={activeKeyPointId}
                onSeek={handleSeek}
              />
            )}

            {activeTab === 'flashcards' && (
              <FlashcardsTab
                flashcards={studyKit.flashcards || []}
                onSeek={handleSeek}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizTab
                quiz={studyKit.quiz || []}
                onSeek={handleSeek}
              />
            )}

            {activeTab === 'notes' && (
              <NotesTab
                videoId={video_id}
                title={title}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            )}

            {activeTab === 'search' && (
              <SearchTab
                studyKit={studyKit}
                onSeek={handleSeek}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        studyKit={studyKit}
      />
    </div>
  );
}
