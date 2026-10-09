import logging
import os
import json
import tempfile

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from parsers.resume_parser import extract_text_from_pdf, ResumeParsingError
from ai.groq_match import analyze_resume_match
from ai.gemini_skillgap import analyze_skill_gap
from ai.tailored_resume import generate_tailored_resume_until_target
from ai.openrouter_cover import generate_cover_letter
from ai.tavily_search import generate_interview_questions
from auth.supabase_auth import require_current_user


# Load .env from the backend folder
load_dotenv(
    os.path.join(
        os.path.dirname(__file__),
        ".env",
    )
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


app = FastAPI()


# CORS configuration
#
# CORS_ORIGINS (comma-separated) configures explicit allowed origins, e.g.
# a production frontend domain. Locally, Vite picks the next free port
# (5174, 5175, ...) when 5173 is already taken, so the dev frontend's
# actual origin isn't always 5173 — allow_origin_regex covers any
# localhost/127.0.0.1 port for dev convenience regardless of CORS_ORIGINS.
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Ats-Score"],
)


@app.get("/")
def root():
    return {
        "message": "ResumeMatch API is running"
    }


@app.post("/parse-resume")
async def parse_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    user=Depends(require_current_user),
):
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf",
    ) as temp_file:
        temp_file.write(await resume.read())
        temp_path = temp_file.name

    try:
        text = extract_text_from_pdf(temp_path)

        return {
            "filename": resume.filename,
            "resume_text": text,
        }

    except ResumeParsingError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    except Exception:
        logger.exception("Unexpected error while parsing resume upload.")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while processing your resume. Please try again.",
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/analyze-match")
async def analyze_match(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    user=Depends(require_current_user),
):
    result = analyze_resume_match(
        resume_text,
        job_description,
    )

    return {
        "match_analysis": result,
    }


@app.post("/skill-gap")
async def skill_gap(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    user=Depends(require_current_user),
):
    result = analyze_skill_gap(
        resume_text,
        job_description,
    )

    return {
        "skill_gap": result,
    }


@app.post("/tailored-resume")
async def tailored_resume(
    resume: UploadFile = File(...),
    # No longer used for generation (the original PDF's own text is
    # re-extracted internally for consistency) — accepted for backward
    # compatibility with the existing upload form.
    resume_text: str = Form(...),
    job_description: str = Form(...),
    match_analysis: str = Form(...),
    user=Depends(require_current_user),
):
    original_path = None
    output_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as original_file:
            original_file.write(await resume.read())
            original_path = original_file.name

        match_data = json.loads(match_analysis)

        result = generate_tailored_resume_until_target(
            original_pdf_path=original_path,
            job_description=job_description,
            match_analysis=match_data,
            target_score=75,
        )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix="_tailored.pdf",
        ) as output_file:
            output_file.write(result["pdf_bytes"])
            output_path = output_file.name

        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename="resume.pdf",
            headers={
                "X-Ats-Score": str(result.get("achieved_ats_score", "")),
            },
        )

    except Exception as error:
        print(f"Tailored resume error: {error}")
        raise

    finally:
        if original_path and os.path.exists(original_path):
            os.remove(original_path)


@app.post("/cover-letter")
async def cover_letter(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    user=Depends(require_current_user),
):
    result = generate_cover_letter(
        resume_text,
        job_description,
    )

    return {
        "cover_letter": result
    }


@app.post("/interview-prep")
async def interview_prep(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    user=Depends(require_current_user),
):
    result = generate_interview_questions(
        resume_text,
        job_description,
    )

    return result