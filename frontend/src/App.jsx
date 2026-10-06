import { useEffect, useMemo, useState } from "react";
import InterviewPrep from "./components/InterviewPrep";
import History from "./components/History";
import Login from "./components/Login";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Lightbulb,
  LogOut,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  Target,
  WandSparkles,
} from "lucide-react";

import LandingPage from "./components/LandingPage";
import UploadSection from "./components/UploadSection";
import MatchReport from "./components/MatchReport";
import SkillGapReport from "./components/SkillGapReport";

import {
  parseResume,
  analyzeMatch,
  analyzeSkillGap,
  generateTailoredResume,
  generateCoverLetter,
  generateInterviewPrep,
  getCurrentUser,
  subscribeToAuthChanges,
  logout,
} from "./services/api";


function parseData(value) {
  if (!value) return {};

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}


function getScoreLabel(score) {
  if (score >= 80) return "Strong match";
  if (score >= 65) return "Good match";
  if (score >= 50) return "Moderate match";
  return "Needs improvement";
}


function getScoreDescription(score) {
  if (score >= 80) {
    return "Your resume aligns very well with this role.";
  }

  if (score >= 65) {
    return "Your resume has a solid foundation for this role.";
  }

  if (score >= 50) {
    return "You have relevant experience, but some areas need improvement.";
  }

  return "Several important requirements are missing from your resume.";
}


function ScoreRing({ score }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="relative flex size-32 items-center justify-center">
      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-100"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-blue-600 transition-all duration-1000"
        />
      </svg>

      <div className="relative text-center">
        <div className="text-3xl font-bold tracking-tight text-slate-950">
          {score}%
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Match
        </div>
      </div>
    </div>
  );
}


function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className={`flex size-10 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}


function NavigationItem({
  icon: Icon,
  label,
  active,
  onClick,
  locked = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${active
        ? "bg-slate-900 text-white shadow-sm"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        }`}
    >
      <Icon
        className={`size-4 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
          }`}
      />

      <span className="flex-1">{label}</span>

      {locked && <Lock className="size-3.5 opacity-60" />}

      {active && !locked && (
        <ChevronRight className="size-3.5 opacity-60" />
      )}
    </button>
  );
}


function InterviewCard({ item, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
          {String(index + 1).padStart(2, "0")}
        </div>

        <span className="flex-1 text-sm font-semibold leading-6 text-slate-800">
          {item.question}
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 pl-[4.25rem]">
          <p className="text-sm leading-7 text-slate-600">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}


function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("resumematch-theme") === "dark";
  });

  const [activeTab, setActiveTab] = useState("overview");

  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("resumematch-history")) || [];
    } catch {
      return [];
    }
  });

  const [page, setPage] = useState("landing");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysisData, setAnalysisData] = useState(null);

  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState([]);

  const [tailoredResumeLoading, setTailoredResumeLoading] = useState(false);
  const [tailoredResumeError, setTailoredResumeError] = useState("");

  const [skillGapLoading, setSkillGapLoading] = useState(false);

  const [authStatus, setAuthStatus] = useState("checking");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(
      "resumematch-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);


  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setCurrentUser(user);
        setAuthStatus(user ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setCurrentUser(null);
        setAuthStatus("unauthenticated");
      });

    // Keeps state in sync with Supabase's own session (login elsewhere,
    // logout, token refresh/expiry) rather than only checking once.
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (cancelled) return;
      setCurrentUser(user);
      setAuthStatus(user ? "authenticated" : "unauthenticated");
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);


  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    setAuthStatus("authenticated");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      setPage("landing");
      setAnalysisData(null);
    }
  };


  const saveToHistory = (data) => {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      company: data?.company || "",
      role: data?.role || "",
      score: data?.matchAnalysis?.score || 0,
      result: data,
    };

    setHistory((previous) => {
      const updated = [entry, ...previous];
      localStorage.setItem("resumematch-history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteHistory = (id) => {
    setHistory((previous) => {
      const updated = previous.filter((item) => item.id !== id);
      localStorage.setItem("resumematch-history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem("resumematch-history");
    setHistory([]);
  };

  const handleSelectHistory = (item) => {
    setAnalysisData(item.result);
    setPage("analysis");
  };


  const handleStart = () => {
    setError("");
    setPage("upload");
  };


  const handleSubmit = async (resume, jobDescription) => {
    setLoading(true);
    setError("");

    try {
      // 1. Extract resume text
      const parsedData = await parseResume(
        resume,
        jobDescription
      );

      // 2. Calculate ATS match — this is the fast, required result. Show
      // it immediately instead of making the user wait for skill-gap and
      // tailored-resume generation (which call slower AI models, the
      // latter with its own multi-attempt retry loop) before they see
      // anything at all.
      const matchData = await analyzeMatch(
        parsedData.resume_text,
        jobDescription
      );

      setAnalysisData({
        resume,
        jobDescription,
        resumeText: parsedData.resume_text,
        filename: parsedData.filename,
        matchAnalysis: matchData.match_analysis,
        skillGap: null,
        tailoredResumeUrl: null,
        tailoredResumeAtsScore: null,
      });

      setCoverLetter("");
      setInterviewQuestions([]);
      setCopied(false);
      setActiveTab("overview");
      setPage("analysis");
      setLoading(false);

      // 3 & 4. Skill gap and tailored-resume generation don't depend on
      // each other, only on the match analysis above, so run them in
      // parallel in the background now that the score is already on
      // screen — each fills in its own section of the dashboard (which
      // already has its own loading state) as soon as it resolves.
      setSkillGapLoading(true);
      setTailoredResumeError("");
      setTailoredResumeLoading(true);

      const skillGapPromise = analyzeSkillGap(
        parsedData.resume_text,
        jobDescription
      )
        .then((skillGapData) => {
          setAnalysisData((previous) =>
            previous && { ...previous, skillGap: skillGapData.skill_gap }
          );

          return skillGapData.skill_gap;
        })
        .catch((skillGapErr) => {
          // A failed skill-gap call must not discard the match score
          // that's already showing, or block the tailored resume below.
          console.error(skillGapErr);
          return null;
        })
        .finally(() => setSkillGapLoading(false));

      const tailoredResumePromise = generateTailoredResume(
        resume,
        parsedData.resume_text,
        jobDescription,
        matchData.match_analysis
      )
        .then(({ blob, atsScore }) => {
          const tailoredResumeUrl = URL.createObjectURL(blob);

          setAnalysisData((previous) =>
            previous && {
              ...previous,
              tailoredResumeUrl,
              tailoredResumeAtsScore: atsScore,
            }
          );

          return { tailoredResumeUrl, tailoredResumeAtsScore: atsScore };
        })
        .catch((tailoredResumeErr) => {
          // A failed tailored resume should not discard the match score
          // and skill gap results that already succeeded.
          console.error(tailoredResumeErr);

          setTailoredResumeError(
            tailoredResumeErr?.message ||
            "Unable to generate the tailored resume."
          );

          return null;
        })
        .finally(() => setTailoredResumeLoading(false));

      const [skillGap, tailoredResume] = await Promise.all([
        skillGapPromise,
        tailoredResumePromise,
      ]);

      // 6. Save history once the full bundle has settled, same shape as
      // before — only when it's saved has moved, not what's saved.
      saveToHistory({
        resume,
        jobDescription,
        resumeText: parsedData.resume_text,
        filename: parsedData.filename,
        matchAnalysis: matchData.match_analysis,
        skillGap,
        tailoredResumeUrl: tailoredResume?.tailoredResumeUrl ?? null,
        tailoredResumeAtsScore: tailoredResume?.tailoredResumeAtsScore ?? null,
      });

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
        "Something went wrong while analyzing your resume. Please try again."
      );
      setLoading(false);
    }
  };


  const matchData = useMemo(
    () => parseData(analysisData?.matchAnalysis),
    [analysisData]
  );

  const skillGapData = useMemo(
    () => parseData(analysisData?.skillGap),
    [analysisData]
  );


  const score = Number(
    matchData.score ??
    matchData.match_score ??
    0
  );

  const strengths = Array.isArray(matchData.strengths)
    ? matchData.strengths
    : Array.isArray(matchData.positives)
      ? matchData.positives
      : [];

  const missingSkills = Array.isArray(
    matchData.missing_skills
  )
    ? matchData.missing_skills
    : Array.isArray(skillGapData.missing_skills)
      ? skillGapData.missing_skills
      : [];

  const suggestions = Array.isArray(matchData.suggestions)
    ? matchData.suggestions
    : [];


  const handleDownloadResume = () => {
    if (!analysisData?.tailoredResumeUrl) return;

    const link = document.createElement("a");

    link.href = analysisData.tailoredResumeUrl;
    link.download = "tailored-resume.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };


  const handleGenerateTailoredResume = async () => {
    if (!analysisData?.resume) return;

    setTailoredResumeLoading(true);
    setTailoredResumeError("");

    try {
      const { blob: tailoredResumeBlob, atsScore } = await generateTailoredResume(
        analysisData.resume,
        analysisData.resumeText,
        analysisData.jobDescription,
        analysisData.matchAnalysis
      );

      const newTailoredResumeUrl = URL.createObjectURL(
        tailoredResumeBlob
      );

      setAnalysisData((previous) => {
        if (previous?.tailoredResumeUrl) {
          URL.revokeObjectURL(previous.tailoredResumeUrl);
        }

        return {
          ...previous,
          tailoredResumeUrl: newTailoredResumeUrl,
          tailoredResumeAtsScore: atsScore,
        };
      });
    } catch (err) {
      console.error(err);

      setTailoredResumeError(
        err?.message ||
        "Unable to generate the tailored resume."
      );
    } finally {
      setTailoredResumeLoading(false);
    }
  };


  const handleGenerateCoverLetter = async () => {
    if (!analysisData) return;

    setCoverLetterLoading(true);
    setError("");

    try {
      const result = await generateCoverLetter(
        analysisData.resumeText,
        analysisData.jobDescription
      );

      const generated =
        typeof result.cover_letter === "string"
          ? result.cover_letter
          : result.cover_letter?.cover_letter || "";

      setCoverLetter(generated);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
        "Unable to generate the cover letter."
      );
    } finally {
      setCoverLetterLoading(false);
    }
  };


  const handleCopyCoverLetter = async () => {
    if (!coverLetter) return;

    await navigator.clipboard.writeText(
      coverLetter
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };


  const handleDownloadCoverLetter = () => {
    if (!coverLetter) return;

    const blob = new Blob(
      [coverLetter],
      { type: "text/plain" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "cover-letter.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };


const handleGenerateInterviewPrep = async () => {
  if (!analysisData) return;

  setInterviewLoading(true);
  setError("");

  try {
    const result = await generateInterviewPrep(
      analysisData.resumeText,
      analysisData.jobDescription
    );

    setInterviewQuestions(
      Array.isArray(result?.questions)
        ? result.questions
        : []
    );
  } catch (err) {
    console.error(err);

    setError(
      err?.message ||
      "Unable to generate interview preparation."
    );
  } finally {
    setInterviewLoading(false);
  }
};


  const handleNewAnalysis = () => {
    if (analysisData?.tailoredResumeUrl) {
      URL.revokeObjectURL(
        analysisData.tailoredResumeUrl
      );
    }

    setAnalysisData(null);
    setCoverLetter("");
    setInterviewQuestions([]);
    setTailoredResumeError("");
    setError("");
    setActiveTab("overview");
    setPage("upload");
  };


  if (authStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return <Login onAuthenticated={handleAuthenticated} />;
  }


  if (page === "landing") {
    return (
      <LandingPage
        onStart={handleStart}
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }


  if (page === "upload") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <button
              onClick={() => setPage("landing")}
              className="flex items-center gap-2.5"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Sparkles className="size-4" />
              </div>

              <span className="text-lg font-bold tracking-tight text-slate-950">
                Resume<span className="text-blue-600">Match</span>
              </span>
            </button>

            <span className="text-xs font-semibold text-slate-400">
              Resume analysis
            </span>
          </div>
        </header>

        <main className="px-5 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-4xl">

            <button
              onClick={() => setPage("landing")}
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </button>

            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                <Sparkles className="size-3.5" />
                AI-powered analysis
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Analyze your resume
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Upload your resume and add the job description.
                ResumeMatch will identify your match, skill gaps,
                and ways to strengthen your application.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
              <UploadSection
                onSubmit={handleSubmit}
                loading={loading}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }


  if (page === "analysis") {
    const theme = darkMode
      ? {
        page: "bg-slate-950 text-white",
        sidebar: "bg-slate-900 border-slate-800",
        border: "border-slate-800",
        card: "bg-slate-900 border-slate-800",
        muted: "text-slate-400",
        text: "text-white",
        soft: "bg-slate-800",
        hover: "hover:bg-slate-800",
      }
      : {
        page: "bg-slate-50 text-slate-950",
        sidebar: "bg-white border-slate-200",
        border: "border-slate-200",
        card: "bg-white border-slate-200",
        muted: "text-slate-500",
        text: "text-slate-950",
        soft: "bg-slate-100",
        hover: "hover:bg-slate-50",
      };

    return (
      <div className={`min-h-screen ${theme.page}`}>

        {/* Desktop Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 hidden w-64 border-r lg:flex lg:flex-col ${theme.sidebar}`}
        >
          {/* Brand */}
          <div className={`flex h-16 items-center border-b px-6 ${theme.border}`}>
            <button
              onClick={() => setPage("landing")}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950">
                <Sparkles className="h-4 w-4 text-white" />
              </div>

              <span className={`text-lg font-bold tracking-tight ${theme.text}`}>
                Resume<span className="text-slate-400">Match</span>
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${activeTab === "overview"
                ? `${theme.soft} ${theme.text}`
                : `${theme.muted} ${theme.hover}`
                }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab("skill-gap")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeTab === "skill-gap"
                ? `${theme.soft} ${theme.text}`
                : `${theme.muted} ${theme.hover}`
                }`}
            >
              Skill Gap
            </button>

            <button
              onClick={() => setActiveTab("tailored-resume")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeTab === "tailored-resume"
                ? `${theme.soft} ${theme.text}`
                : `${theme.muted} ${theme.hover}`
                }`}
            >
              Tailored Resume
            </button>

            <button
              onClick={() => setActiveTab("cover-letter")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeTab === "cover-letter"
                ? `${theme.soft} ${theme.text}`
                : `${theme.muted} ${theme.hover}`
                }`}
            >
              Cover Letter
            </button>

            <button
              onClick={() => setActiveTab("interview")}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeTab === "interview"
                ? `${theme.soft} ${theme.text}`
                : `${theme.muted} ${theme.hover}`
                }`}
            >
              Interview Prep
            </button>
          </nav>

          {/* Bottom */}
          <div className={`border-t p-4 ${theme.border}`}>
            <button
              onClick={handleNewAnalysis}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${theme.border} ${theme.muted} ${theme.hover}`}
            >
              + New Analysis
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:pl-64">

          {/* Top Header */}
          <header
            className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b px-5 backdrop-blur-xl sm:px-8 ${theme.sidebar} ${theme.border}`}
          >
            <div>
              <p className={`text-sm font-semibold ${theme.text}`}>
                Resume Analysis
              </p>

              <p className={`mt-0.5 text-xs ${theme.muted}`}>
                AI-powered application workspace
              </p>
            </div>

            <div className="flex items-center gap-2">

              {/* Theme Button */}
              <button
                onClick={() => setDarkMode((value) => !value)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${theme.border} ${theme.muted} ${theme.hover}`}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${theme.border} ${theme.muted} ${theme.hover}`}
                aria-label="Log out"
                title={currentUser?.email ? `Log out (${currentUser.email})` : "Log out"}
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* New Analysis */}
              <button
                onClick={handleNewAnalysis}
                className="hidden rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:block"
              >
                New Analysis
              </button>
            </div>
          </header>

          {/* Mobile Navigation */}
          <div
            className={`overflow-x-auto border-b lg:hidden ${theme.sidebar} ${theme.border}`}
          >
            <div className="flex min-w-max gap-1 p-2">
              {[
                ["Overview", "overview"],
                ["Skill Gap", "skill-gap"],
                ["Tailored Resume", "tailored-resume"],
                ["Cover Letter", "cover-letter"],
                ["Interview Prep", "interview"],
              ].map(([label, value]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === value
                    ? "bg-slate-950 text-white"
                    : `${theme.muted} ${theme.hover}`
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard Content */}
          <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">

            {/* Page Heading */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Analysis complete
              </p>

              <h1 className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${theme.text}`}>
                Your application overview
              </h1>

              <p className={`mt-2 max-w-2xl text-sm leading-6 ${theme.muted}`}>
                Review your resume match, skill gaps, and application
                recommendations.
              </p>
            </div>

            {activeTab === "overview" && (
              <>
                {/* Overview Stats */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {/* Match Score */}
                  <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${theme.muted}`}>
                        Match Score
                      </p>

                      <Target className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="mt-5 flex items-end gap-2">
                      <span className={`text-3xl font-bold tracking-tight ${theme.text}`}>
                        {score}%
                      </span>

                      <span className="mb-1 text-xs font-medium text-emerald-600">
                        Resume fit
                      </span>
                    </div>

                    <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${theme.soft}`}>
                      <div
                        className="h-full rounded-full bg-slate-950 transition-all"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${theme.muted}`}>
                        Skills Found
                      </p>

                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    </div>

                    <p className={`mt-5 text-3xl font-bold tracking-tight ${theme.text}`}>
                      {strengths.length}
                    </p>

                    <p className={`mt-2 text-xs ${theme.muted}`}>
                      Relevant strengths identified
                    </p>
                  </div>

                  {/* Skill Gaps */}
                  <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${theme.muted}`}>
                        Skill Gaps
                      </p>

                      <AlertCircle className="h-4 w-4 text-slate-400" />
                    </div>

                    <p className={`mt-5 text-3xl font-bold tracking-tight ${theme.text}`}>
                      {missingSkills.length}
                    </p>

                    <p className={`mt-2 text-xs ${theme.muted}`}>
                      Areas worth strengthening
                    </p>
                  </div>

                  {/* Application Ready */}
                  <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${theme.muted}`}>
                        Application
                      </p>

                      <Sparkles className="h-4 w-4 text-slate-400" />
                    </div>

                    <p className={`mt-5 text-2xl font-bold tracking-tight ${theme.text}`}>
                      Analyzed
                    </p>

                    <p className={`mt-2 text-xs ${theme.muted}`}>
                      Resume optimization completed
                    </p>
                  </div>
                </div>

                {/* Overview Introduction */}
                <div className={`mt-6 rounded-2xl border p-6 shadow-sm ${theme.card}`}>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>

                        <h2 className={`text-base font-bold ${theme.text}`}>
                          Analysis at a glance
                        </h2>
                      </div>

                      <p className={`mt-3 max-w-2xl text-sm leading-6 ${theme.muted}`}>
                        Your resume has been analyzed against the target job description.
                        Explore each section to understand your strengths, gaps, and
                        recommended improvements.
                      </p>
                    </div>

                    <div className={`shrink-0 rounded-xl px-4 py-3 ${theme.soft}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${theme.muted}`}>
                        Target resume
                      </p>

                      <p className={`mt-1 max-w-[220px] truncate text-sm font-semibold ${theme.text}`}>
                        {analysisData?.filename || "Uploaded resume"}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Match Report */}
                <div className="mt-6">
                  <MatchReport
                    matchAnalysis={analysisData?.matchAnalysis}
                  />
                </div>
              </>
            )}

            {/* Skill Gap Section */}
            {activeTab === "skill-gap" && (
              <section className="mt-6">

                {/* Section Header */}
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Improvement areas
                    </p>

                    <h2 className={`mt-1 text-xl font-bold tracking-tight ${theme.text}`}>
                      Skill gap analysis
                    </h2>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      Understand which requirements need more attention.
                    </p>
                  </div>

                  <div className={`hidden rounded-lg px-3 py-2 text-xs font-semibold sm:block ${theme.soft} ${theme.muted}`}>
                    Powered by Gemini
                  </div>
                </div>

                {/* Skill Gap Card */}
                <div
                  className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}
                >
                  <div className={`border-b px-6 py-4 ${theme.border}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950">
                        <Target className="h-4 w-4 text-white" />
                      </div>

                      <div>
                        <h3 className={`text-sm font-bold ${theme.text}`}>
                          Skills to strengthen
                        </h3>

                        <p className={`text-xs ${theme.muted}`}>
                          Prioritized based on the target job description
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    {skillGapLoading ? (
                      <div className="flex min-h-[320px] items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                          <p className={`mt-4 text-sm font-semibold ${theme.text}`}>
                            Analyzing skill gaps...
                          </p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            This runs in the background after your ATS score.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <SkillGapReport
                        skillGap={analysisData?.skillGap}
                      />
                    )}
                  </div>
                </div>

              </section>
            )}

            {/* Tailored Resume Workspace */}
            {activeTab === "tailored-resume" && (
              <section className="mt-10">

                {/* Section Header */}
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Application document
                    </p>

                    <h2 className={`mt-1 text-xl font-bold tracking-tight ${theme.text}`}>
                      Tailored resume
                    </h2>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      Your resume optimized for the target role.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateTailoredResume}
                      disabled={tailoredResumeLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${tailoredResumeLoading ? "animate-spin" : ""}`}
                      />
                      {analysisData?.tailoredResumeUrl ? "Regenerate" : "Generate"}
                    </button>

                    <button
                      onClick={handleDownloadResume}
                      disabled={!analysisData?.tailoredResumeUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Document Workspace */}
                <div
                  className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}
                >

                  {/* Workspace Toolbar */}
                  <div
                    className={`flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between ${theme.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <FileText className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                      </div>

                      <div>
                        <p className={`text-xs font-semibold ${theme.text}`}>
                          {analysisData?.filename || "Resume.pdf"}
                        </p>

                        <p className={`text-[10px] ${theme.muted}`}>
                          Optimized document preview
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {analysisData?.tailoredResumeUrl &&
                        typeof analysisData?.tailoredResumeAtsScore === "number" && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              analysisData.tailoredResumeAtsScore > 75
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            Tailored ATS score: {analysisData.tailoredResumeAtsScore}/100
                          </span>
                        )}

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          analysisData?.tailoredResumeUrl
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {analysisData?.tailoredResumeUrl ? "Ready" : "Not generated"}
                      </span>
                    </div>
                  </div>

                  {/* PDF Preview */}
                  <div className="bg-slate-100 p-3 dark:bg-slate-950 sm:p-6">
                    {tailoredResumeLoading ? (
                      <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-center">
                          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                          <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Generating your tailored resume...
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            This may take up to a minute.
                          </p>
                        </div>
                      </div>
                    ) : analysisData?.tailoredResumeUrl ? (
                      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
                        <iframe
                          src={analysisData.tailoredResumeUrl}
                          title="Tailored Resume Preview"
                          className="h-[850px] w-full bg-white"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-center">
                          {tailoredResumeError ? (
                            <>
                              <AlertCircle className="mx-auto h-8 w-8 text-red-300" />

                              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Tailored resume generation failed
                              </p>

                              <p className="mt-1 max-w-xs text-xs text-slate-400">
                                {tailoredResumeError}
                              </p>

                              <button
                                onClick={handleGenerateTailoredResume}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                              >
                                <WandSparkles className="h-4 w-4" />
                                Try again
                              </button>
                            </>
                          ) : (
                            <>
                              <FileText className="mx-auto h-8 w-8 text-slate-300" />

                              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Resume preview unavailable
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Generate your tailored resume to preview it here.
                              </p>

                              <button
                                onClick={handleGenerateTailoredResume}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                              >
                                <WandSparkles className="h-4 w-4" />
                                Generate Tailored Resume
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Info */}
                  <div
                    className={`flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${theme.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />

                      <p className={`text-xs ${theme.muted}`}>
                        Existing resume design preserved while relevant content is optimized.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadResume}
                      disabled={!analysisData?.tailoredResumeUrl}
                      className={`inline-flex items-center gap-2 text-xs font-semibold transition ${theme.muted} hover:text-slate-950 dark:hover:text-white disabled:opacity-40`}
                    >
                      Download document
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              </section>
            )}

            {/* Cover Letter Workspace */}
            {activeTab === "cover-letter" && (
              <section className="mt-10">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Application document
                    </p>

                    <h2 className={`mt-1 text-xl font-bold tracking-tight ${theme.text}`}>
                      Cover letter
                    </h2>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      A personalized cover letter generated for this role.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={coverLetterLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${coverLetterLoading ? "animate-spin" : ""}`}
                      />
                      Regenerate
                    </button>

                    <button
                      onClick={handleCopyCoverLetter}
                      disabled={!coverLetter}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </div>

                <div
                  className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}
                >
                  <div
                    className={`flex items-center justify-between border-b px-5 py-4 ${theme.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Mail className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                      </div>

                      <div>
                        <p className={`text-sm font-semibold ${theme.text}`}>
                          Personalized cover letter
                        </p>

                        <p className={`text-xs ${theme.muted}`}>
                          Generated from your resume and target job description
                        </p>
                      </div>
                    </div>

                    <Sparkles className="h-4 w-4 text-slate-400" />
                  </div>

                  <div className="p-6">
                    {coverLetterLoading ? (
                      <div className="flex min-h-[420px] items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                          <p className={`mt-4 text-sm font-semibold ${theme.text}`}>
                            Generating your cover letter...
                          </p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            This may take a few seconds.
                          </p>
                        </div>
                      </div>
                    ) : coverLetter ? (
                      <div
                        className={`mx-auto max-w-3xl rounded-xl border p-6 sm:p-8 ${theme.border}`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
                          {coverLetter}
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-center dark:border-slate-700">
                        <div>
                          <Mail className="mx-auto h-8 w-8 text-slate-300" />

                          <p className={`mt-3 text-sm font-semibold ${theme.text}`}>
                            No cover letter generated yet
                          </p>

                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            Generate a personalized cover letter for this application.
                          </p>

                          <button
                            onClick={handleGenerateCoverLetter}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            <Sparkles className="h-4 w-4" />
                            Generate Cover Letter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Interview Preparation */}
            {activeTab === "interview" && (
              <section className="mt-10">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Interview readiness
                    </p>

                    <h2 className={`mt-1 text-xl font-bold tracking-tight ${theme.text}`}>
                      Interview preparation
                    </h2>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      Questions and answers relevant to this role.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300 sm:flex">
                      <Sparkles className="h-3 w-3" />
                      Tavily + AI
                    </div>

                    {score >= 65 && (
                      <button
                        onClick={handleGenerateInterviewPrep}
                        disabled={interviewLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${interviewLoading ? "animate-spin" : ""}`}
                        />
                        {interviewQuestions.length ? "Regenerate" : "Generate"}
                      </button>
                    )}
                  </div>
                </div>

                <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.card}`}>
                  <div className={`border-b px-6 py-4 ${theme.border}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>

                      <div>
                        <p className={`text-sm font-semibold ${theme.text}`}>
                          Role-specific interview questions
                        </p>
                        <p className={`text-xs ${theme.muted}`}>
                          AI-generated questions and answers for this role
                        </p>
                      </div>
                    </div>
                  </div>

                  {interviewLoading ? (
                    <div className="p-6">
                      <div className="flex min-h-[320px] items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                          <p className={`mt-4 text-sm font-semibold ${theme.text}`}>
                            Generating interview preparation...
                          </p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            This may take up to a minute.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <InterviewPrep
                      interviewPrep={interviewQuestions}
                      score={score}
                    />
                  )}
                </div>
              </section>
            )}

            <section className="mt-10">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Application tracking
                </p>

                <h2 className={`mt-1 text-xl font-bold tracking-tight ${theme.text}`}>
                  Analysis history
                </h2>

                <p className={`mt-1 text-sm ${theme.muted}`}>
                  Review your previous resume analyses.
                </p>
              </div>

              <History
                history={history}
                onSelect={handleSelectHistory}
                onDelete={handleDeleteHistory}
                onClear={handleClearHistory}
              />
            </section>
          </main>
        </div>
      </div>
    );
  }

  return null;
}

export default App;