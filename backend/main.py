import os
import json
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from transcript import (
    parse_video_id,
    fetch_youtube_transcript,
    parse_srt,
    parse_vtt,
    parse_pasted_text
)
from chunker import chunk_transcript, format_chunks_for_prompt
from llm import generate_study_kit

load_dotenv()

CACHE_DIR = os.path.join(os.path.dirname(__file__), "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

app = FastAPI(
    title="LECTRA API",
    description="Intelligent timestamp-anchored lecture study kit generator",
    version="1.0.0"
)

# CORS configuration
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
origins = [
    frontend_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class KitRequest(BaseModel):
    url: Optional[str] = None
    video_id: Optional[str] = None

class TranscriptSubmission(BaseModel):
    video_id: Optional[str] = "custom-lecture"
    title: Optional[str] = "Pasted Lecture Notes"
    text: str
    format: Optional[str] = "raw"  # raw | srt | vtt

def get_cached_kit(video_id: str) -> Optional[Dict[str, Any]]:
    clean_id = video_id.strip()
    # Try exact match
    target_path = os.path.join(CACHE_DIR, f"{clean_id}.json")
    if os.path.exists(target_path):
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["cached"] = True
                return data
        except Exception:
            pass

    # Check aliases
    alias_map = {
        "demo-1": "demo-lecture-1.json",
        "demo-2": "demo-lecture-2.json",
        "demo-3": "demo-lecture-3.json",
        "demo-lecture-1": "demo-lecture-1.json",
        "demo-lecture-2": "demo-lecture-2.json",
        "demo-lecture-3": "demo-lecture-3.json",
    }
    if clean_id in alias_map:
        alias_path = os.path.join(CACHE_DIR, alias_map[clean_id])
        if os.path.exists(alias_path):
            with open(alias_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["cached"] = True
                return data

    return None

def save_kit_to_cache(video_id: str, kit: Dict[str, Any]):
    target_path = os.path.join(CACHE_DIR, f"{video_id}.json")
    try:
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(kit, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to cache study kit for {video_id}: {e}")

@app.get("/api/health")
def health_check():
    api_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "ok",
        "app": "LECTRA",
        "gemini_configured": bool(api_key and len(api_key.strip()) > 5)
    }

@app.get("/api/demos")
def get_demos():
    return [
        {
            "id": "g78utcLQrJ4",
            "alias": "demo-lecture-1",
            "title": "Photosynthesis: Light & Dark Reactions",
            "duration_label": "~7 mins",
            "level": "Short / Biology",
            "description": "Explores chloroplast anatomy, chlorophyll light absorption, photolysis, ATP synthase, and the Calvin cycle."
        },
        {
            "id": "wjZofJX0v4U",
            "alias": "demo-lecture-2",
            "title": "Neural Networks: Deep Learning Fundamentals",
            "duration_label": "~19 mins",
            "level": "Medium / AI & ML",
            "description": "3Blue1Brown's visual exploration of activations, weights, biases, matrix operations, and MNIST digit classification."
        },
        {
            "id": "zjkBMFhNj_g",
            "alias": "demo-lecture-3",
            "title": "MIT 6.006: Algorithmic Thinking & Peak Finding",
            "duration_label": "~51 mins",
            "level": "Long / Computer Science",
            "description": "MIT lecture on 1D vs 2D peak finding, asymptotic analysis, divide-and-conquer recurrence relations, and correctness proofs."
        }
    ]

@app.get("/api/kit/{video_id}")
def get_kit_by_id(video_id: str):
    cached = get_cached_kit(video_id)
    if cached:
        return cached
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No cached study kit found for video ID '{video_id}'."
    )

@app.post("/api/kit")
def create_or_get_kit(payload: KitRequest):
    input_str = payload.url or payload.video_id
    if not input_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a YouTube URL or video ID."
        )

    # 1. Parse video ID
    vid = parse_video_id(input_str)
    if not vid:
        # Check if alias was provided
        if input_str.strip() in ["demo-1", "demo-2", "demo-3", "demo-lecture-1", "demo-lecture-2", "demo-lecture-3"]:
            cached = get_cached_kit(input_str.strip())
            if cached:
                return cached
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid YouTube video URL or video ID."
        )

    # 2. Level 0 Cache Hit
    cached = get_cached_kit(vid)
    if cached:
        return cached

    # 3. Fetch YouTube transcript
    snippets, err = fetch_youtube_transcript(vid)
    if err or not snippets:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Live transcript unavailable",
                "error": err or "No subtitles found for this lecture.",
                "video_id": vid,
                "can_fallback": True
            }
        )

    # 4. Transcript Chunking (50s window, 10s overlap)
    chunks, real_timestamps = chunk_transcript(snippets, window_sec=50.0, overlap_sec=10.0)
    formatted_chunks = format_chunks_for_prompt(chunks)
    max_duration = max(snippet["start"] + snippet.get("dur", 0.0) for snippet in snippets)

    # 5. Gemini Generation + Timestamp Snapping
    title = f"Lecture {vid}"
    success, study_kit, gen_err = generate_study_kit(
        video_id=vid,
        title=title,
        formatted_chunks=formatted_chunks,
        real_timestamps=real_timestamps,
        max_duration=max_duration
    )

    if not success or not study_kit:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=gen_err or "Failed to synthesize study kit from transcript."
        )

    study_kit["cached"] = False
    save_kit_to_cache(vid, study_kit)
    return study_kit

@app.post("/api/transcript")
def process_manual_transcript(payload: TranscriptSubmission):
    content = payload.text.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty."
        )

    fmt = (payload.format or "raw").lower()
    if fmt == "srt":
        snippets = parse_srt(content)
    elif fmt == "vtt":
        snippets = parse_vtt(content)
    else:
        snippets = parse_pasted_text(content)

    if not snippets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse any text segments from provided {fmt.upper()} transcript."
        )

    vid = parse_video_id(payload.video_id or "") or f"cust-{uuid.uuid4().hex[:8]}"
    title = payload.title or f"Custom Lecture ({vid})"

    chunks, real_timestamps = chunk_transcript(snippets, window_sec=50.0, overlap_sec=10.0)
    formatted_chunks = format_chunks_for_prompt(chunks)
    max_duration = max(snippet["start"] + snippet.get("dur", 0.0) for snippet in snippets)

    success, study_kit, gen_err = generate_study_kit(
        video_id=vid,
        title=title,
        formatted_chunks=formatted_chunks,
        real_timestamps=real_timestamps,
        max_duration=max_duration
    )

    if not success or not study_kit:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=gen_err or "Failed to process manual transcript into study kit."
        )

    study_kit["cached"] = False
    save_kit_to_cache(vid, study_kit)
    return study_kit
