/**
 * Bi-directional synchronization between YouTube video player
 * and study content items (sections, key points).
 */

export class SeekLockManager {
  constructor(lockDurationMs = 600) {
    this.lockDurationMs = lockDurationMs;
    this.lockedUntil = 0;
  }

  lock() {
    this.lockedUntil = Date.now() + this.lockDurationMs;
  }

  isLocked() {
    return Date.now() < this.lockedUntil;
  }
}

/**
 * Binary search to find the last item whose timestamp_sec <= currentTime.
 * @param {Array<{ timestamp_sec: number, id: string }>} sortedItems
 * @param {number} currentTime
 * @returns {any | null}
 */
export function findActiveTimelineItem(sortedItems, currentTime) {
  if (!sortedItems || sortedItems.length === 0) return null;
  if (currentTime < sortedItems[0].timestamp_sec) return sortedItems[0];

  let low = 0;
  let high = sortedItems.length - 1;
  let resultIndex = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedItems[mid].timestamp_sec <= currentTime) {
      resultIndex = mid;
      low = mid + 1; // Try to find a later match
    } else {
      high = mid - 1;
    }
  }

  return sortedItems[resultIndex];
}

/**
 * Smoothly scrolls an element into view within its scroll container
 * if it is not already visible.
 */
export function scrollItemIntoView(elementId, containerElement) {
  if (!elementId) return;
  const target = document.getElementById(elementId);
  if (!target) return;

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
}
