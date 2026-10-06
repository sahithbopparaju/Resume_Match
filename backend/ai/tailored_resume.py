import os
import json
import tempfile

from google import genai

from ai.groq_match import calculate_keyword_score
from ai.retry_utils import call_with_retry
from ai.pdf_resume_editor import extract_editable_lines, apply_line_edits
from parsers.resume_parser import extract_text_from_pdf


def clean_json_response(text):
    """Clean Gemini's response before JSON parsing."""
    if not text:
        return ""

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def _extract_text_from_pdf_bytes(pdf_bytes):
    """
    Scores PDF bytes through the exact same extraction path
    (parsers.resume_parser.extract_text_from_pdf, pdfplumber-based) used
    for the user's original upload everywhere else in the app — so a
    tailored PDF is scored the identical way a re-uploaded copy of it
    would be.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(pdf_bytes)
        temp_path = temp_file.name

    try:
        return extract_text_from_pdf(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def request_line_edits(editable_lines, job_description, match_analysis, feedback=None):
    """
    Asks Gemini for small, targeted rewrites of SPECIFIC existing resume
    lines (by index) — never a full resume regeneration. This is what
    lets the original PDF's layout/fonts/structure stay untouched: we
    only ever replace the text of lines Gemini chooses to edit, in place.
    """
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    numbered_lines = "\n".join(
        f"[{line['index']}] {line['text']}"
        for line in editable_lines
        if not line["locked"]
    )

    feedback_block = f"""
==================================================

DETERMINISTIC ATS KEYWORD GAP ANALYSIS (MUST ADDRESS)

The deterministic ATS matcher scored the most recent version of this
resume below the target. Close these specific gaps in the edits you
propose now, truthfully — reuse the JD's own terminology wherever the
original line's real content already supports it, so the maximum
genuine amount of this gap is closed without inventing anything:

{feedback}
""" if feedback else ""

    prompt = f"""
You are an expert ATS resume optimizer and technical recruiter.

Below are the EXISTING lines of a candidate's resume, each tagged with
its original index. You are NOT regenerating the resume — you are
proposing small, targeted rewrites of SOME of these exact lines so the
resume better matches the job description, while the document's layout,
fonts, and structure stay exactly as they are. Every line not mentioned
in your output stays completely unchanged.

================ RESUME LINES (format: [index] text) ================

{numbered_lines}

================ JOB DESCRIPTION ================

{job_description}

================ ATS MATCH ANALYSIS ================

{json.dumps(match_analysis, indent=2)}

==================================================

TRUTHFULNESS RULES

NEVER invent skills, technologies, experience, projects,
certifications, education, job titles, responsibilities, achievements,
metrics, companies, or dates. Only rewrite wording — never add a claim
the original line (or the resume's other lines) doesn't already
support.

You MAY reword a line to use the JD's own terminology when the
original line already describes that same thing.

Example:
Original line: "Built applications using Python."
JD: "Build AI applications using Python."
Allowed rewrite: "Built AI applications using Python."

Do not touch lines that are purely factual records (dates, institution
names, certification titles, job titles/company names as headers) —
only rewrite descriptive/bullet-style lines (summary sentences,
responsibility/achievement bullets, skills lists).

==================================================

LENGTH CONSTRAINT (CRITICAL)

Each replacement line MUST physically fit in the same space as the
original on the page. Never write a replacement that is longer than
the original line's character count — same length or shorter only.
Longer replacements will be rejected automatically.

==================================================

ATS KEYWORD MATCHING

- If a tool, skill, or technology is already genuinely present in a
  line (e.g. "Scikit-learn", "Python", "SQL", "AWS"), never paraphrase
  it away or rename it — keep the exact original spelling somewhere.
- When the JD uses specific terminology (e.g. "REST API", "CI/CD",
  "vector database") and a line already truthfully describes that
  concept, use the JD's exact phrasing instead of a looser paraphrase.
- Reuse the JD's own action verbs (build, develop, implement,
  integrate, deploy, optimize, etc.) wherever a line truthfully already
  describes that kind of work.
- Never invent a tool/skill to raise the score — only reuse exact
  terminology for things a line already genuinely supports.
{feedback_block}
==================================================

OUTPUT

Return ONLY a JSON array of edits, e.g.:
[{{"line_index": 12, "new_text": "Rewritten line text"}}]

Omit any line index you are not changing. Return [] if no genuine,
truthful improvement is possible. No markdown, no commentary outside
the JSON array.
"""

    models_to_try = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
    ]

    response = None
    last_error = None

    for model_name in models_to_try:
        try:
            print(f"Trying tailored resume model: {model_name}")

            response = call_with_retry(
                lambda: client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                ),
                max_attempts=2,
            )

            if not getattr(response, "text", None):
                raise ValueError(f"{model_name} returned an empty response.")

            print(f"Tailored resume edits generated using: {model_name}")
            break

        except Exception as error:
            last_error = error
            response = None
            print(f"Model {model_name} failed: {error}")

    if response is None:
        raise last_error or RuntimeError(
            "All Gemini models failed to generate tailored resume edits."
        )

    text = clean_json_response(response.text)

    try:
        edits = json.loads(text)
    except json.JSONDecodeError as error:
        print("Gemini returned invalid JSON.")
        print(f"Gemini response: {text}")

        raise ValueError(
            "Gemini returned invalid JSON for tailored resume edits."
        ) from error

    if not isinstance(edits, list):
        raise ValueError("Gemini's tailored resume edits were not a JSON array.")

    return edits


def build_score_feedback(score_result):
    """
    Turn the deterministic scorer's output into concrete, actionable
    feedback for the next generation attempt.
    """
    missing_skills = score_result.get("missing_skills") or []
    matched_skills = score_result.get("matched_skills") or []
    missing_preferred_skills = score_result.get("missing_preferred_skills") or []
    missing_relevance_keywords = score_result.get("missing_relevance_keywords") or []

    lines = [
        f"- Current deterministic ATS score: {score_result.get('match_score')}/100.",
    ]

    if missing_skills:
        lines.append(
            "- These JD-required skills/keywords are still not detected in "
            "the tailored text (exact wording matters): "
            + ", ".join(missing_skills)
            + ". If the ORIGINAL resume truthfully supports any of these "
            "(even indirectly, e.g. equivalent prior work), use the exact "
            "term somewhere in the optimized text. If the candidate has no "
            "real evidence of a skill, leave it out — do not fabricate it."
        )

    if missing_preferred_skills:
        lines.append(
            "- These preferred/bonus JD skills are also not detected: "
            + ", ".join(missing_preferred_skills)
            + ". Include them too, but only where the original resume "
            "truthfully supports them."
        )

    if matched_skills:
        lines.append(
            "- These matched skills must remain present with their exact "
            "spelling in this attempt, do not reword or drop them: "
            + ", ".join(matched_skills)
        )

    if missing_relevance_keywords:
        lines.append(
            "- The job description also uses this exact vocabulary, which "
            "is not yet reflected anywhere in the tailored text: "
            + ", ".join(missing_relevance_keywords)
            + ". Wherever the original resume's real experience genuinely "
            "supports one of these terms (even as a close rewording of "
            "something already there), use the JD's exact word instead of "
            "a synonym. Never add a term the resume gives no real support "
            "for."
        )

    lines.append(
        "- Increase reuse of the job description's own terminology and "
        "action verbs in the summary, skills, and bullet text wherever "
        "the original resume truthfully supports that framing."
    )

    return "\n".join(lines)


def generate_tailored_resume_until_target(
    original_pdf_path,
    job_description,
    match_analysis,
    target_score=75,
    max_attempts=5,
):
    """
    Edits the ORIGINAL uploaded PDF in place (same fonts, layout, page
    count — only individual lines' text is replaced), re-scores the
    result with the same deterministic ATS matcher used elsewhere,
    against the same job_description, and retries with specific feedback
    when the score doesn't clear target_score.

    Never returns a "tailored" PDF scoring below target_score: if no
    attempt truthfully clears it, the ORIGINAL file is returned instead,
    with its own honest score — truthfulness is never sacrificed to
    chase a number.
    """
    original_text = extract_text_from_pdf(original_pdf_path)
    original_score_result = calculate_keyword_score(original_text, job_description)

    editable_lines = extract_editable_lines(original_pdf_path)
    feedback = build_score_feedback(original_score_result)

    best_pdf_bytes = None
    best_score = -1

    for attempt in range(1, max_attempts + 1):
        print(f"Tailored resume attempt {attempt}/{max_attempts}")

        edits = request_line_edits(
            editable_lines,
            job_description,
            match_analysis,
            feedback=feedback,
        )

        pdf_bytes, applied_count = apply_line_edits(
            original_pdf_path,
            editable_lines,
            edits,
        )

        tailored_text = _extract_text_from_pdf_bytes(pdf_bytes)
        score_result = calculate_keyword_score(tailored_text, job_description)
        score = score_result["match_score"]

        print(
            f"Attempt {attempt}: applied {applied_count}/{len(edits)} "
            f"proposed edits, ATS score {score}"
        )

        if score > best_score:
            best_score = score
            best_pdf_bytes = pdf_bytes

        if score >= target_score:
            return {
                "pdf_bytes": pdf_bytes,
                "achieved_ats_score": score,
                "tailored": True,
            }

        feedback = build_score_feedback(score_result)

    # Could not truthfully reach the target in max_attempts — return the
    # ORIGINAL resume with its own honest score rather than a
    # lower-scoring "tailored" result.
    with open(original_pdf_path, "rb") as original_file:
        original_pdf_bytes = original_file.read()

    print(
        f"Could not reach target score {target_score} truthfully "
        f"(best attempt: {best_score}). Returning the original resume."
    )

    return {
        "pdf_bytes": original_pdf_bytes,
        "achieved_ats_score": original_score_result["match_score"],
        "tailored": False,
    }
