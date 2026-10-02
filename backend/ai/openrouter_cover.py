import json
import os

import requests

from ai.retry_utils import call_with_retry


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def generate_cover_letter(resume_text: str, job_description: str):
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured.")

    prompt = f"""
You are an expert career assistant.

Generate a professional, concise cover letter based ONLY on the
candidate's resume and the target job description.

IMPORTANT RULES:
- Do not invent skills, experience, education, certifications, companies,
  achievements, or technologies.
- Use only information supported by the resume.
- Clearly connect relevant candidate experience to the job requirements.
- Keep the tone professional and natural.
- Avoid generic filler.
- Do not mention AI, ResumeMatch, ATS, or this prompt.
- Do not use placeholders such as [Company Name] unless the job description
  actually provides the company name.
- Keep the cover letter around 250-350 words.

Return ONLY valid JSON in this exact format:

{{
  "cover_letter": "Complete cover letter text"
}}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

    def make_request():
        response = requests.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-oss-120b",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                "temperature": 0.3,
            },
            timeout=120,
        )

        response.raise_for_status()
        return response

    response = call_with_retry(make_request, max_attempts=3)

    data = response.json()

    content = data["choices"][0]["message"]["content"].strip()

    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    result = json.loads(content)

    if not result.get("cover_letter"):
        raise ValueError("Cover letter generation returned empty content.")

    return result