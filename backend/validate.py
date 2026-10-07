import json
import os
from typing import Dict, List, Any, Tuple
import jsonschema

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.json")

def load_schema() -> Dict[str, Any]:
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

SCHEMA = load_schema()

def snap_timestamp(ai_ts: float, real_timestamps: List[int], max_duration: float) -> int:
    """
    Clamps the timestamp to [0, max_duration] and snaps it to the nearest REAL chunk start timestamp.
    """
    if not real_timestamps:
        return max(0, int(round(ai_ts)))
    
    clamped = max(0.0, min(float(ai_ts), float(max_duration)))
    # Find nearest timestamp in real_timestamps
    nearest = min(real_timestamps, key=lambda real_t: abs(real_t - clamped))
    return int(nearest)


def validate_and_snap_study_kit(
    data: Dict[str, Any],
    real_timestamps: List[int],
    max_duration: float
) -> Tuple[bool, Dict[str, Any], List[str]]:
    """
    Validates StudyKit against schema.json, then snaps all timestamps
    to the nearest real transcript chunk start, enforcing end_sec >= start_sec.
    Returns: (is_valid, sanitized_data, error_messages)
    """
    errors = []

    # 1. JSON Schema validation
    try:
        jsonschema.validate(instance=data, schema=SCHEMA)
    except jsonschema.ValidationError as e:
        errors.append(f"JSON Schema error: {e.message} at path {'/'.join(str(p) for p in e.path)}")
        return False, data, errors
    except Exception as e:
        errors.append(f"Validation exception: {str(e)}")
        return False, data, errors

    # Deep copy / sanitize
    sanitized = json.loads(json.dumps(data))

    # 2. Snap Summary Sections and Key Points
    sections = sanitized.get("summary", {}).get("sections", [])
    for sec in sections:
        raw_start = sec.get("start_sec", 0)
        raw_end = sec.get("end_sec", raw_start + 40)
        
        snapped_start = snap_timestamp(raw_start, real_timestamps, max_duration)
        snapped_end = snap_timestamp(raw_end, real_timestamps, max_duration)

        # Ensure end_sec >= start_sec
        if snapped_end < snapped_start:
            # Try to pick the next real timestamp or at least start + 40
            matching_after = [t for t in real_timestamps if t > snapped_start]
            if matching_after:
                snapped_end = matching_after[0]
            else:
                snapped_end = snapped_start + 40

        sec["start_sec"] = snapped_start
        sec["end_sec"] = snapped_end

        for kp in sec.get("key_points", []):
            raw_kp_ts = kp.get("timestamp_sec", snapped_start)
            kp["timestamp_sec"] = snap_timestamp(raw_kp_ts, real_timestamps, max_duration)

    # 3. Snap Flashcards
    for fc in sanitized.get("flashcards", []):
        raw_fc_ts = fc.get("timestamp_sec", 0)
        fc["timestamp_sec"] = snap_timestamp(raw_fc_ts, real_timestamps, max_duration)

    # 4. Snap Quiz Questions
    for q in sanitized.get("quiz", []):
        raw_q_ts = q.get("timestamp_sec", 0)
        q["timestamp_sec"] = snap_timestamp(raw_q_ts, real_timestamps, max_duration)

    return True, sanitized, []
