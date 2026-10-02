import json
import os
import requests

from ai.retry_utils import call_with_retry


TAVILY_API_URL = "https://api.tavily.com/search"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def generate_interview_questions(
    resume_text: str,
    job_description: str,
):
    tavily_key = os.getenv("TAVILY_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    if not tavily_key:
        raise ValueError(
            "TAVILY_API_KEY is not configured."
        )

    if not openrouter_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not configured."
        )

    search_query = """
    AI Engineer interview questions Python FastAPI
    machine learning LLM RAG LangChain Generative AI
    embeddings vector databases SQL
    """

    def make_search_request():
        search_response = requests.post(
            TAVILY_API_URL,
            headers={
                "Content-Type": "application/json",
            },
            json={
                "api_key": tavily_key,
                "query": search_query,
                "search_depth": "advanced",
                "max_results": 5,
                "include_answer": True,
            },
            timeout=60,
        )

        search_response.raise_for_status()
        return search_response

    try:
        search_response = call_with_retry(make_search_request, max_attempts=3)
        search_data = search_response.json()
    except Exception as error:
        print(f"Tavily search failed, continuing without research context: {error}")
        search_data = {}

    research_text = "\n\n".join(
        item.get("content", "")
        for item in search_data.get("results", [])
        if item.get("content")
    )

    prompt = f"""
You are an expert technical interviewer.

Create interview questions and accurate answers
specifically for the target AI Engineer role.

Use the candidate resume, job description, and
interview research.

IMPORTANT RULES:

1. Return ONLY questions and answers.
2. Do not include introductions, summaries, tips,
   recommendations, sources, or concluding text.
3. Every question must have a clear and accurate answer.
4. Keep answers concise but technically correct.
5. Prefer practical interview questions over trivia.
6. Cover relevant topics such as:
   Python, NumPy, Pandas, machine learning,
   model evaluation, FastAPI, REST APIs, LLMs,
   Generative AI, LangChain, RAG, embeddings,
   vector databases, SQL, and Git/GitHub.
7. Include questions that are relevant to the
   candidate's resume and the job description.
8. Do not claim that the candidate has a skill
   that is not supported by the resume.
9. Technologies missing from the resume may still
   be asked because they appear in the job description,
   but the answer must remain technically accurate.
10. Do not invent company-specific information.
11. Do not include URLs.
12. Generate approximately 15-20 questions.
13. Return ONLY valid JSON.

Required JSON format:

{{
  "questions": [
    {{
      "question": "Question text",
      "answer": "Accurate answer"
    }}
  ]
}}

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

INTERVIEW RESEARCH:
{research_text}
"""

    def make_completion_request():
        response = requests.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {openrouter_key}",
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
                "temperature": 0.2,
            },
            timeout=120,
        )

        response.raise_for_status()
        return response

    response = call_with_retry(make_completion_request, max_attempts=3)

    data = response.json()

    content = data["choices"][0]["message"]["content"].strip()

    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    result = json.loads(content)

    questions = result.get("questions", [])

    if not questions:
        raise ValueError(
            "No interview questions were generated."
        )

    return {
        "questions": questions
    }