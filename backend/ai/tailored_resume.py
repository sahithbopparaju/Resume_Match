import os
import json

from google import genai

from ai.groq_match import calculate_keyword_score
from ai.retry_utils import call_with_retry
from ai.resume_renderer import ResumeCanvas, MUTED_COLOR


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


def generate_tailored_resume(
    resume_text,
    job_description,
    match_analysis,
    feedback=None,
):
    """
    Ask Gemini to extract the candidate's resume into a structured,
    tailored representation: factual sections (contact, education,
    certifications) are copied verbatim, while summary/skills/
    experience/projects are rewritten to better match the job
    description using only truthful, already-supported information.

    This structured JSON is rendered into a fresh PDF by
    render_tailored_resume_pdf() instead of being redacted/patched
    into the original PDF's fixed layout, so optimized (often shorter)
    content never leaves leftover blank space.
    """
    client = genai.Client(
        api_key=os.getenv("GEMINI_API_KEY")
    )

    feedback_block = f"""
==================================================

PREVIOUS ATTEMPT FEEDBACK (MUST ADDRESS)

Your previous attempt did not score high enough on the deterministic
ATS matcher. Fix these specific gaps in this attempt, truthfully:

{feedback}
""" if feedback else ""

    prompt = f"""
You are an expert ATS resume optimizer, technical recruiter,
and professional resume writer.

Read the candidate's ORIGINAL RESUME and extract it into the
structured JSON format defined below, tailoring it for the target
JOB DESCRIPTION. The candidate's resume must remain 100% truthful.

================ ORIGINAL RESUME ================

{resume_text}

================ JOB DESCRIPTION ================

{job_description}

================ ATS MATCH ANALYSIS ================

{json.dumps(match_analysis, indent=2)}

==================================================

TRUTHFULNESS RULES

NEVER invent skills, technologies, experience, projects,
certifications, education, job titles, responsibilities,
achievements, metrics, companies, or dates.

You MAY rewrite existing information, improve wording, reorder
existing content, and use terminology from the JD when the original
resume already supports that terminology.

Example:
Original: "Built applications using Python."
JD: "Build AI applications using Python."
Allowed: "Built AI applications using Python."

If the original resume contains no evidence of a JD requirement,
do not claim it. List genuinely missing requirements in
"ats_optimization.missing_keywords" instead.

==================================================

FACTUAL SECTIONS — COPY EXACTLY, DO NOT REWRITE

"contact", "education", and "certifications" are factual records.
Copy them from the original resume EXACTLY as written (same wording,
names, dates, institutions) — do not rephrase, embellish, reorder, or
drop any of them.

==================================================

OPTIMIZED SECTIONS — REWRITE TRUTHFULLY FOR THE JD

- "summary": 2-4 sentences, rewritten to target the job. Open with a
  role title/framing that mirrors the JD's own job title when the
  resume truthfully supports it (e.g. if the JD is for an "AI
  Engineer" and the candidate's real background matches, open with
  "AI Engineer..." rather than a generic title). Use only facts from
  the original resume. If the original resume has no summary, create
  a concise one from the resume's real content.
- "skills": reorganize the EXISTING technical skills into clear
  categories (e.g. Programming, AI & Generative AI, Data Libraries,
  Databases & Tools). Keep every skill that is actually present in
  the original resume. Do not add any technology merely because it
  appears in the JD unless the original resume already supports it.
  ORDER the categories so the ones most relevant to the JD come
  FIRST — a recruiter and an ATS both weight what they see earliest.
- "experience" (if present in the original resume): rewrite bullets
  to emphasize JD-relevant, truthful work. Do not invent an experience
  section if the original resume has none. ORDER experience entries
  with the most JD-relevant role first, unless that would misrepresent
  the candidate's career chronology (prefer chronological order for
  experience; use relevance ordering only among equally-recent roles).
- "projects": KEEP EVERY PROJECT from the original resume — projects
  must never be dropped. Rewrite bullets to emphasize truthful,
  JD-relevant details using JD terminology where genuinely supported.
  Keep the original project titles and technologies. ORDER projects
  so the one most relevant to this specific JD appears FIRST,
  regardless of its original order in the resume.
- "other_sections": anything else worth keeping that doesn't fit the
  categories above (e.g. languages, awards, publications).

==================================================

ATS KEYWORD MATCHING (CRITICAL)

The final resume is scored by a deterministic ATS keyword matcher, not
a human reader. The score is based on EXACT keyword/phrase matches
against the job description, so wording choices matter a lot:

- If a tool, skill, or technology from the ORIGINAL resume is already
  genuinely present (e.g. "Scikit-learn", "Python", "SQL", "AWS"),
  NEVER paraphrase it away, rename it, or fold it into a vaguer phrase
  (e.g. do not turn "Scikit-learn" into "ML libraries"). Keep the exact
  original spelling of every supported skill/tool somewhere in the
  optimized text.
- When the job description uses specific terminology (e.g. "REST API",
  "CI/CD", "vector database") and the candidate's original resume
  truthfully supports the underlying concept, use that exact JD
  phrasing instead of a loose paraphrase.
- Reuse the JD's own wording for responsibilities/action verbs (build,
  develop, implement, integrate, deploy, optimize, pipeline,
  production, etc.) wherever the resume truthfully already describes
  that kind of work, instead of substituting synonyms.
- Maximize legitimate overlap with the job description's vocabulary.
  Never invent a tool/skill to raise the score — only reuse exact
  terminology for things the candidate's original resume already
  supports.
{feedback_block}
==================================================

LAYOUT

This resume will be rendered as a clean, single-column, one-page (or
two if genuinely needed) professional document. Keep bullets concise
(ideally one line, at most two) so the final layout stays compact —
do not write long paragraphs as bullets.

==================================================

OUTPUT

Return ONLY valid JSON. Use exactly this structure (omit a section's
objects entirely, as an empty array, if the original resume has none
of that section — e.g. "experience": [] when there is no work history):

{{
  "contact": {{
    "name": "Exact full name from the original resume",
    "details": "Exact contact line from the original resume (phone, email, links), copied verbatim"
  }},
  "summary": "Rewritten professional summary",
  "education": [
    {{"degree": "", "institution": "", "year": ""}}
  ],
  "skills": [
    {{"category": "", "items": ""}}
  ],
  "experience": [
    {{"title": "", "company": "", "dates": "", "bullets": [""]}}
  ],
  "projects": [
    {{"title": "", "technologies": "", "bullets": [""]}}
  ],
  "certifications": [""],
  "other_sections": [
    {{"title": "", "items": [""]}}
  ],
  "ats_optimization": {{
    "important_jd_keywords": [],
    "supported_keywords": [],
    "indirectly_supported_keywords": [],
    "missing_keywords": []
  }}
}}

Return valid JSON only, no markdown, no explanations outside the JSON.
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

            print(f"Tailored resume generated using: {model_name}")
            break

        except Exception as error:
            last_error = error
            response = None
            print(f"Model {model_name} failed: {error}")

    if response is None:
        raise last_error or RuntimeError(
            "All Gemini models failed to generate a tailored resume."
        )

    text = clean_json_response(response.text)

    try:
        return json.loads(text)

    except json.JSONDecodeError as error:
        print("Gemini returned invalid JSON.")
        print(f"Gemini response: {text}")

        raise ValueError(
            "Gemini returned invalid JSON for tailored resume."
        ) from error


def build_tailored_text(tailored_resume):
    """
    Flatten the structured tailored resume into plain text so it can
    be scored by the same deterministic ATS matcher used elsewhere —
    this is an exact preview of what the rendered PDF will contain.
    """
    parts = []

    contact = tailored_resume.get("contact") or {}
    parts.append(contact.get("name") or "")
    parts.append(contact.get("details") or "")

    parts.append(tailored_resume.get("summary") or "")

    for entry in tailored_resume.get("education") or []:
        parts.append(entry.get("degree") or "")
        parts.append(entry.get("institution") or "")

    for group in tailored_resume.get("skills") or []:
        parts.append(group.get("category") or "")
        parts.append(group.get("items") or "")

    for item in tailored_resume.get("experience") or []:
        parts.append(item.get("title") or "")
        parts.append(item.get("company") or "")
        parts.extend(item.get("bullets") or [])

    for project in tailored_resume.get("projects") or []:
        parts.append(project.get("title") or "")
        parts.append(project.get("technologies") or "")
        parts.extend(project.get("bullets") or [])

    parts.extend(tailored_resume.get("certifications") or [])

    for section in tailored_resume.get("other_sections") or []:
        parts.append(section.get("title") or "")
        parts.extend(section.get("items") or [])

    return "\n".join(part for part in parts if part)


def build_score_feedback(score_result):
    """
    Turn the deterministic scorer's output into concrete, actionable
    feedback for the next generation attempt.
    """
    missing_skills = score_result.get("missing_skills") or []
    matched_skills = score_result.get("matched_skills") or []

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

    if matched_skills:
        lines.append(
            "- These matched skills must remain present with their exact "
            "spelling in this attempt, do not reword or drop them: "
            + ", ".join(matched_skills)
        )

    lines.append(
        "- Increase reuse of the job description's own terminology and "
        "action verbs in the summary, skills, and bullet text wherever "
        "the original resume truthfully supports that framing."
    )

    return "\n".join(lines)


def generate_tailored_resume_until_target(
    resume_text,
    job_description,
    match_analysis,
    target_score=75,
    max_attempts=3,
):
    """
    Generate a tailored resume plan, score the result with the same
    deterministic ATS matcher used for the overall match score, and
    retry with specific feedback when the score doesn't clear
    target_score — instead of blindly returning the first attempt.

    Keeps the best-scoring attempt across tries (even if none clears
    the target) so a weak original resume never gets replaced with a
    worse one, and truthfulness is never sacrificed to chase a number.
    """
    feedback = None
    best_result = None
    best_score = -1
    best_matched_keywords = []

    for attempt in range(1, max_attempts + 1):
        print(f"Tailored resume attempt {attempt}/{max_attempts}")

        result = generate_tailored_resume(
            resume_text,
            job_description,
            match_analysis,
            feedback=feedback,
        )

        tailored_text = build_tailored_text(result)

        score_result = calculate_keyword_score(
            tailored_text,
            job_description,
        )

        score = score_result["match_score"]
        print(f"Attempt {attempt} achieved ATS score: {score}")

        if score > best_score:
            best_score = score
            best_result = result
            best_matched_keywords = score_result.get("matched_skills") or []

        if score > target_score:
            break

        feedback = build_score_feedback(score_result)

    best_result["achieved_ats_score"] = best_score
    # Exact JD-relevant terms genuinely present in the final text, used
    # to tastefully bold them in bullets so relevance is scannable at a
    # glance — never used to add or invent content.
    best_result["_bold_keywords"] = best_matched_keywords
    return best_result


def render_tailored_resume_pdf(tailored_resume, output_path):
    """
    Render the structured tailored resume into a fresh, clean,
    single-column PDF — flowing content top-to-bottom with exactly
    the vertical space each piece of text needs, so there is never
    leftover blank space between sections or projects.
    """
    canvas = ResumeCanvas()
    bold_keywords = tailored_resume.get("_bold_keywords") or []

    contact = tailored_resume.get("contact") or {}
    name = contact.get("name") or ""
    details = contact.get("details") or ""

    if name:
        canvas.text_line(name, fontsize=16, bold=True, align="center", line_height=19)

    if details:
        canvas.text_line(
            details,
            fontsize=9,
            color=MUTED_COLOR,
            align="center",
            line_height=13,
        )

    canvas.spacer(2)

    summary = tailored_resume.get("summary")
    if summary:
        canvas.heading("Professional Summary")
        canvas.paragraph(summary, fontsize=9)

    education = tailored_resume.get("education") or []
    if education:
        canvas.heading("Education")

        for entry in education:
            degree = entry.get("degree") or ""
            institution = entry.get("institution") or ""
            year = entry.get("year") or ""

            canvas.two_column_line(degree, year, fontsize=9.5)

            if institution:
                canvas.text_line(
                    institution,
                    fontsize=9,
                    color=MUTED_COLOR,
                    line_height=12,
                )

            canvas.spacer(3)

    skills = tailored_resume.get("skills") or []
    if skills:
        canvas.heading("Technical Skills")

        for group in skills:
            category = group.get("category") or ""
            items = group.get("items") or ""
            line = f"{category}: {items}" if category else items
            canvas.paragraph(line, fontsize=9)
            canvas.spacer(1)

    experience = tailored_resume.get("experience") or []
    if experience:
        canvas.heading("Experience")

        for item in experience:
            header_left = " - ".join(
                part for part in [item.get("title") or "", item.get("company") or ""] if part
            )
            canvas.two_column_line(header_left, item.get("dates") or "", fontsize=9.5)

            for bullet in item.get("bullets") or []:
                canvas.bullet(bullet, fontsize=9, keywords=bold_keywords)

            canvas.spacer(4)

    projects = tailored_resume.get("projects") or []
    if projects:
        canvas.heading("Projects")

        for project in projects:
            title = project.get("title") or ""
            technologies = project.get("technologies") or ""

            canvas.text_line(title, fontsize=10, bold=True, line_height=13)

            if technologies:
                canvas.text_line(
                    f"Technologies: {technologies}",
                    fontsize=8.5,
                    color=MUTED_COLOR,
                    line_height=12,
                )

            for bullet in project.get("bullets") or []:
                canvas.bullet(bullet, fontsize=9, keywords=bold_keywords)

            canvas.spacer(4)

    certifications = tailored_resume.get("certifications") or []
    if certifications:
        canvas.heading("Certifications")

        for certification in certifications:
            canvas.bullet(certification, fontsize=9)

    for section in tailored_resume.get("other_sections") or []:
        title = section.get("title") or ""
        items = section.get("items") or []

        if not title and not items:
            continue

        canvas.heading(title or "Additional Information")

        for item in items:
            canvas.bullet(item, fontsize=9)

    canvas.save(output_path)
