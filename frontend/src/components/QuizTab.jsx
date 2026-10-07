import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  ChevronRight,
  Sparkles,
  Timer,
  PlayCircle,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDifficultyBadge } from '../lib/utils';
import { sounds } from '../lib/audio';
import TimestampChip from './TimestampChip';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const QUESTION_TIMER_SECONDS = 30;

export default function QuizTab({
  quiz = [],
  onSeek
}) {
  const [questions, setQuestions] = useState(quiz);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIndex]: selectedIndex }
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReviewingWrong, setIsReviewingWrong] = useState(false);
  const [wrongQuestionIndices, setWrongQuestionIndices] = useState([]);
  
  // Timed Mode
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    setQuestions(quiz);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsCompleted(false);
    setIsReviewingWrong(false);
  }, [quiz]);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const currentAnswer = userAnswers[currentIndex];
  const hasAnswered = currentAnswer !== undefined;
  const isCorrect = hasAnswered && currentAnswer === currentQ?.correct_index;

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerEnabled || isCompleted || hasAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(QUESTION_TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time out: mark as unanswered/wrong (-1)
          handleSelectOption(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isTimerEnabled, isCompleted, hasAnswered]);

  if (!questions || questions.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No quiz questions available.</div>;
  }

  const handleSelectOption = (idx) => {
    if (hasAnswered) return;

    if (idx === currentQ.correct_index) {
      sounds.playChime();
    } else {
      sounds.playWrong();
    }

    const updatedAnswers = { ...userAnswers, [currentIndex]: idx };
    setUserAnswers(updatedAnswers);

    // If all questions answered, trigger complete
    if (Object.keys(updatedAnswers).length === total) {
      const wrong = [];
      let score = 0;
      questions.forEach((q, qIdx) => {
        if (updatedAnswers[qIdx] === q.correct_index) {
          score += 1;
        } else {
          wrong.push(qIdx);
        }
      });
      setWrongQuestionIndices(wrong);

      if (score / total >= 0.7) {
        sounds.playFanfare();
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    }
  };

  const handleNext = () => {
    sounds.playTick();
    if (currentIndex + 1 < total) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    sounds.playTick();
    setUserAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsReviewingWrong(false);
    setQuestions(quiz);
  };

  const handleReviewWrong = () => {
    sounds.playTick();
    if (wrongQuestionIndices.length === 0) return;
    const filteredQuestions = wrongQuestionIndices.map((i) => quiz[i]);
    setQuestions(filteredQuestions);
    setUserAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsReviewingWrong(true);
  };

  const diffBadge = getDifficultyBadge(currentQ.difficulty);

  // SUMMARY SCREEN UPON COMPLETION
  if (isCompleted) {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_index) score += 1;
    });
    const percentage = Math.round((score / total) * 100);

    let grade = 'A+';
    let gradeLabel = 'Mastery Achieved!';
    let gradeColor = '#10B981';

    if (percentage < 60) {
      grade = 'Review Needed';
      gradeLabel = 'Rewatch the lecture segments to reinforce key points.';
      gradeColor = '#EF4444';
    } else if (percentage < 80) {
      grade = 'Proficient';
      gradeLabel = 'Solid understanding with a few details to polish.';
      gradeColor = '#F59E0B';
    }

    return (
      <div className="quiz-completion-view">
        <div className="quiz-results-card">
          <div className="trophy-halo">
            <Award size={48} color={gradeColor} />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>{grade}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{gradeLabel}</p>

          <div className="score-stat-box">
            <div className="score-big" style={{ color: gradeColor }}>
              {score} / {total}
            </div>
            <div className="score-percentage-tag">{percentage}% Accuracy</div>
          </div>

          <div className="completion-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleRestart}
            >
              <RotateCcw size={16} />
              <span>Retake Full Quiz</span>
            </button>

            {wrongQuestionIndices.length > 0 && !isReviewingWrong && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReviewWrong}
              >
                <HelpCircle size={16} color="#F59E0B" />
                <span>Retry {wrongQuestionIndices.length} Missed Questions</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="quiz-breakdown-section">
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Detailed Answer Breakdown</h3>
          <div className="breakdown-list">
            {questions.map((q, idx) => {
              const userPick = userAnswers[idx];
              const wasRight = userPick === q.correct_index;
              return (
                <div key={idx} className={`breakdown-item ${wasRight ? 'item-correct' : 'item-wrong'}`}>
                  <div className="breakdown-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {wasRight ? (
                        <CheckCircle2 size={18} color="#10B981" />
                      ) : (
                        <XCircle size={18} color="#EF4444" />
                      )}
                      <strong>Q{idx + 1}: {q.question}</strong>
                    </div>
                    <TimestampChip seconds={q.timestamp_sec} onClick={onSeek} />
                  </div>

                  <div className="breakdown-answers">
                    <div>
                      Your answer:{' '}
                      <span style={{ color: wasRight ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {userPick !== undefined && userPick >= 0 ? `${OPTION_LABELS[userPick]}: ${q.options[userPick]}` : 'Timed out / Skipped'}
                      </span>
                    </div>
                    {!wasRight && (
                      <div>
                        Correct answer:{' '}
                        <span style={{ color: '#10B981', fontWeight: 600 }}>
                          {OPTION_LABELS[q.correct_index]}: {q.options[q.correct_index]}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="breakdown-explanation">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION SCREEN
  return (
    <div className="quiz-tab-content">
      {/* Quiz Header & Tools */}
      <div className="quiz-header-bar">
        <div className="quiz-progress-text">
          <span>Question {currentIndex + 1} of {total}</span>
          <span className={`badge ${diffBadge.className}`}>{diffBadge.label}</span>
        </div>

        <div className="quiz-tools-right">
          {/* Timed Mode Toggle */}
          <button
            type="button"
            className={`tool-btn timer-toggle-btn ${isTimerEnabled ? 'active' : ''}`}
            onClick={() => {
              sounds.playTick();
              setIsTimerEnabled(!isTimerEnabled);
            }}
            title="Toggle 30s challenge timer"
          >
            <Timer size={14} />
            <span>{isTimerEnabled ? `${timeLeft}s` : 'Speedrun'}</span>
          </button>

          {/* Jump to Proof in Video */}
          <button
            type="button"
            className="tool-btn proof-btn"
            onClick={() => onSeek(currentQ.timestamp_sec)}
            title="Watch video timestamp where this question is answered"
          >
            <PlayCircle size={14} color="var(--primary)" />
            <span>Watch Proof</span>
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="quiz-question-card">
        <div className="question-title-row">
          <h3 className="question-text">{currentQ.question}</h3>
          <TimestampChip seconds={currentQ.timestamp_sec} onClick={onSeek} />
        </div>

        {/* Options */}
        <div className="options-grid">
          {currentQ.options.map((opt, optIdx) => {
            let stateClass = '';
            if (hasAnswered) {
              if (optIdx === currentQ.correct_index) {
                stateClass = 'option-correct';
              } else if (optIdx === currentAnswer) {
                stateClass = 'option-wrong';
              } else {
                stateClass = 'option-dimmed';
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                className={`quiz-option-button ${stateClass}`}
                onClick={() => handleSelectOption(optIdx)}
                disabled={hasAnswered}
              >
                <span className="option-label-badge">{OPTION_LABELS[optIdx]}</span>
                <span className="option-text-content">{opt}</span>
                {hasAnswered && optIdx === currentQ.correct_index && (
                  <CheckCircle2 size={18} color="#10B981" className="option-status-icon" />
                )}
                {hasAnswered && optIdx === currentAnswer && optIdx !== currentQ.correct_index && (
                  <XCircle size={18} color="#EF4444" className="option-status-icon" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Button (Revealed after answering) */}
        {hasAnswered && (
          <div className="explanation-box">
            <div className="explanation-header">
              {isCorrect ? (
                <div className="verdict-correct">
                  <CheckCircle2 size={18} />
                  <span>Correct!</span>
                </div>
              ) : (
                <div className="verdict-wrong">
                  <XCircle size={18} />
                  <span>Incorrect</span>
                </div>
              )}

              <TimestampChip
                seconds={currentQ.timestamp_sec}
                onClick={onSeek}
                label="Verify in Video"
              />
            </div>

            <p className="explanation-text">{currentQ.explanation}</p>

            <div className="explanation-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
              >
                <span>{currentIndex + 1 === total ? 'View Quiz Results' : 'Next Question'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
