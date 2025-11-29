"""
chapter_commit.py

Step 2 of the pipeline:
- Load chapter + stored state (teacher_outline, story_ideas)
- Take chosen_idea_id from frontend
- Call OpenAI to generate full script + panel breakdown
- Build FLUX prompts, call Black Forest Labs FLUX.2 [pro] to generate images
- Use previous panel image + student avatars as multi-reference inputs
- Upload images (Supabase Storage if configured) and create panel rows
- Update chapter_outline JSON state and return full chapter payload
"""

import os
import json
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from openai import OpenAI

from database.database import (
    supabase,
    get_classroom,
    get_students_by_classroom,
    get_chapter,
    create_panel,
)

# ─────────────────────────────────────────────────────────────
# Environment + client setup
# ─────────────────────────────────────────────────────────────

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY_HERE")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Support both BFL_API_KEY and BLACK_FOREST_API_KEY for compatibility
BFL_API_KEY = os.getenv("BFL_API_KEY") or os.getenv("BLACK_FOREST_API_KEY", "YOUR_BFL_API_KEY_HERE")
BFL_API_BASE = os.getenv("BFL_API_BASE", "https://api.bfl.ai")
# Use FLUX.2 [pro] endpoint
BFL_MODEL_ENDPOINT = os.getenv("BFL_MODEL_ENDPOINT", "flux-pro-1.1")

SUPABASE_IMAGES_BUCKET = os.getenv("SUPABASE_IMAGES_BUCKET")

if not OPENAI_API_KEY or OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
    print("[WARN] OPENAI_API_KEY not set; OpenAI calls will fail until you configure it.")

if not BFL_API_KEY or BFL_API_KEY == "YOUR_BFL_API_KEY_HERE":
    print("[WARN] BFL_API_KEY or BLACK_FOREST_API_KEY not set; FLUX calls will fail until you configure it.")


# ─────────────────────────────────────────────────────────────
# Public entrypoint
# ─────────────────────────────────────────────────────────────

def commit_story_choice(chapter_id: str, chosen_idea_id: str) -> Dict[str, Any]:
    """
    Complete the chapter pipeline once a story idea has been chosen.

    Returns:
      {
        "chapter_id": ...,
        "chapter_index": ...,
        "classroom_id": ...,
        "episode_title": "...",
        "learning_objectives": [...],
        "panels": [
          {
            "index": 1,
            "setting": "...",
            "description": "...",
            "narration": "...",
            "dialogue": [...],
            "featured_students": [...],
            "image_url": "https://..."
          },
          ...
        ]
      }
    """

    chapter = get_chapter(chapter_id)
    if chapter is None:
        raise ValueError(f"Chapter {chapter_id} not found")

    classroom_id: str = chapter["classroom_id"]
    classroom = get_classroom(classroom_id)
    if classroom is None:
        raise ValueError(f"Classroom {classroom_id} not found")

    students = get_students_by_classroom(classroom_id)

    # Build lookup: student name (lowercased) -> full record (for avatars)
    students_by_name: Dict[str, Dict[str, Any]] = {
        s["name"].strip().lower(): s for s in students
    }

    # Parse existing state from chapter_outline TEXT
    try:
        state = json.loads(chapter["chapter_outline"])
    except json.JSONDecodeError:
        raise ValueError(
            f"chapter_outline for chapter {chapter_id} is not valid JSON; "
            "start_chapter must be called first to initialize state."
        )

    teacher_outline = state.get("teacher_outline", "")
    story_ideas = state.get("story_ideas", [])

    chosen_idea: Optional[Dict[str, Any]] = next(
        (idea for idea in story_ideas if idea["id"] == chosen_idea_id),
        None,
    )
    if chosen_idea is None:
        raise ValueError(f"Chosen idea id {chosen_idea_id} not found for chapter {chapter_id}")

    # Generate full script + panels via OpenAI
    script = generate_full_script_and_panels(
        classroom=classroom,
        students=students,
        teacher_outline=teacher_outline,
        chosen_idea=chosen_idea,
    )

    # Build FLUX prompts
    flux_prompts = build_flux_prompts_from_script(
        classroom=classroom,
        students=students,
        script=script,
    )

    # Map panel index -> panel dict for convenience
    panels_by_index: Dict[int, Dict[str, Any]] = {
        int(p["index"]): p for p in script["panels"]
    }

    # Generate images and create panel rows
    panel_index_to_url: Dict[int, str] = {}
    previous_panel_image_url: Optional[str] = None

    # Make sure we generate in index order
    for panel_prompt in sorted(flux_prompts, key=lambda p: p["index"]):
        idx = panel_prompt["index"]
        prompt = panel_prompt["prompt"]
        aspect_ratio = panel_prompt["aspect_ratio"]

        panel = panels_by_index.get(idx, {})
        featured_students = panel.get("featured_students") or []
        dialogue = panel.get("dialogue") or []

        # Collect names mentioned in this panel (featured + speakers)
        mentioned_names: set[str] = set()
        for name in featured_students:
            if isinstance(name, str):
                mentioned_names.add(name.strip())
        for line in dialogue:
            speaker = line.get("speaker")
            if isinstance(speaker, str):
                mentioned_names.add(speaker.strip())

        # Resolve avatars from DB for mentioned students
        avatar_urls: List[str] = []
        for name in mentioned_names:
            student = students_by_name.get(name.lower())
            if student:
                avatar = student.get("avatar_url")
                if avatar:
                    avatar_urls.append(avatar)

        # Build reference images list:
        #  - previous panel image (if any) first, to keep style across panels
        #  - then all unique student avatars for this panel
        reference_images: List[str] = []
        if previous_panel_image_url:
            reference_images.append(previous_panel_image_url)

        for url in avatar_urls:
            if url not in reference_images:
                reference_images.append(url)

        # FLUX.2 [pro] supports up to 8 reference images via input_image..input_image_8
        if len(reference_images) > 8:
            reference_images = reference_images[:8]

        image_bytes, source_url = call_flux_and_download(
            prompt,
            aspect_ratio=aspect_ratio,
            reference_images=reference_images,
        )

        image_url = upload_image_and_get_url(
            img_bytes=image_bytes,
            chapter_id=chapter_id,
            panel_index=idx,
            fallback_url=source_url,
        )

        create_panel(chapter_id=chapter_id, index=idx, image=image_url)

        panel_index_to_url[idx] = image_url
        previous_panel_image_url = image_url

    # Update chapter_outline with full state
    full_state = {
        "status": "ready",
        "teacher_outline": teacher_outline,
        "story_ideas": story_ideas,
        "chosen_idea_id": chosen_idea_id,
        "script": script,
    }
    _update_chapter_outline(chapter_id, full_state)

    # Build structured payload for frontend
    panels_output: List[Dict[str, Any]] = []
    for panel in script["panels"]:
        idx = panel["index"]
        panels_output.append(
            {
                "index": idx,
                "setting": panel["setting"],
                "description": panel["description"],
                "narration": panel["narration"],
                "dialogue": panel["dialogue"],
                "featured_students": panel["featured_students"],
                "image_url": panel_index_to_url.get(idx),
            }
        )

    return {
        "chapter_id": chapter_id,
        "chapter_index": chapter["index"],
        "classroom_id": classroom_id,
        "episode_title": script["episode_title"],
        "learning_objectives": script.get("learning_objectives", []),
        "panels": panels_output,
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


def generate_full_script_and_panels(
    classroom: Dict[str, Any],
    students: List[Dict[str, Any]],
    teacher_outline: str,
    chosen_idea: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Ask OpenAI for a full script + panel breakdown.

    Expected JSON:
    {
      "episode_title": "string",
      "learning_objectives": ["...", "..."],
      "panels": [
        {
          "index": 1,
          "setting": "short description of location/time",
          "description": "what we see in the panel, visually",
          "narration": "narrator text (if any)",
          "dialogue": [
            {"speaker": "Name", "text": "..." }
          ],
          "featured_students": ["Name1", "Name2"]
        },
        ...
      ]
    }
    """

    payload = _classroom_context_dict(classroom, students, teacher_outline)
    payload["chosen_idea"] = chosen_idea

    system_prompt = (
        "You write scripts for short educational comics. "
        "Target: kids 6–16, clear and simple language, 4–8 panels per chapter. "
        "Always respond with a single JSON object following the requested schema."
    )

    user_prompt = (
        "Using the given classroom, students, teacher_outline and chosen_idea, write a single comic chapter.\n\n"
        "Constraints:\n"
        "- 4 to 8 panels total.\n"
        "- Each panel should be visually distinct and move the story forward.\n"
        "- Use the students' names in dialogue sometimes to make it personal.\n"
        "- Keep dialogue lines short (max 15 words).\n"
        "- Make sure the story helps understand the subject in a concrete way.\n\n"
        "Return ONLY a JSON object with this structure (no extra text):\n"
        "{\n"
        '  "episode_title": "short, fun title",\n'
        '  "learning_objectives": ["objective 1", "objective 2", ...],\n'
        '  "panels": [\n'
        "    {\n"
        '      "index": 1,\n'
        '      "setting": "location and time",\n'
        '      "description": "what we see in the drawing, including characters and actions",\n'
        '      "narration": "optional narrator text or empty string",\n'
        '      "dialogue": [\n'
        '        {"speaker": "Name", "text": "line of dialogue"},\n'
        "        ...\n"
        "      ],\n"
        '      "featured_students": ["Name1", "Name2", ...]\n'
        "    },\n"
        "    ...\n"
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
        raise RuntimeError(f"OpenAI returned invalid JSON for script: {e}\nRaw: {raw}")

    panels = data.get("panels", [])
    # Normalize panel indices to 1..N if missing/invalid
    for idx, panel in enumerate(panels, start=1):
        panel["index"] = int(panel.get("index", idx))
        panel.setdefault("setting", "")
        panel.setdefault("description", "")
        panel.setdefault("narration", "")
        panel.setdefault("dialogue", [])
        panel.setdefault("featured_students", [])

    data["panels"] = panels
    data.setdefault("episode_title", chosen_idea.get("title", "Untitled Chapter"))
    data.setdefault("learning_objectives", [])

    return data


# ─────────────────────────────────────────────────────────────
# Flux prompt construction
# ─────────────────────────────────────────────────────────────

def build_flux_prompts_from_script(
    classroom: Dict[str, Any],
    students: List[Dict[str, Any]],
    script: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Build text-to-image prompts for each panel based on the script and classroom style.

    Returns:
      [
        {"index": 1, "prompt": "...", "aspect_ratio": "3:2"},
        ...
      ]
    """

    design_style = classroom.get("design_style", "comic")
    if design_style == "manga":
        style_phrase = (
            "in a clean black-and-white manga style, expressive characters, clear line art"
        )
    else:
        style_phrase = (
            "in a colorful, kid-friendly comic style, clear line art, simple shading"
        )

    theme_phrase = classroom.get("story_theme", "")

    student_descriptors: Dict[str, str] = {}
    for s in students:
        interests = s.get("interests", "")
        if interests:
            student_descriptors[s["name"]] = f"{s['name']}, a student who likes {interests}"
        else:
            student_descriptors[s["name"]] = f"{s['name']}, a student"

    flux_prompts: List[Dict[str, Any]] = []

    for panel in script["panels"]:
        idx = int(panel["index"])
        setting = panel.get("setting") or ""
        description = panel.get("description") or ""
        featured = panel.get("featured_students") or []

        if featured:
            cast_desc = ", ".join(
                student_descriptors.get(name, name) for name in featured
            )
            cast_phrase = f"Show the students: {cast_desc}."
        else:
            cast_phrase = "Show a small group of students and a teacher."

        prompt = (
            f"A single comic panel {style_phrase}. "
            f"Scene setting: {setting}. "
            f"Visual description: {description}. "
            f"{cast_phrase} "
            "Keep composition readable for text bubbles. "
            "Keep character designs and overall style consistent across panels and "
            "with any reference images provided. "
        )

        if theme_phrase:
            prompt += f"Match the ongoing story theme: {theme_phrase}. "

        # We still track an aspect ratio string and convert to width/height later
        aspect_ratio = "3:2"

        flux_prompts.append(
            {
                "index": idx,
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
            }
        )

    return flux_prompts


# ─────────────────────────────────────────────────────────────
# FLUX / Black Forest Labs API helpers
# ─────────────────────────────────────────────────────────────

def _dims_from_aspect(aspect_ratio: str) -> Tuple[int, int]:
    """
    Map a simple aspect ratio string to width/height for FLUX.2 [pro].
    FLUX.2 works with explicit width/height instead of a string aspect ratio.
    """
    aspect_ratio = aspect_ratio.strip()
    if aspect_ratio == "1:1":
        return 768, 768
    if aspect_ratio in ("3:2", "2:3"):
        return (960, 640) if aspect_ratio == "3:2" else (640, 960)
    if aspect_ratio in ("16:9", "9:16"):
        return (960, 540) if aspect_ratio == "16:9" else (540, 960)
    # Default: 3:2-ish
    return 960, 640


def call_flux_and_download(
    prompt: str,
    aspect_ratio: str = "3:2",
    reference_images: Optional[List[str]] = None,
    poll_interval: float = 0.75,
    timeout_seconds: float = 60.0,
) -> Tuple[bytes, str]:
    """
    1) POST to BFL async endpoint to create a generation/edit task (FLUX.2 [pro]).
    2) Optionally pass up to 8 reference images (previous panel + student avatars)
       as input_image, input_image_2, ..., input_image_8.
    3) Poll the returned polling_url until status == 'Ready' or timeout.
    4) Download the resulting image bytes from result.sample URL.

    Returns:
      (image_bytes, source_url)
    """

    if not BFL_API_KEY or BFL_API_KEY == "YOUR_BFL_API_KEY_HERE":
        raise RuntimeError("BFL_API_KEY is not set; cannot call FLUX API")

    submit_url = f"{BFL_API_BASE}/v1/{BFL_MODEL_ENDPOINT}"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-key": BFL_API_KEY,
    }

    width, height = _dims_from_aspect(aspect_ratio)

    body: Dict[str, Any] = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "output_format": "png",
        "safety_tolerance": 2,
    }

    # Attach reference images as input_image..input_image_8
    refs = reference_images or []
    for i, ref in enumerate(refs):
        if i >= 8:
            break
        key = "input_image" if i == 0 else f"input_image_{i + 1}"
        body[key] = ref

    submit_resp = requests.post(submit_url, headers=headers, json=body, timeout=30)
    submit_resp.raise_for_status()
    submit_data = submit_resp.json()

    polling_url = submit_data.get("polling_url")
    if not polling_url:
        raise RuntimeError(f"FLUX submit response missing polling_url: {submit_data}")

    start = time.time()
    while True:
        if time.time() - start > timeout_seconds:
            raise TimeoutError("Timed out while polling FLUX generation result")

        time.sleep(poll_interval)

        poll_resp = requests.get(
            polling_url,
            headers={
                "accept": "application/json",
                "x-key": BFL_API_KEY,
            },
            timeout=30,
        )
        poll_resp.raise_for_status()
        poll_data = poll_resp.json()

        status = poll_data.get("status")
        if status == "Ready":
            result = poll_data.get("result", {})
            sample_url = result.get("sample")
            if not sample_url:
                raise RuntimeError(f"FLUX result missing sample URL: {poll_data}")

            img_resp = requests.get(sample_url, timeout=30)
            img_resp.raise_for_status()
            return img_resp.content, sample_url

        if status in {"Error", "Failed"}:
            raise RuntimeError(f"FLUX generation failed: {poll_data}")


def upload_image_and_get_url(
    img_bytes: bytes,
    chapter_id: str,
    panel_index: int,
    fallback_url: str,
) -> str:
    """
    Upload image bytes to Supabase Storage if SUPABASE_IMAGES_BUCKET is configured.
    Otherwise, fall back to the original FLUX delivery URL (short-lived, not ideal for production).
    """

    if not SUPABASE_IMAGES_BUCKET:
        return fallback_url

    path = f"chapters/{chapter_id}/panel_{panel_index:02d}.png"

    try:
        supabase.storage.from_(SUPABASE_IMAGES_BUCKET).upload(
            path=path,
            file=img_bytes,
            file_options={
                "content-type": "image/png",
                "cache-control": "3600",
                "upsert": "true",
            },
        )

        public_url = supabase.storage.from_(SUPABASE_IMAGES_BUCKET).get_public_url(path)
        if isinstance(public_url, dict):
            public_url = (
                public_url.get("publicUrl")
                or public_url.get("public_url")
                or fallback_url
            )

        return public_url  # type: ignore[return-value]
    except Exception as e:
        print(f"[WARN] Failed to upload image to Supabase Storage: {e}")
        return fallback_url


# ─────────────────────────────────────────────────────────────
# Internal DB helper
# ─────────────────────────────────────────────────────────────

def _update_chapter_outline(chapter_id: str, state: Dict[str, Any]) -> None:
    """
    Persist the JSON state into chapters.chapter_outline (TEXT).
    """

    supabase.table("chapters").update(
        {"chapter_outline": json.dumps(state, ensure_ascii=False)}
    ).eq("id", chapter_id).execute()


# ─────────────────────────────────────────────────────────────
# Optional CLI for testing
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Commit a chosen story idea and generate full chapter"
    )
    parser.add_argument("chapter_id", help="Chapter UUID")
    parser.add_argument("chosen_idea_id", help="ID of the chosen idea (e.g. idea_1)")

    args = parser.parse_args()

    result = commit_story_choice(args.chapter_id, args.chosen_idea_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))
