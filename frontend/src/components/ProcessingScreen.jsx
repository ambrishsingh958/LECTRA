import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 1, label: 'Video validated' },
  { id: 2, label: 'Transcript retrieved' },
  { id: 3, label: 'Transcript chunked (50s windows)' },
  { id: 4, label: 'Generating study kit (Gemini)' },
  { id: 5, label: 'Validating & snapping timestamps' },
  { id: 6, label: 'Finalizing study kit' }
];

const ROTATING_MESSAGES = [
  'Reading lecture transcript...',
  'Finding important concepts...',
  'Creating your comprehensive summary...',
  'Generating active-recall flashcards...',
  'Formulating quiz questions & explanations...',
  'Validating timestamp accuracy against real chunks...',
  'Preparing your study kit...'
];

export default function ProcessingScreen({ currentStep = 3 }) {
  const [activeStage, setActiveStage] = useState(1);
  const [messageIndex, setMessageIndex] = useState(0);

  // Progressive simulation for smooth visual feedback
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setActiveStage((prev) => (prev < 5 ? prev + 1 : prev));
    }, 1400);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 1800);

    return () => {
      clearInterval(stageInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="processing-container">
      <h2 className="processing-title">Synthesizing Lecture Kit</h2>
      <p className="processing-subtitle">{ROTATING_MESSAGES[messageIndex]}</p>

      <div className="pipeline-steps">
        {PIPELINE_STAGES.map((stage) => {
          const isDone = stage.id < activeStage;
          const isActive = stage.id === activeStage;
          const isWaiting = stage.id > activeStage;

          return (
            <div
              key={stage.id}
              className={`pipeline-step ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''} ${isWaiting ? 'waiting' : ''}`}
            >
              <div
                className={`step-indicator ${isDone ? 'done' : isActive ? 'spinning' : 'waiting'}`}
              >
                {isDone ? (
                  <Check size={14} strokeWidth={3} />
                ) : isActive ? null : (
                  <span>{stage.id}</span>
                )}
              </div>
              <span className="pipeline-step-text">{stage.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        Anchoring all study artifacts to verified lecture timeline...
      </div>
    </div>
  );
}
