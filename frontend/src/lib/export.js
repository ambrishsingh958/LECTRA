import { formatTime } from './utils';

/**
 * Generates formatted Markdown study kit document with embedded YouTube timestamp links.
 */
export function generateMarkdownKit(studyKit) {
  if (!studyKit) return '';

  const { title, video_id, summary, flashcards, quiz } = studyKit;
  const ytBase = video_id ? `https://www.youtube.com/watch?v=${video_id}` : null;

  const makeYtLink = (seconds, label) => {
    if (!ytBase || seconds === null || seconds === undefined) return `[${label}]`;
    const sec = Math.floor(seconds);
    return `[${label}](${ytBase}&t=${sec}s)`;
  };

  let md = `# 📖 Study Kit: ${title || 'Lecture'}\n\n`;
  if (video_id) {
    md += `> **Source Video**: [Watch on YouTube](https://www.youtube.com/watch?v=${video_id})\n`;
  }
  md += `> Generated with **LECTRA** — 100% Guaranteed Timestamp-Anchored Study Notes\n\n`;
  md += `---\n\n`;

  // 1. TLDR
  if (summary?.tldr) {
    md += `## 💡 Executive TL;DR\n\n`;
    md += `${summary.tldr}\n\n`;
    md += `---\n\n`;
  }

  // 2. Breakdown
  if (summary?.sections && summary.sections.length > 0) {
    md += `## 📚 Lecture Breakdown & Timestamps\n\n`;
    summary.sections.forEach((sec, sIdx) => {
      const timeStr = `${formatTime(sec.start_sec)} - ${formatTime(sec.end_sec)}`;
      const timeLink = makeYtLink(sec.start_sec, timeStr);
      md += `### ${sIdx + 1}. ${sec.title} (${timeLink})\n\n`;
      md += `${sec.summary}\n\n`;

      if (sec.key_points && sec.key_points.length > 0) {
        md += `**Key Points:**\n`;
        sec.key_points.forEach((kp) => {
          const kpLink = makeYtLink(kp.timestamp_sec, formatTime(kp.timestamp_sec));
          md += `- **${kpLink}**: ${kp.text}\n`;
        });
        md += `\n`;
      }
    });
    md += `---\n\n`;
  }

  // 3. Flashcards
  if (flashcards && flashcards.length > 0) {
    md += `## 🃏 Active-Recall Flashcards (${flashcards.length})\n\n`;
    flashcards.forEach((fc, idx) => {
      const fcLink = makeYtLink(fc.timestamp_sec, `Timestamp: ${formatTime(fc.timestamp_sec)}`);
      md += `#### Card ${idx + 1} [${fc.difficulty || 'medium'}] (${fcLink})\n`;
      md += `**Q:** ${fc.front}\n\n`;
      md += `**A:** ${fc.back}\n\n`;
      if (fc.tags && fc.tags.length > 0) {
        md += `*Tags:* \`${fc.tags.join('`, `')}\`\n\n`;
      }
    });
    md += `---\n\n`;
  }

  // 4. Quiz
  if (quiz && quiz.length > 0) {
    md += `## 📝 Practice Quiz (${quiz.length} Questions)\n\n`;
    quiz.forEach((q, idx) => {
      const qLink = makeYtLink(q.timestamp_sec, `Video Proof: ${formatTime(q.timestamp_sec)}`);
      md += `### Question ${idx + 1} (${qLink})\n`;
      md += `${q.question}\n\n`;
      const labels = ['A', 'B', 'C', 'D'];
      q.options.forEach((opt, oIdx) => {
        const isCorrect = oIdx === q.correct_index;
        md += `- **${labels[oIdx]}**: ${opt} ${isCorrect ? '✅ *(Correct Answer)*' : ''}\n`;
      });
      md += `\n**Explanation:** ${q.explanation}\n\n`;
    });
  }

  return md;
}

/**
 * Generates Anki-compatible TSV (Tab-Separated Values).
 * Format: Front \t Back \t Tags
 */
export function generateAnkiTSV(studyKit) {
  if (!studyKit?.flashcards) return '';
  const lines = [];

  studyKit.flashcards.forEach((fc) => {
    const front = (fc.front || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    let back = (fc.back || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    if (fc.timestamp_sec !== undefined && studyKit.video_id) {
      const timeStr = formatTime(fc.timestamp_sec);
      const url = `https://www.youtube.com/watch?v=${studyKit.video_id}&t=${Math.floor(fc.timestamp_sec)}s`;
      back += `<br><br><small><a href="${url}">▶ Watch timestamp (${timeStr})</a></small>`;
    }
    const tags = ['LECTRA', fc.difficulty || 'medium', ...(fc.tags || [])].join(' ');
    lines.push(`${front}\t${back}\t${tags}`);
  });

  return lines.join('\n');
}

/**
 * Triggers a browser file download from string content.
 */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
