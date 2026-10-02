const API_BASE_URL = "http://127.0.0.1:8000";

export async function parseResume(resume, jobDescription) {
  const formData = new FormData();

  formData.append("resume", resume);
  formData.append("job_description", jobDescription);

  const response = await fetch(
    `${API_BASE_URL}/parse-resume`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to process the resume.");
  }

  return response.json();
}

export async function analyzeMatch(
  resumeText,
  jobDescription
) {
  const formData = new FormData();

  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);

  const response = await fetch(
    `${API_BASE_URL}/analyze-match`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to analyze resume match.");
  }

  return response.json();
}

export async function analyzeSkillGap(
  resumeText,
  jobDescription
) {
  const formData = new FormData();

  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);

  const response = await fetch(
    `${API_BASE_URL}/skill-gap`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to analyze skill gap.");
  }

  return response.json();
}

export async function generateTailoredResume(
  resume,
  resumeText,
  jobDescription,
  matchAnalysis
) {
  const formData = new FormData();

  formData.append("resume", resume);
  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);
  formData.append(
    "match_analysis",
    JSON.stringify(matchAnalysis)
  );

  const response = await fetch(
    `${API_BASE_URL}/tailored-resume`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate tailored resume.");
  }

  const atsScoreHeader = response.headers.get("X-Ats-Score");
  const atsScore = atsScoreHeader ? Number(atsScoreHeader) : null;

  const blob = await response.blob();

  return { blob, atsScore };
}

export async function generateCoverLetter(resumeText, jobDescription) {
  const formData = new FormData();

  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE_URL}/cover-letter`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to generate cover letter.");
  }

  return response.json();
}



export async function generateInterviewPrep(resumeText, jobDescription) {
  const formData = new FormData();

  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE_URL}/interview-prep`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to generate interview preparation.");
  }

  return response.json();
}