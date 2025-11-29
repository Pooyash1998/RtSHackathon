"""
story_idea.py

Step 1 of the pipeline:
- Fetch classroom + students from Supabase
- Call OpenAI to generate 3 story ideas
- Create a new chapter row with chapter_outline JSON state
- Return { chapter_id, ideas[...] } for the frontend
"""

import os
import json
from typing import Any, Dict, List

import requests  # not strictly needed here, but fine to leave if shared env
from dotenv import load_dotenv
from openai import OpenAI

from database.database import (
    get_classroom,
    get_students_by_classroom,
    get_chapters_by_classroom,
    create_chapter,
)

# ─────────────────────────────────────────────────────────────
# Environment + client setup
# ─────────────────────────────────────────────────────────────

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY_HERE")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.1")

openai_client = OpenAI(api_key=OPENAI_API_KEY)

if not OPENAI_API_KEY or OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
    print("[WARN] OPENAI_API_KEY not set; OpenAI calls will fail until you configure it.")


# ─────────────────────────────────────────────────────────────
# Public entrypoint
# ─────────────────────────────────────────────────────────────

def start_chapter(classroom_id: str, teacher_outline: str) -> Dict[str, Any]:
    """
    1) Fetch classroom + students
    2) Call OpenAI → 3 story ideas
    3) Create a new chapter row with separate fields for prompt and ideas
    4) Return { chapter_id, ideas[...] } for frontend

    Creates a chapter with:
    - original_prompt: Teacher's original prompt/outline
    - story_ideas: Array of 3 AI-generated ideas
    - status: "awaiting_choice"
    """

    classroom = get_classroom(classroom_id)
    if classroom is None:
        raise ValueError(f"Classroom {classroom_id} not found")

    students = get_students_by_classroom(classroom_id)

    # Generate story ideas via OpenAI
    ideas = generate_story_ideas(
        classroom=classroom,
        students=students,
        teacher_outline=teacher_outline,
    )

    # Compute next chapter index for this classroom (1-based)
    existing_chapters = get_chapters_by_classroom(classroom_id)
    if existing_chapters:
        max_index = max(ch["index"] for ch in existing_chapters)
        new_index = max_index + 1
    else:
        new_index = 1

    # Create chapter with separate fields
    chapter = create_chapter(
        classroom_id=classroom_id,
        index=new_index,
        original_prompt=teacher_outline,
        story_ideas=ideas,
        status="awaiting_choice",
    )

    return {
        "chapter_id": chapter["id"],
        "chapter_index": chapter["index"],
        "classroom_id": classroom_id,
        "ideas": ideas,
    }


# ─────────────────────────────────────────────────────────────
# OpenAI helpers
# ─────────────────────────────────────────────────────────────

def _classroom_context_dict(
    classroom: Dict[str, Any],
    students: List[Dict[str, Any]],
    teacher_outline: str,
) -> Dict[str, Any]:
    """Compact JSON context that we send to OpenAI."""
    return {
        "classroom": {
            "id": classroom["id"],
            "name": classroom["name"],
            "subject": classroom["subject"],
            "grade_level": classroom["grade_level"],
            "story_theme": classroom["story_theme"],
            "design_style": classroom["design_style"],
            "duration": classroom["duration"],
        },
        "students": [
            {
                "name": s["name"],
                "interests": s.get("interests", ""),
                "avatar_url": s.get("avatar_url"),
            }
            for s in students
        ],
        "teacher_outline": teacher_outline,
    }


def generate_story_ideas(
    classroom: Dict[str, Any],
    students: List[Dict[str, Any]],
    teacher_outline: str,
) -> List[Dict[str, Any]]:
    """
    Ask OpenAI for 3 story ideas for this classroom + outline.

    Returns:
      [
        {"id": "idea_1", "title": "...", "summary": "..."},
        {"id": "idea_2", ...},
        {"id": "idea_3", ...}
      ]
    """

    payload = _classroom_context_dict(classroom, students, teacher_outline)

    system_prompt = (
        "You create fun, age-appropriate ideas for short educational comic chapters "
        "for kids roughly between 6 and 16 years old. Always respond with a single JSON object."
    )

    user_prompt = (
        "You are given classroom and student info plus a short outline from the teacher.\n"
        "Propose exactly 3 different comic chapter ideas that match the outline and help "
        "students learn the subject.\n\n"
        "IMPORTANT: Each idea should feature different students or combinations of students from the class. "
        "Use their names and interests to make the stories personal and engaging. "
        "Vary which students are featured across the 3 ideas.\n\n"
        "Return ONLY a JSON object with this structure (no extra text):\n"
        "{\n"
        '  "ideas": [\n'
        '    { "title": "string", "summary": "2–3 sentence description" },\n'
        "    ... (3 items total)\n"
        "  ]\n"
        "}\n\n"
        f"INPUT:\n{json.dumps(payload, ensure_ascii=False)}"
    )

    resp = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw = resp.choices[0].message.content
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"OpenAI returned invalid JSON for story ideas: {e}\nRaw: {raw}")

    ideas_raw = data.get("ideas", [])
    ideas: List[Dict[str, Any]] = []
    for idx, idea in enumerate(ideas_raw, start=1):
        ideas.append(
            {
                "id": f"idea_{idx}",
                "title": idea.get("title", f"Idea {idx}"),
                "summary": idea.get("summary", ""),
            }
        )
    # Ensure exactly 3 items by trimming or padding
    if len(ideas) > 3:
        ideas = ideas[:3]
    while len(ideas) < 3:
        i = len(ideas) + 1
        ideas.append({"id": f"idea_{i}", "title": f"Idea {i}", "summary": ""})

    return ideas


# ─────────────────────────────────────────────────────────────
# Optional CLI for testing
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Start a chapter and generate 3 story ideas")
    parser.add_argument("classroom_id", help="Classroom UUID")
    parser.add_argument("teacher_outline", help="Short outline / topic for this chapter")

    args = parser.parse_args()

    result = start_chapter(args.classroom_id, args.teacher_outline)
    print(json.dumps(result, indent=2, ensure_ascii=False))
