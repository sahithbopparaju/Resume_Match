import json
import os
import re
from collections import Counter

from groq import Groq

from ai.retry_utils import call_with_retry


# ---------------------------------------------------------
# Deterministic ATS keyword normalization
# ---------------------------------------------------------

SKILL_ALIASES = {
    # --- Languages ---
    "python": ["python"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "c": ["c programming"],
    "c#": ["c#", "csharp"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "r": ["r programming", "r language"],
    "go": ["golang"],
    "scala": ["scala"],
    "bash": ["bash", "shell scripting", "shell script"],

    # --- Web / full-stack ---
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "react": ["react", "react.js", "reactjs"],
    "node.js": ["node.js", "node js", "nodejs"],
    "express": ["express.js", "express js", "expressjs"],
    "django": ["django"],
    "flask": ["flask"],
    "spring boot": ["spring boot", "spring framework"],
    "rest api": ["rest api", "restful api", "rest apis", "restful apis"],
    "graphql": ["graphql"],
    "api development": ["api development", "api design"],

    # --- Data / databases ---
    "sql": ["sql"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql", "postgres"],
    "mongodb": ["mongodb", "mongo db"],
    "redis": ["redis"],
    "elasticsearch": ["elasticsearch"],
    "data structures": ["data structures"],
    "algorithms": ["algorithms"],
    "oop": ["oop", "object oriented programming", "object-oriented programming"],

    # --- Cloud / devops ---
    "git": ["git"],
    "github": ["github"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure"],
    "gcp": ["gcp", "google cloud"],
    "ci/cd": ["ci/cd", "ci cd", "continuous integration", "continuous deployment"],
    "jenkins": ["jenkins"],
    "linux": ["linux", "unix"],
    "terraform": ["terraform"],

    # --- Testing / methodology ---
    "unit testing": ["unit testing", "unit tests"],
    "agile": ["agile"],
    "scrum": ["scrum"],
    "jira": ["jira"],
    "debugging": ["debugging"],

    # --- Data science / ML / AI ---
    "numpy": ["numpy"],
    "pandas": ["pandas"],
    "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"],
    "computer vision": ["computer vision", "cv", "opencv"],
    "fastapi": ["fastapi"],
    "llm": ["llm", "llms", "large language model", "large language models"],
    "generative ai": ["generative ai", "genai"],
    "prompt engineering": ["prompt engineering"],
    "langchain": ["langchain"],
    "rag": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "agentic ai": ["agentic ai", "agentic"],
    "mcp": ["mcp", "model context protocol"],
    "embeddings": ["embedding", "embeddings", "embedding models"],
    "vector database": [
        "vector database",
        "vector databases",
        "vector db",
        "vector store",
    ],
    "faiss": ["faiss"],
    "hugging face": ["hugging face", "huggingface"],
    "transformers": ["transformers", "transformer models"],
    "groq": ["groq"],
    "gemini": ["gemini"],
    "openai": ["openai"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
    "keras": ["keras"],
    "matplotlib": ["matplotlib"],
    "seaborn": ["seaborn"],
    "data analysis": ["data analysis"],
    "data visualization": ["data visualization"],
    "etl": ["etl", "data pipeline", "data pipelines"],

    # --- BI / productivity tools ---
    "power bi": ["power bi"],
    "excel": ["excel"],
    "dax": ["dax"],
    "tableau": ["tableau"],
    "streamlit": ["streamlit"],
}


def normalize_text(text):
    """Normalize text for deterministic matching."""
    text = text.lower()

    # Normalize common punctuation/spacing.
    text = text.replace("–", "-")
    text = text.replace("—", "-")
    text = text.replace("/", " ")
    text = text.replace("_", " ")

    text = re.sub(r"[^a-z0-9+#.\-\s]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def contains_skill(text, aliases):
    """Check whether a skill/keyword occurs in normalized text."""
    normalized = normalize_text(text)

    for alias in aliases:
        alias_normalized = normalize_text(alias)

        # Word-boundary matching prevents false matches such as
        # "git" inside "digital".
        pattern = r"(?<![a-z0-9])" + re.escape(alias_normalized) + r"(?![a-z0-9])"

        if re.search(pattern, normalized):
            return True

    return False


def extract_matching_skills(resume_text, job_description):
    """
    Deterministically identify known skills appearing in the JD
    and whether they appear in the resume.
    """
    jd_skills = []
    matched_skills = []
    missing_skills = []

    for skill, aliases in SKILL_ALIASES.items():
        if contains_skill(job_description, aliases):
            jd_skills.append(skill)

            if contains_skill(resume_text, aliases):
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

    return jd_skills, matched_skills, missing_skills


def extract_preferred_section(job_description):
    """
    Deterministically detect the preferred/bonus portion of a JD.
    """
    normalized = job_description.lower()

    preferred_markers = [
        "preferred",
        "nice to have",
        "nice-to-have",
        "bonus",
        "preferred qualifications",
        "additional qualifications",
    ]

    positions = []

    for marker in preferred_markers:
        position = normalized.find(marker)
        if position != -1:
            positions.append(position)

    if not positions:
        return ""

    start = min(positions)

    # Limit the preferred section so unrelated text does not get included.
    return job_description[start:start + 3000]


def extract_required_section(job_description):
    """
    Deterministically extract the main JD content excluding
    an explicitly detected preferred section.
    """
    preferred = extract_preferred_section(job_description)

    if not preferred:
        return job_description

    preferred_start = job_description.lower().find(preferred.lower())

    if preferred_start == -1:
        return job_description

    return job_description[:preferred_start]


def calculate_keyword_score(resume_text, job_description):
    """
    Fully deterministic ATS scoring.

    Weighting:
      60% required skill coverage
      20% requirement/responsibility keyword coverage
      10% preferred skill coverage
      10% overall keyword relevance
    """

    resume_normalized = normalize_text(resume_text)
    jd_normalized = normalize_text(job_description)

    # -----------------------------------------------------
    # 1. Required skill coverage — 60%
    # -----------------------------------------------------

    required_section = extract_required_section(job_description)

    required_jd_skills, matched_required_skills, _ = (
        extract_matching_skills(resume_text, required_section)
    )

    if required_jd_skills:
        required_coverage = (
            len(matched_required_skills) / len(required_jd_skills)
        )
    else:
        required_coverage = 1.0

    required_score = required_coverage * 60

    # -----------------------------------------------------
    # 2. Responsibilities / technical relevance — 20%
    # -----------------------------------------------------

    # Important deterministic technical/action terms.
    requirement_terms = [
        "develop",
        "build",
        "integrate",
        "implement",
        "deploy",
        "evaluate",
        "optimize",
        "pipeline",
        "production",
        "api",
        "model",
        "models",
        "data",
        "database",
        "embedding",
        "testing",
        "scalable",
        "accuracy",
        "performance",
        "design",
        "architecture",
        "collaborate",
        "collaboration",
        "maintain",
        "automation",
        "automate",
        "monitoring",
        "debug",
        "debugging",
        "troubleshoot",
        "analyze",
        "analysis",
        "research",
        "scale",
        "security",
        "documentation",
    ]

    jd_term_counts = Counter(
        term
        for term in requirement_terms
        if re.search(
            r"(?<![a-z0-9])" + re.escape(term) + r"(?![a-z0-9])",
            jd_normalized,
        )
    )

    matched_requirement_terms = sum(
        1
        for term in jd_term_counts
        if re.search(
            r"(?<![a-z0-9])" + re.escape(term) + r"(?![a-z0-9])",
            resume_normalized,
        )
    )

    total_requirement_terms = len(jd_term_counts)

    if total_requirement_terms:
        requirement_coverage = (
            matched_requirement_terms / total_requirement_terms
        )
    else:
        requirement_coverage = 1.0

    requirement_score = requirement_coverage * 20

    # -----------------------------------------------------
    # 3. Preferred skills — 10%
    # -----------------------------------------------------

    preferred_section = extract_preferred_section(job_description)

    if preferred_section:
        preferred_jd_skills, matched_preferred_skills, _ = (
            extract_matching_skills(resume_text, preferred_section)
        )

        if preferred_jd_skills:
            preferred_coverage = (
                len(matched_preferred_skills)
                / len(preferred_jd_skills)
            )
        else:
            preferred_coverage = 1.0
    else:
        preferred_coverage = 1.0

    preferred_score = preferred_coverage * 10

    # -----------------------------------------------------
    # 4. Overall keyword relevance — 10%
    # -----------------------------------------------------

    # Remove very common English words and generic job-posting
    # boilerplate that no resume could ever be expected to echo —
    # otherwise this component unfairly penalizes genuinely
    # well-tailored resumes for not repeating filler text.
    stop_words = {
        "the", "and", "for", "with", "that", "this", "from",
        "are", "you", "your", "our", "will", "have", "has",
        "into", "using", "use", "work", "working", "role",
        "job", "candidate", "experience", "years", "ability",
        "strong", "good", "knowledge", "skills", "required",
        "preferred", "responsibilities", "requirements",
        "about", "across", "also", "etc", "including", "include",
        "includes", "within", "ensure", "ensuring", "maintain",
        "maintaining", "provide", "providing", "support",
        "supporting", "related", "various", "multiple", "new",
        "existing", "current", "opportunity", "opportunities",
        "company", "team", "teams", "environment", "environments",
        "position", "positions", "apply", "applicant", "applicants",
        "employment", "employer", "equal", "diversity", "inclusion",
        "benefits", "salary", "compensation", "please", "email",
        "resume", "cover", "letter", "contact", "looking", "we're",
        "were", "who", "what", "when", "where", "how", "can",
        "should", "must", "need", "needs", "like", "please",
        "join", "www", "http", "https", "com",
    }

    resume_words = {
        word
        for word in re.findall(r"\b[a-z][a-z0-9+#.-]{2,}\b", resume_normalized)
        if word not in stop_words
    }

    jd_words = {
        word
        for word in re.findall(r"\b[a-z][a-z0-9+#.-]{2,}\b", jd_normalized)
        if word not in stop_words
    }

    if jd_words:
        keyword_overlap = len(resume_words & jd_words) / len(jd_words)
        keyword_overlap = min(keyword_overlap, 1.0)
    else:
        keyword_overlap = 1.0

    relevance_score = keyword_overlap * 10

    # -----------------------------------------------------
    # Final deterministic score
    # -----------------------------------------------------

    final_score = round(
        required_score
        + requirement_score
        + preferred_score
        + relevance_score
    )

    final_score = max(0, min(100, final_score))

    missing_preferred_skills = [
        skill
        for skill in (preferred_jd_skills if preferred_section else [])
        if skill not in (matched_preferred_skills if preferred_section else [])
    ]

    # A sample of significant JD words that never appear in the resume
    # at all, beyond the already-tracked skill/preferred lists — gives
    # the tailoring prompt concrete, genuine terms to truthfully weave
    # in if the candidate's real experience actually supports them.
    missing_relevance_keywords = sorted(jd_words - resume_words)[:25]

    return {
        "match_score": final_score,
        "jd_skills": required_jd_skills,
        "matched_skills": matched_required_skills,
        "missing_skills": [
            skill
            for skill in required_jd_skills
            if skill not in matched_required_skills
        ],
        "missing_preferred_skills": missing_preferred_skills,
        "missing_relevance_keywords": missing_relevance_keywords,
    }


# ---------------------------------------------------------
# Groq — explanation only
# ---------------------------------------------------------

def analyze_resume_match(resume_text, job_description):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    deterministic_result = calculate_keyword_score(
        resume_text,
        job_description,
    )

    prompt = f"""
You are an ATS analysis assistant.

The numeric ATS score has already been calculated by a deterministic
Python scoring system.

You MUST NOT change or calculate the score.

DETERMINISTIC ATS RESULT:
{json.dumps(deterministic_result, indent=2)}

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY valid JSON:

{{
  "strengths": [],
  "missing_skills": [],
  "suggestions": []
}}

Rules:
- Do not invent qualifications, experience, projects, or skills.
- Strengths must be supported by the resume.
- Missing skills must be supported by the job description.
- Suggestions must be realistic and useful.
- Do not provide a match score.
- Do not include markdown.
"""

    try:
        response = call_with_retry(
            lambda: client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=0,
            ),
            max_attempts=3,
        )

        content = response.choices[0].message.content.strip()
    except Exception as error:
        print(f"Groq explanation call failed, using deterministic result only: {error}")

        return {
            "match_score": deterministic_result["match_score"],
            "strengths": [],
            "missing_skills": deterministic_result["missing_skills"],
            "suggestions": [],
        }

    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    try:
        ai_result = json.loads(content)
    except json.JSONDecodeError:
        ai_result = {
            "strengths": [],
            "missing_skills": deterministic_result["missing_skills"],
            "suggestions": [],
        }

    return {
        "match_score": deterministic_result["match_score"],
        "strengths": ai_result.get("strengths", []),
        "missing_skills": deterministic_result["missing_skills"],
        "suggestions": ai_result.get("suggestions", []),
    }