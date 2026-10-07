import React, { useState, useMemo } from 'react';
import { Search, PlayCircle, BookOpen, Layers, HelpCircle } from 'lucide-react';
import TimestampChip from './TimestampChip';

export default function SearchTab({
  studyKit,
  onSeek
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Index all items across summary, flashcards, and quiz
  const indexedItems = useMemo(() => {
    if (!studyKit) return [];
    const items = [];

    // 1. TLDR
    if (studyKit.summary?.tldr) {
      items.push({
        id: 'search-tldr',
        type: 'SUMMARY',
        title: 'Executive TL;DR',
        snippet: studyKit.summary.tldr,
        timestamp_sec: 0
      });
    }

    // 2. Sections & Key Points
    (studyKit.summary?.sections || []).forEach((sec, sIdx) => {
      items.push({
        id: `search-sec-${sIdx}`,
        type: 'SUMMARY',
        title: sec.title,
        snippet: sec.summary,
        timestamp_sec: sec.start_sec
      });

      (sec.key_points || []).forEach((kp, kpIdx) => {
        items.push({
          id: `search-kp-${sIdx}-${kpIdx}`,
          type: 'SUMMARY',
          title: `Key Concept (${sec.title})`,
          snippet: kp.text,
          timestamp_sec: kp.timestamp_sec
        });
      });
    });

    // 3. Flashcards
    (studyKit.flashcards || []).forEach((fc, fcIdx) => {
      items.push({
        id: `search-fc-${fcIdx}`,
        type: 'FLASHCARD',
        title: fc.front,
        snippet: `Answer: ${fc.back}${fc.tags ? ' | Tags: ' + fc.tags.join(', ') : ''}`,
        timestamp_sec: fc.timestamp_sec
      });
    });

    // 4. Quiz Questions
    (studyKit.quiz || []).forEach((q, qIdx) => {
      items.push({
        id: `search-q-${qIdx}`,
        type: 'QUIZ',
        title: q.question,
        snippet: `Explanation: ${q.explanation} (Answer: ${q.options[q.correct_index]})`,
        timestamp_sec: q.timestamp_sec
      });
    });

    return items;
  }, [studyKit]);

  // Instant filtering
  const filteredResults = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return indexedItems.slice(0, 15); // Show top items initially

    return indexedItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSnippet = item.snippet.toLowerCase().includes(q);
      const matchType = item.type.toLowerCase().includes(q);
      return matchTitle || matchSnippet || matchType;
    });
  }, [searchTerm, indexedItems]);

  const getTagColorClass = (type) => {
    switch (type) {
      case 'SUMMARY': return 'summary';
      case 'FLASHCARD': return 'flashcard';
      case 'QUIZ': return 'quiz';
      default: return 'summary';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUMMARY': return <BookOpen size={12} />;
      case 'FLASHCARD': return <Layers size={12} />;
      case 'QUIZ': return <HelpCircle size={12} />;
      default: return <BookOpen size={12} />;
    }
  };

  return (
    <div className="search-container">
      {/* Search Input Box */}
      <div className="search-input-box">
        <Search size={18} className="input-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search concepts, questions, flashcards, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: 12, color: 'var(--text-muted)', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Found {filteredResults.length} timestamped matches</span>
        <span>Click any result to jump video</span>
      </div>

      {/* Results List */}
      <div className="search-results-list">
        {filteredResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No matches found for "{searchTerm}". Try another search term.
          </div>
        ) : (
          filteredResults.map((res) => (
            <div
              key={res.id}
              className="search-result-item"
              onClick={() => onSeek(res.timestamp_sec)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className={`result-tag ${getTagColorClass(res.type)}`}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {getTypeIcon(res.type)}
                    {res.type}
                  </span>
                </span>
                <TimestampChip seconds={res.timestamp_sec} onClick={onSeek} />
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 4 }}>
                {res.title}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {res.snippet}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
