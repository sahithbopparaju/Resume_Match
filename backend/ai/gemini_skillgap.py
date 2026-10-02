import os
import json
from google import genai

from ai.retry_utils import call_with_retry


def analyze_skill_gap(resume_text, job_description):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = f"""
You are an AI career assistant.

Compare the resume with the job description and identify the skill gaps.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY valid JSON in exactly this structure:

{{
  "missing_skills": [
    {{
      "skill": "Name of the missing skill",
      "priority": "high|medium|low",
      "reason": "One or two sentences explaining why this skill matters for the job and why it appears to be missing from the resume",
      "estimated_time": "Realistic estimate to learn this skill, e.g. '2-3 weeks'",
      "learn_via": [
        {{
          "name": "Name of a specific course, doc, or resource",
          "url": "A real, relevant URL for that resource",
          "type": "course|documentation|tutorial|book|video"
        }}
      ]
    }}
  ],
  "learning_roadmap": []
}}

Rules:
- missing_skills must contain important skills required by the job but not clearly present in the resume.
- Each item in missing_skills MUST be an object with exactly the keys: skill, priority, reason, estimated_time, learn_via.
- priority must be exactly one of "high", "medium", or "low", based on how critical the skill is to the job description.
- learn_via must contain 1-3 realistic learning resources per skill.
- learning_roadmap must contain practical steps to learn the missing skills, ordered logically.
- Do not invent experience or qualifications.
- Keep the roadmap concise and actionable.
- Do not include markdown or explanations outside the JSON.
"""

    models_to_try = ["gemini-3.6-flash", "gemini-3.5-flash-lite"]

    response = None
    last_error = None

    for model_name in models_to_try:
        try:
            response = call_with_retry(
                lambda: client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                ),
                max_attempts=2,
            )

            if not getattr(response, "text", None):
                raise ValueError(f"{model_name} returned an empty response.")

            break

        except Exception as error:
            last_error = error
            response = None
            print(f"Skill gap model {model_name} failed: {error}")

    if response is None:
        raise last_error or RuntimeError(
            "All Gemini models failed to analyze skill gap."
        )

    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)