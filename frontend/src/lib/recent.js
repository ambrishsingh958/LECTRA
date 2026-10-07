const RECENT_KEY = 'lectra_recent_lectures';

export function getRecentLectures() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveRecentLecture(studyKit) {
  if (!studyKit || !studyKit.video_id) return;
  try {
    const recents = getRecentLectures();
    const filtered = recents.filter((item) => item.video_id !== studyKit.video_id);

    const newItem = {
      video_id: studyKit.video_id,
      title: studyKit.title || `Lecture ${studyKit.video_id}`,
      sectionsCount: studyKit.summary?.sections?.length || 0,
      cardsCount: studyKit.flashcards?.length || 0,
      quizCount: studyKit.quiz?.length || 0,
      cached: Boolean(studyKit.cached),
      visitedAt: Date.now()
    };

    const updated = [newItem, ...filtered].slice(0, 8); // Keep up to 8
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save recent lecture:', e);
  }
}

export function removeRecentLecture(videoId) {
  try {
    const recents = getRecentLectures();
    const updated = recents.filter((item) => item.video_id !== videoId);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}
