import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Upload,
  X,
} from "lucide-react";

function UploadSection({ onSubmit, loading }) {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setError("");

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload your resume as a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Resume file size must be less than 10 MB.");
      return;
    }

    setResume(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!resume) {
      setError("Please upload your resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }

    onSubmit(resume, jobDescription.trim());
  };

  const removeResume = () => {
    setResume(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const wordCount = jobDescription.trim()
    ? jobDescription.trim().split(/\s+/).length
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Resume */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900">
            Your Resume
          </label>

          <span className="text-xs text-slate-400">
            PDF · Max 10 MB
          </span>
        </div>

        {!resume ? (
          <label
            htmlFor="resume-upload"
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
            }`}
          >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
              <Upload className="size-6" />
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-900">
              Drop your resume here
            </p>

            <p className="mt-1 text-sm text-slate-500">
              or click to browse from your computer
            </p>

            <p className="mt-4 text-xs text-slate-400">
              PDF files only
            </p>

            <input
              ref={fileInputRef}
              id="resume-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) =>
                handleFile(event.target.files?.[0])
              }
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <FileText className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {resume.name}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {(resume.size / 1024 / 1024).toFixed(2)} MB · PDF
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeResume}
              className="ml-3 flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="Remove resume"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Job Description */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label
            htmlFor="job-description"
            className="text-sm font-semibold text-slate-900"
          >
            Job Description
          </label>

          <span className="text-xs text-slate-400">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>

        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(event) => {
            setJobDescription(event.target.value);
            if (error) setError("");
          }}
          placeholder={`Paste the complete job description here...

Include:
• Responsibilities
• Required skills
• Preferred qualifications
• Technologies and tools`}
          rows={13}
          className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <p className="mt-2 text-xs leading-5 text-slate-500">
          A complete job description gives ResumeMatch more information to
          identify relevant skills and keywords.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* What happens next */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-900">
          What happens next?
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            "Analyze your resume",
            "Identify skill gaps",
            "Optimize your application",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!resume || !jobDescription.trim() || loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Analyzing your application...
          </>
        ) : (
          <>
            Analyze Resume
            <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Your resume is analyzed against the job description to generate
        personalized results.
      </p>
    </form>
  );
}

export default UploadSection;