/**
 * Parses and returns the 11-character YouTube video ID.
 * Supports:
 * - watch?v=XXXXXXXXXXX
 * - youtu.be/XXXXXXXXXXX
 * - youtube.com/shorts/XXXXXXXXXXX
 * - youtube.com/embed/XXXXXXXXXXX
 * - youtube.com/live/XXXXXXXXXXX
 * - raw 11-char ID
 */
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function parseVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim();

  // Raw 11-char ID
  if (VIDEO_ID_REGEX.test(clean)) {
    return clean;
  }

  // Common patterns
  const patterns = [
    /(?:v=|\/v\/|embed\/|shorts\/|youtu\.be\/|\/e\/|watch\?v=|\&v=)([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && VIDEO_ID_REGEX.test(match[1])) {
      return match[1];
    }
  }

  return null;
}
