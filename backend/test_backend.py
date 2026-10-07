import os
import json
from transcript import parse_video_id, parse_srt, parse_vtt, parse_pasted_text
from chunker import chunk_transcript, format_chunks_for_prompt
from validate import snap_timestamp, validate_and_snap_study_kit, SCHEMA
import jsonschema

def test_parse_video_id():
    assert parse_video_id("https://www.youtube.com/watch?v=g78utcLQrJ4") == "g78utcLQrJ4"
    assert parse_video_id("https://youtu.be/wjZofJX0v4U") == "wjZofJX0v4U"
    assert parse_video_id("https://www.youtube.com/shorts/zjkBMFhNj_g") == "zjkBMFhNj_g"
    assert parse_video_id("https://www.youtube.com/embed/g78utcLQrJ4") == "g78utcLQrJ4"
    assert parse_video_id("wjZofJX0v4U") == "wjZofJX0v4U"
    assert parse_video_id("invalid-url-too-long") is None
    assert parse_video_id("https://example.com/not-youtube") is None
    assert parse_video_id("") is None

def test_parse_srt():
    srt_sample = """1
00:00:01,000 --> 00:00:04,500
Photosynthesis begins in the chloroplast.

2
00:00:05,000 --> 00:00:08,200
Chlorophyll absorbs blue and red photons.
"""
    snippets = parse_srt(srt_sample)
    assert len(snippets) == 2
    assert snippets[0]["start"] == 1.0
    assert snippets[0]["text"] == "Photosynthesis begins in the chloroplast."
    assert snippets[1]["start"] == 5.0

def test_parse_vtt():
    vtt_sample = """WEBVTT

00:00:02.000 --> 00:00:05.500
A neuron fires when the weighted sum exceeds bias.
"""
    snippets = parse_vtt(vtt_sample)
    assert len(snippets) == 1
    assert snippets[0]["start"] == 2.0
    assert "neuron" in snippets[0]["text"]

def test_chunker_and_overlap():
    snippets = [
        {"text": f"Sentence at second {i*10}", "start": float(i*10), "dur": 8.0}
        for i in range(20) # 0 to 190s
    ]
    chunks, real_ts = chunk_transcript(snippets, window_sec=50.0, overlap_sec=10.0)
    assert len(chunks) > 0
    assert 0 in real_ts
    assert 40 in real_ts
    # Check that formatted prompt contains tags
    prompt_text = format_chunks_for_prompt(chunks)
    assert "[t=0]" in prompt_text
    assert "[t=40]" in prompt_text

def test_timestamp_snapping():
    real_ts = [0, 40, 90, 140, 190, 240]
    # AI returned 38 -> should snap to 40
    assert snap_timestamp(38, real_ts, 300) == 40
    # AI returned 85 -> should snap to 90
    assert snap_timestamp(85, real_ts, 300) == 90
    # AI returned 12 -> should snap to 0
    assert snap_timestamp(12, real_ts, 300) == 0
    # Clamping test
    assert snap_timestamp(999, real_ts, 240) == 240

def test_demo_cache_files_schema():
    cache_dir = os.path.join(os.path.dirname(__file__), "cache")
    demos = ["demo-lecture-1.json", "demo-lecture-2.json", "demo-lecture-3.json"]
    for demo in demos:
        path = os.path.join(cache_dir, demo)
        assert os.path.exists(path), f"File {path} must exist"
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Check against formal json schema
        jsonschema.validate(instance=data, schema=SCHEMA)
        assert len(data["summary"]["sections"]) >= 3
        assert len(data["flashcards"]) >= 8
        assert len(data["quiz"]) >= 5
        print(f"Verified schema for {demo}: OK")

if __name__ == "__main__":
    test_parse_video_id()
    test_parse_srt()
    test_parse_vtt()
    test_chunker_and_overlap()
    test_timestamp_snapping()
    test_demo_cache_files_schema()
    print("ALL BACKEND TESTS PASSED!")
