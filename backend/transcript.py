import re
from typing import List, Dict, Optional, Tuple
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

VIDEO_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{11}$")

def parse_video_id(url_or_id: str) -> Optional[str]:
    """
    Extracts the 11-character YouTube video ID from various URL formats or raw ID.
    Supports:
    - watch?v=XXXXXXXXXXX
    - youtu.be/XXXXXXXXXXX
    - youtube.com/shorts/XXXXXXXXXXX
    - youtube.com/embed/XXXXXXXXXXX
    - raw 11-char ID
    """
    if not url_or_id:
        return None
    
    clean_input = url_or_id.strip()

    # Raw 11-char ID
    if VIDEO_ID_REGEX.match(clean_input):
        return clean_input

    # Patterns
    patterns = [
        r"(?:v=|\/v\/|embed\/|shorts\/|youtu\.be\/|\/e\/|watch\?v=|\&v=)([a-zA-Z0-9_-]{11})",
        r"(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})"
    ]

    for pattern in patterns:
        match = re.search(pattern, clean_input)
        if match:
            candidate = match.group(1)
            if VIDEO_ID_REGEX.match(candidate):
                return candidate

    return None


def fetch_youtube_transcript(video_id: str) -> Tuple[List[Dict], Optional[str]]:
    """
    Fetches transcript using youtube-transcript-api.
    Tries languages: en, en-US, en-GB, hi, and falls back to any available transcript.
    Returns: (snippets, error_message)
    Each snippet: {"text": str, "start": float, "dur": float}
    """
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Priority order
        target_languages = ['en', 'en-US', 'en-GB', 'hi']
        chosen_transcript = None

        # 1. Look for manually created transcripts
        for lang in target_languages:
            try:
                chosen_transcript = transcript_list.find_manually_created_transcript([lang])
                if chosen_transcript:
                    break
            except Exception:
                pass

        # 2. Look for generated transcripts
        if not chosen_transcript:
            for lang in target_languages:
                try:
                    chosen_transcript = transcript_list.find_generated_transcript([lang])
                    if chosen_transcript:
                        break
                except Exception:
                    pass

        # 3. Fallback to any transcript available
        if not chosen_transcript:
            for t in transcript_list:
                chosen_transcript = t
                break

        if not chosen_transcript:
            return [], "No transcripts found for this video."

        raw_data = chosen_transcript.fetch()
        normalized = []
        for item in raw_data:
            # Handle new dictionary vs object representations in various versions
            if isinstance(item, dict):
                text = item.get("text", "").strip()
                start = float(item.get("start", 0.0))
                dur = float(item.get("duration", 0.0))
            else:
                text = getattr(item, "text", "").strip()
                start = float(getattr(item, "start", 0.0))
                dur = float(getattr(item, "duration", 0.0))
            if text:
                normalized.append({
                    "text": text,
                    "start": round(start, 2),
                    "dur": round(dur, 2)
                })

        if not normalized:
            return [], "Retrieved transcript was empty."

        return normalized, None

    except (TranscriptsDisabled, NoTranscriptFound) as e:
        return [], f"Subtitles are disabled or not found for video: {str(e)}"
    except VideoUnavailable as e:
        return [], f"Video is unavailable or private: {str(e)}"
    except Exception as e:
        return [], f"Error fetching transcript: {str(e)}"


def parse_timestamp_str_to_sec(ts_str: str) -> float:
    """Parses 'HH:MM:SS,mmm' or 'MM:SS.mmm' or 'SS.mmm' into float seconds."""
    ts_str = ts_str.strip().replace(',', '.')
    parts = ts_str.split(':')
    if len(parts) == 3:
        h, m, s = parts
        return float(h) * 3600 + float(m) * 60 + float(s)
    elif len(parts) == 2:
        m, s = parts
        return float(m) * 60 + float(s)
    elif len(parts) == 1:
        return float(parts[0])
    return 0.0


def parse_srt(srt_text: str) -> List[Dict]:
    """Parses SubRip (.srt) subtitle content into normalized snippets."""
    snippets = []
    # Blocks separated by double newlines
    blocks = re.split(r'\n\s*\n', srt_text.strip())
    
    for block in blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            continue
        # Find line with timestamp arrow -->
        ts_line_idx = -1
        for idx, line in enumerate(lines):
            if '-->' in line:
                ts_line_idx = idx
                break
        
        if ts_line_idx != -1 and ts_line_idx + 1 < len(lines):
            ts_parts = lines[ts_line_idx].split('-->')
            start_sec = parse_timestamp_str_to_sec(ts_parts[0])
            end_sec = parse_timestamp_str_to_sec(ts_parts[1])
            dur = max(0.5, end_sec - start_sec)
            text = " ".join(lines[ts_line_idx + 1:])
            if text:
                snippets.append({
                    "text": text,
                    "start": round(start_sec, 2),
                    "dur": round(dur, 2)
                })
    return snippets


def parse_vtt(vtt_text: str) -> List[Dict]:
    """Parses WebVTT (.vtt) subtitle content into normalized snippets."""
    # VTT is very similar to SRT, strip WEBVTT header
    cleaned = re.sub(r'^WEBVTT.*?\n', '', vtt_text.strip(), flags=re.DOTALL)
    return parse_srt(cleaned)


def parse_pasted_text(raw_text: str) -> List[Dict]:
    """
    Parses pasted text which may contain timestamps like '[01:23] Text' or '1:23 Text',
    or plain sentences without timestamps.
    """
    snippets = []
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    if not lines:
        return []

    # Check if lines have [HH:MM:SS] or [MM:SS] or MM:SS format
    ts_pattern = re.compile(r'^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(.*)$')
    has_timestamps = any(ts_pattern.match(l) for l in lines[:10])

    if has_timestamps:
        current_time = 0.0
        for line in lines:
            m = ts_pattern.match(line)
            if m:
                current_time = parse_timestamp_str_to_sec(m.group(1))
                text = m.group(2).strip()
            else:
                text = line
            if text:
                snippets.append({
                    "text": text,
                    "start": round(current_time, 2),
                    "dur": 4.0
                })
                current_time += 4.0
    else:
        # Segment plain text evenly across an estimated duration (avg 150 words per minute)
        total_words = sum(len(l.split()) for l in lines)
        total_duration = max(60.0, (total_words / 150.0) * 60.0)
        time_per_line = total_duration / max(1, len(lines))
        
        current_time = 0.0
        for line in lines:
            snippets.append({
                "text": line,
                "start": round(current_time, 2),
                "dur": round(time_per_line, 2)
            })
            current_time += time_per_line

    return snippets
