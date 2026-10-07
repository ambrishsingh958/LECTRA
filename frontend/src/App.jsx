import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  PlayCircle,
  Clock,
  Trash2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Flame,
  Award
} from 'lucide-react';
import Header from './components/Header';
import VideoInput from './components/VideoInput';
import ProcessingScreen from './components/ProcessingScreen';
import StudyKit from './components/StudyKit';
import TranscriptFallback from './components/TranscriptFallback';
import ErrorBanner from './components/ErrorBanner';
import ShortcutsModal from './components/ShortcutsModal';
import ExportModal from './components/ExportModal';
import { fetchStudyKit, fetchKitById, fetchDemos, submitManualTranscript, checkHealth } from './lib/api';
import { getRecentLectures, saveRecentLecture, removeRecentLecture } from './lib/recent';
import { parseVideoId } from './lib/youtube';
import { sounds } from './lib/audio';

export default function App() {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'study' | 'demo' | 'about'
  const [studyKit, setStudyKit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [demos, setDemos] = useState([]);
  const [recentLectures, setRecentLectures] = useState([]);
  const [apiHealth, setApiHealth] = useState({ status: 'checking', gemini_configured: false });

  // Fallback modal state
  const [isFallbackOpen, setIsFallbackOpen] = useState(false);
  const [fallbackInitialVid, setFallbackInitialVid] = useState('');
  const [fallbackDetailMsg, setFallbackDetailMsg] = useState('');

  // Shortcuts & Export modals
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Deep linking initial seek time
  const [initialSeekTime, setInitialSeekTime] = useState(0);

  const updateUrlParams = (videoId, time = null) => {
    const url = new URL(window.location.href);
    if (videoId) {
      url.searchParams.set('v', videoId);
      if (time && time > 0) {
        url.searchParams.set('t', Math.floor(time));
      } else {
        url.searchParams.delete('t');
      }
    } else {
      url.searchParams.delete('v');
      url.searchParams.delete('t');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleLoadKit = useCallback(async (urlOrId, seekTime = 0) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchStudyKit(urlOrId);
      setStudyKit(data);
      saveRecentLecture(data);
      setRecentLectures(getRecentLectures());
      setActiveView('study');
      if (seekTime > 0) setInitialSeekTime(seekTime);
      updateUrlParams(data.video_id, seekTime);
    } catch (err) {
      console.warn('Kit fetch error:', err);
      const detail = err?.detail;
      const isTranscriptError = detail && (
        detail.can_fallback ||
        (typeof detail === 'string' && detail.includes('transcript')) ||
        (detail.message && detail.message.includes('transcript'))
      );

      if (isTranscriptError) {
        const vid = parseVideoId(urlOrId) || (typeof detail === 'object' ? detail.video_id : '');
        setFallbackInitialVid(vid);
        setFallbackDetailMsg(typeof detail === 'object' ? detail.error : detail);
        setIsFallbackOpen(true);
      } else {
        setErrorMessage(
          typeof detail === 'string' ? detail : 'Unable to generate study kit. Try a verified demo lecture.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadDemo = async (demoId) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchKitById(demoId);
      setStudyKit(data);
      saveRecentLecture(data);
      setRecentLectures(getRecentLectures());
      setActiveView('study');
      setInitialSeekTime(0);
      updateUrlParams(data.video_id);
    } catch (err) {
      console.warn('Demo load error:', err);
      setErrorMessage('Could not load demo kit. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTranscriptSubmit = async (payload) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await submitManualTranscript(payload);
      setStudyKit(data);
      saveRecentLecture(data);
      setRecentLectures(getRecentLectures());
      setActiveView('study');
      setInitialSeekTime(0);
      updateUrlParams(data.video_id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRecent = (e, videoId) => {
    e.stopPropagation();
    sounds.playTick();
    const updated = removeRecentLecture(videoId);
    setRecentLectures(updated);
  };

  const handleNavigate = (view) => {
    sounds.playTick();
    setActiveView(view);
    if (view === 'home') {
      updateUrlParams(null);
    }
  };

  // Initialize: load health, demos, recents, check deep links (?v=...&t=...)
  useEffect(() => {
    checkHealth().then(setApiHealth);
    fetchDemos().then(setDemos);
    setRecentLectures(getRecentLectures());

    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('v');
    const tParam = params.get('t');

    if (tParam) {
      setInitialSeekTime(parseFloat(tParam) || 0);
    }

    if (vParam) {
      handleLoadKit(vParam, parseFloat(tParam) || 0);
    }
  }, [handleLoadKit]);

  return (
    <div className="app-root">
      {/* Dynamic Ambient Background Glows */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-primary" />
        <div className="ambient-orb orb-indigo" />
        <div className="ambient-orb orb-amber" />
        <div className="ambient-grid-overlay" />
      </div>

      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        hasActiveKit={Boolean(studyKit)}
        apiHealth={apiHealth}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      <main>
        {/* VIEW 1: HOME LANDING */}
        {activeView === 'home' && !isLoading && (
          <div className="container">
            <section className="hero-section">
              <div className="hero-badge">
                <Sparkles size={14} />
                <span>Zero AI Hallucination &bull; 100% Chunk-Anchored Video Timestamps</span>
              </div>

              <h1 className="hero-title">
                Turn hours of lectures into minutes of <span className="gradient-highlight">focused mastery.</span>
              </h1>

              <p className="hero-subtitle">
                Synthesizes AI summaries, active-recall 3D flashcards, interactive quizzes, and timestamped personal notes — every single bullet point locked to the exact second in the lecture.
              </p>

              <VideoInput
                onSubmitUrl={(url) => handleLoadKit(url)}
                onLoadDemo={handleLoadDemo}
                onOpenPasteModal={() => {
                  setFallbackInitialVid('');
                  setFallbackDetailMsg('');
                  setIsFallbackOpen(true);
                }}
                demos={demos}
                isLoading={isLoading}
              />
            </section>

            {/* Recently Studied Lectures Section */}
            {recentLectures && recentLectures.length > 0 && (
              <section className="recents-section">
                <div className="section-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={18} color="#F59E0B" />
                    <h3 className="section-title">Jump Back Into Your Studies</h3>
                  </div>
                  <span className="section-badge-hint">{recentLectures.length} saved in local storage</span>
                </div>

                <div className="recents-grid">
                  {recentLectures.map((item) => (
                    <div
                      key={item.video_id}
                      className="recent-lecture-card"
                      onClick={() => handleLoadKit(item.video_id)}
                      title={`Open ${item.title}`}
                    >
                      <div className="recent-card-top">
                        <span className="recent-tag">Lecture</span>
                        <button
                          type="button"
                          className="recent-delete-btn"
                          onClick={(e) => handleRemoveRecent(e, item.video_id)}
                          title="Remove from recents"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <h4 className="recent-title">{item.title}</h4>

                      <div className="recent-meta-row">
                        <span>{item.sectionsCount} chapters</span>
                        <span>&bull;</span>
                        <span>{item.cardsCount} cards</span>
                        <span>&bull;</span>
                        <span>{item.quizCount} quiz Qs</span>
                      </div>

                      <div className="recent-card-action">
                        <span>Resume Study</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Feature Highlights Grid */}
            <section className="feature-preview-grid">
              <div className="feature-card">
                <div className="feature-card-icon emerald-glow">
                  <ShieldCheck size={22} color="#10B981" />
                </div>
                <h3 className="feature-card-title">Zero Timestamp Hallucination</h3>
                <p className="feature-card-desc">
                  Transcripts are split into 50-second overlapping chunks tagged with explicit <code>[t=seconds]</code> anchors. Every AI output is mathematically snapped to verified real moments.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon cyan-glow">
                  <Zap size={22} color="#06B6D4" />
                </div>
                <h3 className="feature-card-title">Bi-Directional Video Sync</h3>
                <p className="feature-card-desc">
                  Play the lecture and watch your study notes highlight and scroll in real time with binary search precision. Click any takeaway to jump the embedded YouTube player directly.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-card-icon purple-glow">
                  <Layers size={22} color="#8B5CF6" />
                </div>
                <h3 className="feature-card-title">Active Recall & Quizzing</h3>
                <p className="feature-card-desc">
                  Flip through interactive 3D flashcards with mastery tracking and Text-to-Speech audio, plus speedrun quizzes backed by immediate "Watch video proof" anchors.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* LOADING ANIMATED PIPELINE */}
        {isLoading && (
          <div className="container">
            <ProcessingScreen />
          </div>
        )}

        {/* VIEW 2: STUDY WORKSPACE */}
        {activeView === 'study' && !isLoading && studyKit && (
          <StudyKit
            studyKit={studyKit}
            initialTime={initialSeekTime}
            onBackToHome={() => handleNavigate('home')}
          />
        )}

        {/* VIEW 3: DEMOS DIRECTORY */}
        {activeView === 'demo' && !isLoading && (
          <div className="container" style={{ padding: '40px 24px', maxWidth: 880, margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.2rem', marginBottom: 12 }}>Pre-Cached Demo Lectures</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1rem' }}>
              Explore fully pre-computed, timestamp-verified study kits designed to work immediately without any API key or external network quotas.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {demos.map((d) => (
                <div key={d.id} className="feature-card demo-card-full">
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="badge-easy">{d.level}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.duration_label}</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>{d.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {d.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleLoadDemo(d.id)}
                    style={{ padding: '12px 20px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                  >
                    <PlayCircle size={16} />
                    <span>Launch Kit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: ARCHITECTURE & ABOUT */}
        {activeView === 'about' && !isLoading && (
          <div className="container" style={{ padding: '40px 24px', maxWidth: 860, margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.2rem', marginBottom: 16 }}>About LECTRA</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 28 }}>
              LECTRA transforms long, unstructured video transcripts into searchable summaries, active-recall flashcards, and quizzes while preserving mathematical links to the original video timestamps.
            </p>

            <div className="architecture-panel">
              <h3 style={{ fontSize: '1.15rem', marginBottom: 20, color: 'var(--primary)' }}>
                Guaranteed Timestamp Anchoring Architecture
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="step-row">
                  <span className="badge-easy">Step 1</span>
                  <span>Extract raw transcripts with millisecond offsets from YouTube or uploaded files.</span>
                </div>
                <div className="step-row">
                  <span className="badge-easy">Step 2</span>
                  <span>Segment into 50-second overlapping windows tagged with explicit <code>[t=seconds]</code> anchors.</span>
                </div>
                <div className="step-row">
                  <span className="badge-easy">Step 3</span>
                  <span>Gemini 2.5 Flash synthesizes structured kits restricted strictly to the provided timestamp tags.</span>
                </div>
                <div className="step-row">
                  <span className="badge-easy">Step 4</span>
                  <span>Backend validation snaps every AI timestamp to the nearest real chunk start: 100% verified.</span>
                </div>
                <div className="step-row">
                  <span className="badge-easy">Step 5</span>
                  <span>YouTube IFrame API synchronizes playback at 250ms polling intervals with binary search focus.</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleNavigate('home')}
              >
                <span>Start Learning with LECTRA</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      <TranscriptFallback
        isOpen={isFallbackOpen}
        onClose={() => setIsFallbackOpen(false)}
        onSubmitTranscript={handleManualTranscriptSubmit}
        onLoadDemo={handleLoadDemo}
        initialVideoId={fallbackInitialVid}
        errorMessage={fallbackDetailMsg}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        studyKit={studyKit}
      />

      <ErrorBanner
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />
    </div>
  );
}
