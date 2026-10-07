# ⚡ LECTRA — Lecture Study Kit

> **"Turn long lectures into an intelligent, timestamp-linked study kit."**  
> *Watch less. Understand more.*

---

## 📖 Overview

Long lecture videos are difficult and time-consuming to revise from. Students and professionals waste hours scrubbing back and forth trying to locate where specific concepts or formulas were discussed.

**LECTRA** solves this by converting raw lecture transcripts into a fully searchable, structured study kit containing:
- **Executive Summaries & TL;DR**
- **Logical Lecture Breakdown with Key Takeaways**
- **Active-Recall 3D Interactive Flashcards**
- **Targeted Multiple-Choice Quizzes with Explanations**
- **Full-Text Fuzzy Instant Search**

### 🎯 The Defining Feature: Guaranteed Timestamp Anchoring
**Every single study item is anchored to the exact moment in the lecture from which it was generated.**

Click any summary point, flashcard, or quiz explanation, and the embedded YouTube player instantly jumps to that exact moment. Play the video, and your study notes automatically highlight and scroll in real-time.

---

## 📐 Timestamp Architecture: Zero AI Hallucination

A major pitfall of traditional LLMs is fabricating imaginary timestamps. LECTRA prevents this with a deterministic 7-step pipeline:

```
REAL YOUTUBE / PASTED TRANSCRIPT
        ↓
50-Second Overlapping Windows (10s overlap)
        ↓
Tagged with explicit chunk start tags: [t=0], [t=40], [t=90], [t=140]
        ↓
Gemini 2.5 Flash operates strictly within these tags
        ↓
Backend JSON Schema Validation
        ↓
Snapping Engine clamps and snaps every timestamp to nearest REAL chunk start
        ↓
Validated Study Kit (100% of final timestamps match real moments)
        ↓
YouTube IFrame Player 250ms Polling + 600ms Seek Lock Sync
```

---

## 🏗️ Project Structure

```
LECTRA/
├── backend/
│   ├── main.py                  # FastAPI server, endpoints, CORS, caching
│   ├── transcript.py            # YouTube transcript extractor + SRT/VTT/Text parsers
│   ├── chunker.py               # 50s overlapping window chunker & [t=N] tagger
│   ├── llm.py                   # Gemini 2.5 Flash client with schema prompt & retries
│   ├── validate.py              # jsonschema validator & nearest-chunk snap engine
│   ├── schema.json              # Formal JSON Schema for StudyKit validation
│   ├── test_backend.py          # Backend test suite (parsers, snapping, schema)
│   ├── cache/                   # File-based cache & pre-seeded demo lectures
│   │   ├── demo-lecture-1.json  # Short (~7 min) - Photosynthesis (Amoeba Sisters)
│   │   ├── demo-lecture-2.json  # Medium (~19 min) - Neural Networks (3Blue1Brown)
│   │   ├── demo-lecture-3.json  # Long (~51 min) - MIT 6.006 Peak Finding
│   │   ├── g78utcLQrJ4.json     # Indexed by YouTube ID
│   │   ├── wjZofJX0v4U.json     # Indexed by YouTube ID
│   │   └── zjkBMFhNj_g.json     # Indexed by YouTube ID
│   ├── requirements.txt         # fastapi, uvicorn, youtube-transcript-api, google-genai
│   ├── Procfile                 # Deployment process command
│   └── .env.example             # GEMINI_API_KEY, FRONTEND_ORIGIN
│
├── frontend/
│   ├── index.html               # Clean HTML5 metadata & title
│   ├── vite.config.js           # Vite configuration with API proxy
│   ├── vercel.json              # Vercel SPA routing rewrites
│   ├── package.json             # React 18, Lucide React, Canvas Confetti
│   ├── src/
│   │   ├── main.jsx             # React entrypoint
│   │   ├── App.jsx              # Main app controller & routing views
│   │   ├── index.css            # Dark-first SaaS design system
│   │   ├── components/
│   │   │   ├── Header.jsx       # Glassmorphic header & navigation
│   │   │   ├── VideoInput.jsx   # URL input bar, validation, demo quick-picks
│   │   │   ├── VideoPlayer.jsx  # YouTube IFrame API wrapper with 250ms polling
│   │   │   ├── ProcessingScreen.jsx # Animated 6-step progress pipeline
│   │   │   ├── StudyKit.jsx     # Two-column sticky study workspace
│   │   │   ├── SummaryTab.jsx   # TL;DR, sections, and synced key points
│   │   │   ├── FlashcardsTab.jsx# 3D interactive flip cards with mastery tracking
│   │   │   ├── QuizTab.jsx      # Assessment with instant feedback & explanations
│   │   │   ├── SearchTab.jsx    # Instant fuzzy search across all study assets
│   │   │   ├── TimestampChip.jsx# Sleek clickable timestamp trigger
│   │   │   ├── TranscriptFallback.jsx # Paste transcript / SRT / VTT modal dialog
│   │   │   └── ErrorBanner.jsx  # Toast notifications
│   │   ├── lib/
│   │   │   ├── api.js           # Fetch client with localStorage fallback
│   │   │   ├── sync.js          # Binary search timeline sync & 600ms seek lock
│   │   │   ├── youtube.js       # Robust 11-char YouTube video ID parser
│   │   │   └── utils.js         # Time formatters & search utilities
│   └── .env.example
│
├── render.yaml                  # Render deployment configuration
├── test_integration.mjs         # End-to-end integration test script
└── README.md                    # Documentation
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
# On macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (optional for demo mode, required for live AI generation)
cp .env.example .env
# Add your GEMINI_API_KEY inside .env

# Run FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000
```
Backend will be live at `http://127.0.0.1:8000`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` (or the port indicated by Vite) in your browser.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck & Gemini API key configuration status |
| `GET` | `/api/demos` | List available pre-cached demonstration lectures |
| `GET` | `/api/kit/{video_id}` | Retrieve cached StudyKit for a video ID |
| `POST` | `/api/kit` | Generate or retrieve StudyKit from YouTube URL or ID |
| `POST` | `/api/transcript` | Generate StudyKit from pasted text, `.srt`, or `.vtt` file |

### Request: `POST /api/kit`
```json
{
  "url": "https://www.youtube.com/watch?v=g78utcLQrJ4"
}
```

### Response: `StudyKit` Schema
```json
{
  "video_id": "g78utcLQrJ4",
  "title": "Photosynthesis and the Teeny Tiny Pigment Pancakes",
  "cached": true,
  "summary": {
    "tldr": "Photosynthesis is the fundamental biochemical process...",
    "sections": [
      {
        "id": "sec-1",
        "title": "1. What is Photosynthesis & Why It Matters",
        "start_sec": 0,
        "end_sec": 80,
        "summary": "...",
        "key_points": [
          {
            "text": "Autotrophs make their own food using light.",
            "timestamp_sec": 0
          }
        ]
      }
    ]
  },
  "flashcards": [
    {
      "id": "fc-1",
      "front": "What is the primary organelle responsible for photosynthesis?",
      "back": "The chloroplast...",
      "timestamp_sec": 90,
      "difficulty": "easy",
      "tags": ["anatomy", "organelles"]
    }
  ],
  "quiz": [
    {
      "id": "qz-1",
      "question": "Which is the balanced chemical equation for photosynthesis?",
      "options": ["...", "...", "...", "..."],
      "correct_index": 0,
      "explanation": "...",
      "timestamp_sec": 40,
      "difficulty": "easy"
    }
  ]
}
```

---

## 🛡️ Multi-Tier Resilience & Fallback Hierarchy

The system never leaves the user with a blank screen or a broken workflow:

1. **Level 0 (Local Disk & localStorage Cache):** Instant retrieval if the video has been processed before.
2. **Level 1 (Multi-Language Transcript Extraction):** Tries `en`, `en-US`, `en-GB`, `hi`, and any auto-generated captions.
3. **Level 2 (Exponential Backoff):** Retries transient network or rate-limit issues (1s, 2s, 4s).
4. **Level 3 (Paste Transcript Mode):** If YouTube subtitles are blocked/disabled, a modal prompts the user to paste plain text or time-coded speech notes.
5. **Level 4 (Subtitle File Upload):** Supports standard SubRip (`.srt`) and WebVTT (`.vtt`) files.
6. **Level 5 (Verified Demo Mode):** 1-click fallback to realistic, pre-cached lectures on Biology, Deep Learning, and Computer Science.

---

## 🏆 Hackathon Demonstration Flow (Step-by-Step)

1. **Landing Screen:** Notice the dark-first developer SaaS aesthetic (`#030712` background, emerald accents `#10B981`, clean typography).
2. **Launch Demo:** Click **"Load Demo (Photosynthesis)"** or one of the quick-pick pills.
3. **Live Pipeline:** Observe the animated 6-stage verification screen (*Video validated → Transcript chunked → AI generated → Timestamps snapped*).
4. **Interactive Summary:** 
   - Click any timestamp badge (e.g., `[01:24]`) → YouTube player immediately jumps to the exact second and begins playback.
   - Play the video → Observe active summary sections and key points automatically glowing and scrolling into view.
5. **Flashcards:** Click **Flashcards** tab → Click card to trigger the 3D flip animation → Mark as *Known* or *Review Again* → Click **"Watch this moment"** to jump to the source in the video.
6. **Quiz:** Click **Quiz** tab → Pick an option → Receive instant feedback and explanation → Click **"Watch this moment"** to verify the answer.
7. **Instant Search:** Click **Search** tab → Type `"chlorophyll"` or `"light"` → Filter results across Summary, Flashcards, and Quiz in real-time. Click any result to seek the player.
8. **Test Fallbacks:** Click **"Paste Transcript"** in header or home → Test pasting text or uploading subtitle files.
9. **Deep Linking:** Open URL with query params `?v=g78utcLQrJ4&t=90` → Direct load to the 1:30 mark!

---

## 🚢 Deployment Guide

### Frontend (Vercel)
1. Push project to GitHub.
2. Import repository on [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Build command: `npm run build`, Output directory: `dist`.
5. Set environment variable: `VITE_API_URL=https://your-backend-service.onrender.com`.

### Backend (Render / Railway)
1. In [Render](https://render.com), create a new **Web Service**.
2. Set **Root Directory** to `backend`.
3. Environment: `Python 3`.
4. Build command: `pip install -r requirements.txt`.
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
6. Set environment variable: `GEMINI_API_KEY` with your Google AI Studio key.

---

## 🧪 Automated Testing

Run the backend verification suite:
```bash
python backend/test_backend.py
```
Expected output:
```
Verified schema for demo-lecture-1.json: OK
Verified schema for demo-lecture-2.json: OK
Verified schema for demo-lecture-3.json: OK
ALL BACKEND TESTS PASSED!
```

Run the end-to-end integration check:
```bash
node test_integration.mjs
```
Expected output:
```
✓ Health: {"status":"ok","app":"LECTRA","gemini_configured":false}
✓ Demos retrieved (3 demos)
✓ Cached Kit 1, 2, 3 verified
✓ POST /api/kit cache hit: true
✓ Invalid URL rejection HTTP status: 400
✓ Frontend dev server HTTP 200
>>> ALL ENDPOINTS & DATA FLOWS VERIFIED SUCCESSFULLY! <<<
```

---

## ⚖️ Known Limitations & Future Work
- **YouTube Private Videos:** Videos requiring age verification or private login cannot be fetched via public transcript APIs; users can seamlessly use the built-in Level 3 (Paste) or Level 4 (SRT/VTT upload) fallback.
- **Audio-Only Podcasts:** Future versions can integrate client-side WebAssembly Whisper or Gemini File API for zero-transcript audio processing.

---

## 📄 License
MIT License. Built for the Hackathon Demonstration.
