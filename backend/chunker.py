from typing import List, Dict, Tuple

def chunk_transcript(
    snippets: List[Dict],
    window_sec: float = 50.0,
    overlap_sec: float = 10.0
) -> Tuple[List[Dict], List[int]]:
    """
    Chunks transcript snippets into overlapping windows.
    Default: 50-second window, 10-second overlap (step = 40s).
    Every chunk preserves: start_sec, end_sec, text.
    Returns:
      chunks: List of {"start_sec": int, "end_sec": int, "text": str}
      real_timestamps: List of int [t0, t1, t2, ...] representing valid start_sec values.
    """
    if not snippets:
        return [], []

    step_sec = max(10.0, window_sec - overlap_sec)
    total_duration = max(snippet["start"] + snippet.get("dur", 0.0) for snippet in snippets)
    total_duration = max(total_duration, snippets[-1]["start"] + 5.0)

    chunks = []
    real_timestamps = []

    curr_start = 0.0
    while curr_start <= total_duration:
        curr_end = curr_start + window_sec
        
        # Collect snippets that intersect this [curr_start, curr_end] window
        window_texts = []
        for s in snippets:
            s_start = s["start"]
            s_end = s_start + s.get("dur", 2.0)
            if s_end > curr_start and s_start < curr_end:
                window_texts.append(s["text"])

        merged_text = " ".join(window_texts).strip()
        if merged_text:
            start_int = int(round(curr_start))
            end_int = int(round(min(curr_end, total_duration)))
            chunks.append({
                "start_sec": start_int,
                "end_sec": end_int,
                "text": merged_text
            })
            if start_int not in real_timestamps:
                real_timestamps.append(start_int)

        curr_start += step_sec

    # Fallback if no chunks were formed
    if not chunks and snippets:
        all_text = " ".join(s["text"] for s in snippets)
        chunks.append({
            "start_sec": 0,
            "end_sec": int(total_duration),
            "text": all_text
        })
        real_timestamps = [0]

    return chunks, real_timestamps


def format_chunks_for_prompt(chunks: List[Dict]) -> str:
    """
    Formats chunks into tagged transcript lines for Gemini.
    Format:
    [t=0] text...
    [t=40] text...
    [t=90] text...
    """
    lines = []
    for c in chunks:
        lines.append(f"[t={c['start_sec']}] {c['text']}")
    return "\n\n".join(lines)
