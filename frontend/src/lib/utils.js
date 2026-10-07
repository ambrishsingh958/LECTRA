/**
 * Formats seconds into MM:SS or HH:MM:SS format.
 * Examples:
 * 0 -> 0:00
 * 65 -> 1:05
 * 125 -> 2:05
 * 366 -> 6:06
 * 3666 -> 1:01:06
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '0:00';
  const totalSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const paddedSec = secs < 10 ? `0${secs}` : `${secs}`;

  if (hrs > 0) {
    const paddedMin = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMin}:${paddedSec}`;
  }
  return `${mins}:${paddedSec}`;
}

export function getDifficultyBadge(difficulty) {
  const d = (difficulty || 'medium').toLowerCase();
  switch (d) {
    case 'easy':
      return {
        label: 'Easy',
        className: 'badge-easy'
      };
    case 'hard':
      return {
        label: 'Hard',
        className: 'badge-hard'
      };
    case 'medium':
    default:
      return {
        label: 'Medium',
        className: 'badge-medium'
      };
  }
}

export function fuzzySearch(items, query, getSearchableFields) {
  if (!query || !query.trim()) return items;
  const terms = query.toLowerCase().trim().split(/\s+/);

  return items.filter(item => {
    const fields = getSearchableFields(item);
    const combined = fields.filter(Boolean).join(' ').toLowerCase();
    return terms.every(term => combined.includes(term));
  });
}
