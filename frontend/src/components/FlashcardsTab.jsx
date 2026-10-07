import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Volume2,
  Maximize2,
  Minimize2,
  LayoutGrid,
  CreditCard,
  Filter
} from 'lucide-react';
import { getDifficultyBadge } from '../lib/utils';
import { sounds } from '../lib/audio';
import TimestampChip from './TimestampChip';

export default function FlashcardsTab({
  flashcards = [],
  onSeek
}) {
  const [cards, setCards] = useState(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState(new Set());
  const [reviewAgainIds, setReviewAgainIds] = useState(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState('all'); // all | easy | medium | hard
  const [statusFilter, setStatusFilter] = useState('all'); // all | known | review
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'grid'
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync cards when prop changes
  useEffect(() => {
    setCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  // Filtered cards calculation
  const filteredCards = useMemo(() => {
    return cards.filter((c, idx) => {
      const id = c.id || `card-${idx}`;
      if (difficultyFilter !== 'all' && (c.difficulty || 'medium').toLowerCase() !== difficultyFilter) {
        return false;
      }
      if (statusFilter === 'known' && !knownIds.has(id)) return false;
      if (statusFilter === 'review' && !reviewAgainIds.has(id)) return false;
      return true;
    });
  }, [cards, difficultyFilter, statusFilter, knownIds, reviewAgainIds]);

  const total = filteredCards.length;
  const currentCard = filteredCards[currentIndex] || filteredCards[0];
  const progressPercent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const handleNext = useCallback(() => {
    sounds.playTick();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < total ? prev + 1 : 0));
  }, [total]);

  const handlePrev = useCallback(() => {
    sounds.playTick();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, total - 1)));
  }, [total]);

  const handleFlip = () => {
    sounds.playTick();
    setIsFlipped(!isFlipped);
  };

  const markKnown = () => {
    sounds.playChime();
    if (!currentCard) return;
    const cardId = currentCard.id || `card-${currentIndex}`;
    setKnownIds((prev) => new Set([...prev, cardId]));
    setReviewAgainIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    handleNext();
  };

  const markReviewAgain = () => {
    sounds.playWrong();
    if (!currentCard) return;
    const cardId = currentCard.id || `card-${currentIndex}`;
    setReviewAgainIds((prev) => new Set([...prev, cardId]));
    setKnownIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    handleNext();
  };

  const handleShuffle = () => {
    sounds.playTick();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    sounds.playTick();
    setKnownIds(new Set());
    setReviewAgainIds(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Text-to-Speech
  const handleSpeak = (text) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech if card changes
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIndex, isFlipped]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFocusMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!cards || cards.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No flashcards generated.</div>;
  }

  const currentCardId = currentCard ? (currentCard.id || `card-${currentIndex}`) : '';
  const isCurrentKnown = knownIds.has(currentCardId);
  const isCurrentReview = reviewAgainIds.has(currentCardId);
  const diffBadge = currentCard ? getDifficultyBadge(currentCard.difficulty) : { label: 'Medium', className: 'badge-medium' };

  return (
    <div className={`flashcards-tab-content ${isFocusMode ? 'focus-mode-active' : ''}`}>
      {/* Top Controls Toolbar */}
      <div className="flashcards-toolbar">
        {/* Filter Pills */}
        <div className="filter-group">
          <div className="filter-label">
            <Filter size={13} />
            <span>Difficulty:</span>
          </div>
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              type="button"
              className={`filter-chip ${difficultyFilter === d ? 'active' : ''}`}
              onClick={() => {
                sounds.playTick();
                setDifficultyFilter(d);
                setCurrentIndex(0);
              }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* View Mode & Actions */}
        <div className="toolbar-actions">
          <button
            type="button"
            className={`tool-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="Card Flip Mode"
          >
            <CreditCard size={15} />
            <span>Card</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="All Cards Grid Overview"
          >
            <LayoutGrid size={15} />
            <span>Grid ({total})</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={handleShuffle}
            title="Shuffle deck"
          >
            <Shuffle size={15} />
            <span>Shuffle</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? "Exit Focus Mode (F)" : "Enter Full Focus Mode (F)"}
          >
            {isFocusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFocusMode ? 'Exit Focus' : 'Focus'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Mastery Bar */}
      <div className="mastery-summary-bar">
        <div className="mastery-counters">
          <span className="counter-item mastered">
            <CheckCircle size={14} />
            <span>{knownIds.size} Mastered</span>
          </span>
          <span className="counter-item review">
            <AlertCircle size={14} />
            <span>{reviewAgainIds.size} Needs Review</span>
          </span>
          <span className="counter-item remaining">
            <span>{cards.length - knownIds.size} Remaining</span>
          </span>
        </div>

        <button
          type="button"
          className="reset-progress-btn"
          onClick={handleReset}
          title="Reset mastery status"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* VIEW MODE 1: 3D CARD MODE */}
      {viewMode === 'card' && (
        <>
          {total === 0 ? (
            <div className="empty-filter-state">
              <p>No flashcards match the selected filter.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDifficultyFilter('all')}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="card-stage">
              {/* Progress Track */}
              <div className="card-progress-track">
                <div
                  className="card-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="card-index-indicator">
                Card {currentIndex + 1} of {total} ({progressPercent}%)
              </div>

              {/* 3D Flip Card Container */}
              <div
                className={`flashcard-scene ${isFlipped ? 'flipped' : ''}`}
                onClick={handleFlip}
              >
                <div className="flashcard-inner">
                  {/* FRONT */}
                  <div className="flashcard-face flashcard-front">
                    <div className="card-face-header">
                      <div className="card-meta-left">
                        <span className={`badge ${diffBadge.className}`}>
                          {diffBadge.label}
                        </span>
                        {isCurrentKnown && (
                          <span className="mastery-pill mastered">Mastered</span>
                        )}
                        {isCurrentReview && (
                          <span className="mastery-pill review">Review</span>
                        )}
                      </div>

                      <div className="card-meta-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`audio-btn ${isSpeaking ? 'active' : ''}`}
                          onClick={() => handleSpeak(currentCard.front)}
                          title="Read question aloud (TTS)"
                        >
                          <Volume2 size={16} />
                        </button>
                        <TimestampChip
                          seconds={currentCard.timestamp_sec}
                          onClick={onSeek}
                        />
                      </div>
                    </div>

                    <div className="card-face-body">
                      <p className="card-question-text">{currentCard.front}</p>
                    </div>

                    <div className="card-face-footer">
                      <span className="flip-instruction">
                        Click card or press <strong>Space</strong> to reveal answer
                      </span>
                      {currentCard.tags && currentCard.tags.length > 0 && (
                        <div className="card-tags">
                          {currentCard.tags.map((t) => (
                            <span key={t} className="card-tag">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="flashcard-face flashcard-back">
                    <div className="card-face-header">
                      <span className="answer-badge">Answer & Explanation</span>
                      <div className="card-meta-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`audio-btn ${isSpeaking ? 'active' : ''}`}
                          onClick={() => handleSpeak(currentCard.back)}
                          title="Read answer aloud (TTS)"
                        >
                          <Volume2 size={16} />
                        </button>
                        <TimestampChip
                          seconds={currentCard.timestamp_sec}
                          onClick={onSeek}
                        />
                      </div>
                    </div>

                    <div className="card-face-body">
                      <p className="card-answer-text">{currentCard.back}</p>
                    </div>

                    <div className="card-face-footer">
                      <span className="flip-instruction">
                        Click to flip back to question
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation & Mastery Controls */}
              <div className="card-controls-panel">
                <button
                  type="button"
                  className="nav-arrow-btn"
                  onClick={handlePrev}
                  title="Previous card (←)"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="mastery-action-buttons">
                  <button
                    type="button"
                    className="mastery-btn review-btn"
                    onClick={markReviewAgain}
                  >
                    <AlertCircle size={16} />
                    <span>Need Review</span>
                  </button>

                  <button
                    type="button"
                    className="mastery-btn mastered-btn"
                    onClick={markKnown}
                  >
                    <CheckCircle size={16} />
                    <span>Got It! (Mastered)</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="nav-arrow-btn"
                  onClick={handleNext}
                  title="Next card (→)"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: GRID OVERVIEW */}
      {viewMode === 'grid' && (
        <div className="flashcards-grid">
          {filteredCards.map((card, idx) => {
            const id = card.id || `card-${idx}`;
            const isKnown = knownIds.has(id);
            const isRev = reviewAgainIds.has(id);
            const badge = getDifficultyBadge(card.difficulty);

            return (
              <div key={id} className="grid-card-item">
                <div className="grid-card-header">
                  <span className={`badge ${badge.className}`}>{badge.label}</span>
                  <TimestampChip seconds={card.timestamp_sec} onClick={onSeek} />
                </div>
                <h4 className="grid-card-question">{card.front}</h4>
                <div className="grid-card-answer">
                  <strong>Answer:</strong> {card.back}
                </div>
                <div className="grid-card-footer">
                  {isKnown && <span className="mastery-pill mastered">Mastered</span>}
                  {isRev && <span className="mastery-pill review">Needs Review</span>}
                  <button
                    type="button"
                    className="audio-btn"
                    onClick={() => handleSpeak(`${card.front}. Answer: ${card.back}`)}
                    title="Read card"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
