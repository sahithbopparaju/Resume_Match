import { supabase } from "../supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function authHeaders() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase getSession() failed:", error.message);
  }

  const token = data.session?.access_token;

  if (!token) {
    console.warn(
      "No Supabase session/access_token found when calling the API — " +
      "the request will go out unauthenticated and the backend will " +
      "return 401. This means the user isn't actually logged in on the " +
      "client (or the session expired/was cleared), not a header-" +
      "attachment bug."
    );

    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

export async function requestOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return { message: "Verification code sent." };
}

export async function verifyOtp(email, code) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code.trim(),
    type: "email",
  });

  if (error) {
    throw new Error(error.message);
  }

  return { email: data.user?.email };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

function toUser(session) {
  const user = session?.user;
  return user ? { id: user.id, email: user.email } : null;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return toUser(data.session);
}

export function subscribeToAuthChanges(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    // TEMPORARY DIAGNOSTIC — remove once the auth issue is resolved.
    console.log("AUTH SESSION EXISTS:", Boolean(session));

    callback(toUser(session));
  });

  return () => subscription.unsubscribe();
}

export async function parseResume(resume, jobDescription) {
  const formData = new FormData();

  formData.append("resume", resume);
  formData.append("job_description", jobDescription);

  const response = await fetch(
    `${API_BASE_URL}/parse-resume`,
    {
      method: "POST",
      headers: await authHeaders(),
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
      headers: await authHeaders(),
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
      headers: await authHeaders(),
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
      headers: await authHeaders(),
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
    headers: await authHeaders(),
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
    headers: await authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to generate interview preparation.");
  }

  return response.json();
}
