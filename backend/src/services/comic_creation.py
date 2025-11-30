"""
comic_creation.py

Step 2 of the pipeline:
- Load chapter + stored state (teacher_outline, story_ideas)
- Take chosen_idea_id from frontend
- Call OpenAI to generate full script + panel breakdown
- Build FLUX prompts, call Black Forest Labs FLUX.2 [pro] to generate images
- Use previous panel image + student avatars as multi-reference inputs
- Run an OpenAI vision-based quality check per panel (optional, configurable)
- Retry low-scoring panels up to N times with refined prompts
- Upload final images (Supabase Storage if configured) and create panel rows
- Update chapter JSON state and return full chapter payload
"""

import os
import json
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from openai import OpenAI

from database.database import (
    supabase,
    get_classroom,
    get_students_by_classroom,
    get_chapter,
    update_chapter,
    create_panel,
)

# NEW: quality review helper
from panel_review import review_panel_image

# ─────────────────────────────────────────────────────────────
# Environment + client setup
# ─────────────────────────────────────────────────────────────

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY_HERE")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.1")

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Support both BFL_API_KEY and BLACK_FOREST_API_KEY for compatibility
BFL_API_KEY = os.getenv("BFL_API_KEY") or os.getenv(
    "BLACK_FOREST_API_KEY", "YOUR_BFL_API_KEY_HERE"
)
BFL_API_BASE = os.getenv("BFL_API_BASE", "https://api.bfl.ai")

BFL_MODEL_ENDPOINT = os.getenv("BFL_MODEL_ENDPOINT", "flux-2-flex")

SUPABASE_IMAGES_BUCKET = os.getenv("SUPABASE_IMAGES_BUCKET")

# NEW: panel review configuration
PANEL_REVIEW_ENABLED = os.getenv("PANEL_REVIEW_ENABLED", "true").lower() == "true"
PANEL_REVIEW_MIN_SCORE = float(os.getenv("PANEL_REVIEW_MIN_SCORE", "9.0"))
PANEL_REVIEW_MAX_ATTEMPTS = int(os.getenv("PANEL_REVIEW_MAX_ATTEMPTS", "3"))

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

    print(f"\n{'='*60}")
    print(f"🎬 Starting Comic Generation")
    print(f"{'='*60}")
    print(f"Chapter ID: {chapter_id}")
    print(f"Chosen Idea: {chosen_idea_id}")
    
    print("\n🧹 Step 0: Cleaning up existing panels (if any)...")
    # Delete any existing panels for this chapter to allow regeneration
    try:
        supabase.table("panels").delete().eq("chapter_id", chapter_id).execute()
        print("✓ Existing panels cleared")
    except Exception as e:
        print(f"⚠️  No existing panels to clear: {e}")
    
    print("\n📚 Step 1: Fetching chapter data...")
    chapter = get_chapter(chapter_id)
    if chapter is None:
        raise ValueError(f"Chapter {chapter_id} not found")
    print(f"✓ Chapter found: Index {chapter.get('index')}")

    classroom_id: str = chapter["classroom_id"]
    print(f"\n🏫 Step 2: Fetching classroom data...")
    classroom = get_classroom(classroom_id)
    if classroom is None:
        raise ValueError(f"Classroom {classroom_id} not found")
    print(f"✓ Classroom: {classroom.get('name')} ({classroom.get('subject')})")

    print(f"\n👥 Step 3: Fetching students...")
    students = get_students_by_classroom(classroom_id)
    print(f"✓ Found {len(students)} students")

    # Build lookup: student name (lowercased) -> full record (for avatars)
    students_by_name: Dict[str, Dict[str, Any]] = {
        s["name"].strip().lower(): s for s in students
    }

    # Get story ideas from the dedicated field
    print(f"\n💡 Step 4: Loading story ideas...")
    story_ideas = chapter.get("story_ideas", [])
    if not story_ideas:
        raise ValueError(
            f"No story ideas found for chapter {chapter_id}; "
            "start_chapter must be called first to generate ideas."
        )
    print(f"✓ Found {len(story_ideas)} story ideas")

    teacher_outline = chapter.get("original_prompt", "")

    # Find the chosen idea
    chosen_idea: Optional[Dict[str, Any]] = next(
        (idea for idea in story_ideas if idea["id"] == chosen_idea_id),
        None,
    )
    if chosen_idea is None:
        raise ValueError(f"Chosen idea id {chosen_idea_id} not found for chapter {chapter_id}")
    print(f"✓ Selected: {chosen_idea.get('title')}")

    # Generate full script + panels via OpenAI
    print(f"\n🤖 Step 5: Generating comic script with OpenAI...")
    print(f"   Model: {OPENAI_MODEL}")
    script = generate_full_script_and_panels(
        classroom=classroom,
        students=students,
        teacher_outline=teacher_outline,
        chosen_idea=chosen_idea,
    )
    print(f"✓ Script generated: {script.get('episode_title')}")
    print(f"✓ Panels to generate: {len(script.get('panels', []))}")

    # Build FLUX prompts
    print(f"\n📝 Step 6: Building FLUX prompts...")
    flux_prompts = build_flux_prompts_from_script(
        classroom=classroom,
        students=students,
        script=script,
    )
    print(f"✓ Built {len(flux_prompts)} prompts")

    # Map panel index -> panel dict for convenience
    panels_by_index: Dict[int, Dict[str, Any]] = {
        int(p["index"]): p for p in script["panels"]
    }

    # Generate images and create panel rows
    print(f"\n🎨 Step 7: Generating images with FLUX...")
    print(f"   Endpoint: {BFL_MODEL_ENDPOINT}")
    print(f"   This may take 1-2 minutes per panel...\n")
    
    panel_index_to_url: Dict[int, str] = {}
    previous_panel_image_url: Optional[str] = None
    panel_quality: Dict[int, Dict[str, Any]] = {}

    # Make sure we generate in index order
    for panel_prompt in sorted(flux_prompts, key=lambda p: p["index"]):
        idx = panel_prompt["index"]
        base_prompt = panel_prompt["prompt"]
        aspect_ratio = panel_prompt["aspect_ratio"]

        print(f"   Panel {idx}/{len(flux_prompts)}:")

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

        print(f"      - Using {len(reference_images)} reference images")

        # NEW: quality-aware generation loop
        if not PANEL_REVIEW_ENABLED:
            # Old behavior: single generation, no review
            print(f"      - Review disabled; generating once...")
            image_bytes, source_url = call_flux_and_download(
                base_prompt,
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
            continue

        best_image_bytes: Optional[bytes] = None
        best_source_url: Optional[str] = None
        best_score: float = -1.0
        best_review: Optional[Dict[str, Any]] = None

        current_prompt = base_prompt

        for attempt in range(1, PANEL_REVIEW_MAX_ATTEMPTS + 1):
            print(f"\n      🎯 Attempt {attempt}/{PANEL_REVIEW_MAX_ATTEMPTS}")
            print(f"      → Generating image with FLUX...")
            image_bytes, source_url = call_flux_and_download(
                current_prompt,
                aspect_ratio=aspect_ratio,
                reference_images=reference_images,
            )

            print(f"      ✓ Image generated ({len(image_bytes)} bytes)")
            
            # Run multimodal review against the *BFL sample URL*
            print(f"      → Running quality review...")
            try:
                review = review_panel_image(
                    image_url=source_url,
                    panel=panel,
                    classroom=classroom,
                    students=students,
                    min_score=PANEL_REVIEW_MIN_SCORE,
                )
                score = float(review.get("score", 0.0))
                print(f"      ✓ Quality score: {score:.1f}/10 (threshold: {PANEL_REVIEW_MIN_SCORE})")
                issues = review.get("issues") or []
                if issues:
                    print(f"      ⚠️  Issues found:")
                    for i, issue in enumerate(issues, 1):
                        print(f"         {i}. {issue}")
            except Exception as e:
                print(f"      ❌ Panel review failed (attempt {attempt}): {e}")
                review = None
                score = 0.0

            # Track best attempt so far
            if score > best_score:
                best_score = score
                best_image_bytes = image_bytes
                best_source_url = source_url
                best_review = review

            # If we passed the quality threshold, stop retrying
            if score >= PANEL_REVIEW_MIN_SCORE:
                print(f"      ✅ Panel passed quality threshold! (score {score:.1f} >= {PANEL_REVIEW_MIN_SCORE})")
                break

            # Otherwise, refine prompt using suggested fix (if any) and try again
            if attempt < PANEL_REVIEW_MAX_ATTEMPTS:
                print(f"      ⚠️  Score {score:.1f} below threshold {PANEL_REVIEW_MIN_SCORE}, will retry...")
                
                # Build aggressive, targeted fix prompt
                fix_parts = []
                
                # Get the suggested fix from the review
                if review:
                    suggested_fix = (review.get("suggested_fix_prompt") or "").strip()
                    if suggested_fix:
                        fix_parts.append(suggested_fix)
                    
                    # Extract specific issues and create targeted fixes
                    issues = review.get("issues") or []
                    dimensions = review.get("dimensions") or {}
                    
                    # If text accuracy is low, be VERY strict about spelling
                    text_accuracy = dimensions.get("text_accuracy", 0.0)
                    if text_accuracy < 7.0 and issues:
                        fix_parts.append(
                            "CRITICAL: Text must be spelled EXACTLY correctly with no errors. "
                            "Double-check every word for spelling mistakes."
                        )
                    
                    # If character accuracy is low, emphasize character presence
                    char_accuracy = dimensions.get("character_accuracy", 0.0)
                    if char_accuracy < 7.0:
                        fix_parts.append(
                            f"REQUIRED: All characters must be clearly visible: {', '.join(featured_students)}. "
                            "Each character must be distinct and recognizable."
                        )
                    
                    # Add specific issue-based fixes
                    for issue in issues:
                        issue_lower = issue.lower()
                        
                        # Spelling/text issues
                        if any(word in issue_lower for word in ["spell", "misspell", "wrong text", "incorrect text"]):
                            fix_parts.append(
                                f"FIX IMMEDIATELY: {issue}. "
                                "Verify spelling character-by-character before rendering."
                            )
                        
                        # Missing elements
                        elif "missing" in issue_lower:
                            fix_parts.append(
                                f"MUST ADD: {issue}. "
                                "This element is required and cannot be omitted."
                            )
                        
                        # Bubble/dialogue issues
                        elif any(word in issue_lower for word in ["bubble", "dialogue", "speech"]):
                            fix_parts.append(
                                f"DIALOGUE FIX: {issue}. "
                                "Ensure bubble tails point to the correct speaker."
                            )
                
                # Escalate strictness on subsequent attempts
                if attempt == 2:
                    fix_parts.insert(0, 
                        "SECOND ATTEMPT - BE MORE CAREFUL: The previous image had errors. "
                        "Pay extra attention to the following corrections:"
                    )
                elif attempt >= 3:
                    fix_parts.insert(0,
                        "FINAL ATTEMPT - MAXIMUM PRECISION REQUIRED: Multiple attempts have failed. "
                        "This is the last chance. Follow these corrections EXACTLY:"
                    )
                
                if fix_parts:
                    # Join all fix parts with clear separation
                    comprehensive_fix = " ".join(fix_parts)
                    print(f"      → Applying targeted fixes:")
                    for i, part in enumerate(fix_parts, 1):
                        print(f"         {i}. {part[:80]}...")
                    
                    # Append to base prompt with emphasis
                    current_prompt = base_prompt + "\n\nCRITICAL CORRECTIONS: " + comprehensive_fix
                else:
                    print(f"      → No specific fixes available; retrying with same prompt")
                    current_prompt = base_prompt
            else:
                print(f"      ⚠️  Max attempts reached, will use best attempt")

        # After attempts, accept best attempt (even if below threshold)
        if best_image_bytes is None or best_source_url is None:
            raise RuntimeError(f"Panel {idx}: generation failed; no image bytes returned")

        print(f"\n      📦 Using best attempt (score={best_score:.1f})")
        print(f"      → Uploading to storage...")
        image_url = upload_image_and_get_url(
            img_bytes=best_image_bytes,
            chapter_id=chapter_id,
            panel_index=idx,
            fallback_url=best_source_url,
        )
        print(f"      ✓ Uploaded: {image_url[:60]}...")

        create_panel(chapter_id=chapter_id, index=idx, image=image_url)
        print(f"      ✓ Panel {idx} complete!\n")

        panel_index_to_url[idx] = image_url
        previous_panel_image_url = image_url
        if best_review is not None:
            panel_quality[idx] = best_review

    # Update chapter with story script and status
    print(f"\n💾 Step 8: Saving chapter data...")
    # Attach panel_quality into the script for later inspection (optional)
    if panel_quality:
        script["panel_quality"] = panel_quality

    update_chapter(
        chapter_id,
        {
            "chosen_idea_id": chosen_idea_id,
            "story_script": script,
            "status": "ready",
        },
    )
    print(f"✓ Chapter updated to 'ready' status")

    # Build structured payload for frontend
    print(f"\n📦 Step 9: Building response payload...")
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

    result = {
        "chapter_id": chapter_id,
        "chapter_index": chapter["index"],
        "classroom_id": classroom_id,
        "episode_title": script["episode_title"],
        "learning_objectives": script.get("learning_objectives", []),
        "panels": panels_output,
    }
    
    print(f"\n{'='*60}")
    print(f"✅ Comic Generation Complete!")
    print(f"{'='*60}")
    print(f"Episode: {script['episode_title']}")
    print(f"Panels: {len(panels_output)}")
    print(f"{'='*60}\n")
    
    return result


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
    """

    payload = _classroom_context_dict(classroom, students, teacher_outline)
    payload["chosen_idea"] = chosen_idea

    system_prompt = (
        "You write scripts for short educational comics. "
        "Target: kids 6–16, clear and simple language, 8–12 panels per chapter. "
        "Always respond with a single JSON object following the requested schema."
    )

    user_prompt = (
        "Using the given classroom, students, teacher_outline and chosen_idea, write a single comic chapter.\n\n"
                "Constraints:\n"
        "- 8 to 12 panels total.\n"
        "- Panels 1–3: introduce the situation and characters.\n"
        "- Middle panels: show a small challenge or question related to the learning topic.\n"
        "- Final panels: resolve the situation and recap the key learning objective.\n"
        "- Each panel should have at most 1 narration box and at most 2 speech bubbles.\n"
        "- Each narration or dialogue line must be very short (max 10 words).\n"
        "- Each panel should be visually distinct and move the story forward.\n"
        "- Use the students' names in dialogue sometimes to make it personal.\n"
        "- Do NOT have characters speak about themselves in the third person.\n"
        "- Do NOT have a character address themselves by name in their own speech bubble.\n"
        "- Keep dialogue lines short (max 15 words).\n"
        "- Make sure the story helps understand the subject in a concrete way.\n"
        "- The 'speaker' field must always be either a student name from this classroom\n"
        "  or 'Teacher' / 'Narrator'.\n\n"
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

def _panel_text_for_prompt(panel: Dict[str, Any]) -> str:
    """
    Convert narration + dialogue into short, structured lines for FLUX.

    We explicitly tell the model:
    - Which character should have which bubble
    - Where to place the bubble / tail
    """
    lines: List[str] = []

    narration = (panel.get("narration") or "").strip()
    if narration:
        lines.append(
            f'NARRATION_BOX (top of panel, no tail, centered): "{narration}"'
        )

    for line in panel.get("dialogue") or []:
        speaker = (line.get("speaker") or "").strip()
        text = (line.get("text") or "").strip()
        if not text:
            continue

        if speaker:
            # Very explicit: who speaks, where the bubble goes, where the tail points
            lines.append(
                f'SPEECH_BUBBLE for {speaker.upper()} '
                f'(bubble above or beside {speaker.upper()}, tail clearly pointing '
                f'to {speaker.upper()}): "{text}"'
            )
        else:
            lines.append(f'UNASSIGNED_SPEECH_BUBBLE: "{text}"')

    return " | ".join(lines)


def build_flux_prompts_from_script(
    classroom: Dict[str, Any],
    students: List[Dict[str, Any]],
    script: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Build text-to-image prompts for each panel based on the script and classroom style.
    Now also instructs FLUX.2 to render the narration + dialogue text inside the panel.
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

        # Base visual prompt
        # Build the base visual prompt
        prompt = (
            f"A single comic panel {style_phrase}. "
            f"Scene setting: {setting}. "
            f"Visual description: {description}. "
            f"{cast_phrase} "
            "Keep composition readable for text bubbles. "
            "Keep character designs and overall style consistent across panels and "
            "with any reference images provided. "
            "Each speech bubble MUST be attached to the correct speaker: the tail of "
            "the bubble must clearly point to the mouth/head of the character who "
            "is speaking. Do NOT show characters speaking if they have no speech "
            "bubble defined for this panel. Do NOT duplicate or invent extra text."
        )

        if theme_phrase:
            prompt += f"Match the ongoing story theme: {theme_phrase}. "

        # NEW: tell FLUX.2 to render the actual text from this panel
        panel_text = _panel_text_for_prompt(panel)
        if panel_text:
            prompt += (
                "Write the following text clearly inside comic-style speech bubbles "
                "and narration boxes. Use bold, uppercase comic lettering in black "
                "on white bubbles/boxes, with no distortion or extra flourishes. "
                "Do NOT paraphrase or change the wording. Use every line exactly as given. "
                "For each SPEECH_BUBBLE line, place the bubble near the named character "
                "and point the tail directly to that character. For the NARRATION_BOX, "
                "place it at the top of the panel with no tail. Text to write (each '|' "
                "separates a different bubble or box): "
                f"{panel_text} "
            )

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
        "safety_tolerance": 4,
        # You can uncomment this if you've found prompt_upsampling hurts text:
        # "prompt_upsampling": False,
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

    print(f"         → Request submitted, polling for result...")
    start = time.time()
    poll_count = 0
    
    while True:
        if time.time() - start > timeout_seconds:
            raise TimeoutError("Timed out while polling FLUX generation result")

        time.sleep(poll_interval)
        poll_count += 1

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
        
        if poll_count % 5 == 0:  # Print every 5 polls
            elapsed = time.time() - start
            print(f"         → Still generating... ({elapsed:.1f}s elapsed, status: {status})")
        
        if status == "Ready":
            elapsed = time.time() - start
            print(f"         → Generation complete! ({elapsed:.1f}s)")
            
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
    Uses unique UUID for each image to prevent overwriting on regeneration.
    Otherwise, fall back to the original FLUX delivery URL (short-lived, not ideal for production).
    """

    if not SUPABASE_IMAGES_BUCKET:
        return fallback_url

    image_id = str(uuid.uuid4())
    path = f"chapters/{chapter_id}/panel_{panel_index:02d}_{image_id}.png"

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
