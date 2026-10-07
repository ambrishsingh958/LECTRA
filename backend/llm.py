import os
import json
import time
import re
from typing import Dict, Any, List, Tuple, Optional
from dotenv import load_dotenv
from validate import validate_and_snap_study_kit, SCHEMA

load_dotenv()

SYSTEM_INSTRUCTION = """You are an expert teacher.
Use ONLY the provided transcript.
Do not introduce unsupported information.
Every timestamp_sec MUST be copied from an actual [t=...] tag provided in the transcript.
NEVER invent timestamps.
Return only valid JSON matching the supplied schema.

Guidelines:
1. Summary:
   - Provide a punchy, comprehensive 'tldr' (3-5 sentences).
   - Divide the lecture into 3-12 logical sections with clear titles, start_sec, end_sec, detailed summary, and key_points.
   - For every key point, attach a 'timestamp_sec' matching the exact [t=...] tag where it appears.
2. Flashcards:
   - Generate between 8 and 30 active-recall flashcards.
   - Each card must have: front (clear question/prompt), back (concise answer), timestamp_sec (from [t=...]), difficulty ('easy', 'medium', 'hard'), tags (array of strings).
3. Quiz:
   - Generate between 5 and 20 multiple-choice questions.
   - Each question must have: exactly 4 options, correct_index (0 to 3), detailed explanation, timestamp_sec (from [t=...]), difficulty ('easy', 'medium', 'hard').
"""

def extract_json_from_text(text: str) -> Dict[str, Any]:
    """Extracts JSON object from text, stripping markdown blocks if present."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


def call_gemini_api(prompt: str, client: Any, model_name: str = "gemini-2.5-flash") -> str:
    """Calls Gemini API with exponential backoff on 429/rate limits."""
    delays = [1.0, 2.0, 4.0]
    last_err = None

    for attempt in range(len(delays) + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                    "response_mime_type": "application/json",
                    "response_schema": SCHEMA,
                    "temperature": 0.2,
                }
            )
            return response.text
        except Exception as e:
            err_msg = str(e)
            last_err = e
            if "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower():
                if attempt < len(delays):
                    time.sleep(delays[attempt])
                    continue
            # If model_name isn't found, try falling back to gemini-2.0-flash or gemini-1.5-flash
            if ("not found" in err_msg.lower() or "unsupported" in err_msg.lower()) and model_name != "gemini-2.0-flash":
                try:
                    response = client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=prompt,
                        config={
                            "system_instruction": SYSTEM_INSTRUCTION,
                            "response_mime_type": "application/json",
                            "temperature": 0.2,
                        }
                    )
                    return response.text
                except Exception as e2:
                    last_err = e2
            raise last_err

    raise last_err


def generate_study_kit(
    video_id: str,
    title: str,
    formatted_chunks: str,
    real_timestamps: List[int],
    max_duration: float
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Executes the Gemini pipeline:
    1. Sends formatted chunks to Gemini with structured schema.
    2. Validates JSON schema.
    3. If invalid, retries Gemini once with the validation error.
    4. Snaps all timestamps to nearest real chunk timestamp.
    Returns: (success, study_kit_dict, error_message)
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return False, None, "GEMINI_API_KEY is not configured in backend environment."

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
    except Exception as e:
        return False, None, f"Failed to initialize Gemini Client: {str(e)}"

    prompt = f"""VIDEO ID: {video_id}
LECTURE TITLE: {title}
TOTAL DURATION: {int(max_duration)} seconds

TRANSCRIPT CHUNKS (Use ONLY these [t=...] timestamps):
{formatted_chunks}

Produce the complete StudyKit JSON following the schema. Ensure EVERY timestamp_sec exactly matches one of the [t=...] tags above.
"""

    for attempt in range(2):
        try:
            raw_output = call_gemini_api(prompt, client)
            parsed_json = extract_json_from_text(raw_output)
            
            # Ensure top-level fields
            if "video_id" not in parsed_json:
                parsed_json["video_id"] = video_id
            if "title" not in parsed_json:
                parsed_json["title"] = title

            # Validate and snap
            is_valid, sanitized_kit, errors = validate_and_snap_study_kit(
                parsed_json,
                real_timestamps,
                max_duration
            )

            if is_valid:
                return True, sanitized_kit, None
            else:
                # Retry prompt with the error details
                prompt += f"\n\nPREVIOUS OUTPUT FAILED VALIDATION:\n{'; '.join(errors)}\nPlease fix and return strictly valid JSON matching the schema."
        except Exception as e:
            if attempt == 1:
                return False, None, f"Gemini study kit generation failed: {str(e)}"
            # Retry once
            time.sleep(1.0)

    return False, None, "Study kit could not be validated against schema after retry."
