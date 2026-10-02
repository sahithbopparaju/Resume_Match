import os
import json
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from parsers.resume_parser import extract_text_from_pdf
from ai.groq_match import analyze_resume_match
from ai.gemini_skillgap import analyze_skill_gap
from ai.tailored_resume import (
    generate_tailored_resume_until_target,
    render_tailored_resume_pdf,
)
from ai.openrouter_cover import generate_cover_letter
from ai.tavily_search import generate_interview_questions


# Load .env from the backend folder
load_dotenv(
    os.path.join(
        os.path.dirname(__file__),
        ".env",
    )
)


app = FastAPI()


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/analyze-match")
async def analyze_match(
    resume_text: str = Form(...),
    job_description: str = Form(...),
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
    # Accepted for backward compatibility with the upload form, but no
    # longer used: the tailored resume is now rendered as a fresh PDF
    # from structured content rather than edited in place.
    resume: UploadFile = File(...),
    resume_text: str = Form(...),
    job_description: str = Form(...),
    match_analysis: str = Form(...),
):
    output_path = None

    try:
        output_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix="_tailored.pdf",
        )
        output_path = output_file.name
        output_file.close()

        match_data = json.loads(match_analysis)

        result = generate_tailored_resume_until_target(
            resume_text=resume_text,
            job_description=job_description,
            match_analysis=match_data,
            target_score=75,
        )

        render_tailored_resume_pdf(result, output_path)

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


@app.post("/cover-letter")
async def cover_letter(
    resume_text: str = Form(...),
    job_description: str = Form(...),
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
):
    result = generate_interview_questions(
        resume_text,
        job_description,
    )

    return result