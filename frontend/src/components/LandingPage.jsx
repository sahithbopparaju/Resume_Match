import { ArrowRight, Sparkles } from "lucide-react";

function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* Navbar */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>

            <span className="text-lg font-bold tracking-tight">
              Resume<span className="text-slate-500">Match</span>
            </span>
          </button>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              How it works
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              About
            </a>
          </nav>

          {/* CTA */}
          <button
            onClick={onStart}
            className="group flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
          >
            Analyze Resume
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-180px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-slate-200/50 blur-3xl" />
          <div className="absolute left-[10%] top-[30%] h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-8 lg:pb-32 lg:pt-32">
          <div className="mx-auto max-w-4xl text-center">

            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              AI-powered resume intelligence
            </div>

            {/* Heading */}
            <h1 className="text-5xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              Turn your resume into a
              <span className="block text-slate-400">
                job-winning application.
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-500 sm:text-xl">
              Analyze your resume against any job description, discover skill gaps,
              tailor your resume, and prepare for the interview — all in one place.
            </p>

            {/* Actions */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={onStart}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
              >
                Analyze my resume
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#features"
                className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Explore features
              </a>
            </div>

            {/* Trust line */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <span>Resume analysis</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>AI skill matching</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Interview preparation</span>
            </div>
          </div>
        </section>
      </main>
      {/* Product Preview */}
      <section className="border-t border-slate-100 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">

          {/* Section heading */}
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Your application workspace
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything you need to improve your application
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500">
              One intelligent workspace to understand your resume,
              identify gaps, and prepare for your target role.
            </p>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto max-w-5xl">

            {/* Glow */}
            <div className="absolute -inset-4 rounded-[2rem] bg-slate-200/40 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">

              {/* Browser top bar */}
              <div className="flex h-11 items-center border-b border-slate-200 bg-slate-50 px-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                </div>

                <div className="mx-auto hidden rounded-md border border-slate-200 bg-white px-20 py-1 text-[10px] text-slate-400 sm:block">
                  app.resumematch.ai
                </div>
              </div>

              {/* Dashboard */}
              <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[190px_1fr]">

                {/* Sidebar */}
                <aside className="hidden border-r border-slate-200 bg-slate-50/50 p-4 md:block">
                  <div className="mb-8 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-slate-950" />
                    <div className="h-3 w-20 rounded bg-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-lg bg-slate-200/70 px-3 py-2">
                      <div className="h-2.5 w-16 rounded bg-slate-400" />
                    </div>

                    <div className="px-3 py-2">
                      <div className="h-2.5 w-20 rounded bg-slate-200" />
                    </div>

                    <div className="px-3 py-2">
                      <div className="h-2.5 w-14 rounded bg-slate-200" />
                    </div>

                    <div className="px-3 py-2">
                      <div className="h-2.5 w-24 rounded bg-slate-200" />
                    </div>
                  </div>
                </aside>

                {/* Main dashboard */}
                <div className="p-5 sm:p-7">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-3 w-28 rounded bg-slate-200" />
                      <div className="mt-2 h-2.5 w-44 rounded bg-slate-100" />
                    </div>

                    <div className="h-8 w-24 rounded-lg bg-slate-950" />
                  </div>

                  {/* Stats */}
                  <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      ["Match Score", "87%"],
                      ["Skills Found", "18"],
                      ["Skill Gaps", "4"],
                      ["ATS Keywords", "92%"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-[10px] font-medium text-slate-400">
                          {label}
                        </p>

                        <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Analysis */}
                  <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">

                    {/* Match card */}
                    <div className="rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Resume match
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Alignment with target role
                          </p>
                        </div>

                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-900">
                          <span className="text-sm font-bold text-slate-900">
                            87%
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        {[
                          ["Python", "Strong"],
                          ["LangChain", "Strong"],
                          ["RAG", "Strong"],
                          ["FastAPI", "Missing"],
                        ].map(([skill, status]) => (
                          <div
                            key={skill}
                            className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0"
                          >
                            <span className="text-xs font-medium text-slate-600">
                              {skill}
                            </span>

                            <span
                              className={`text-[10px] font-semibold ${status === "Missing"
                                ? "text-slate-400"
                                : "text-emerald-600"
                                }`}
                            >
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendation card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                      <p className="text-sm font-semibold text-slate-900">
                        AI recommendations
                      </p>

                      <div className="mt-5 space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="h-2.5 w-24 rounded bg-slate-300" />
                          <div className="mt-2 h-2 w-full rounded bg-slate-100" />
                          <div className="mt-1.5 h-2 w-4/5 rounded bg-slate-100" />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="h-2.5 w-28 rounded bg-slate-300" />
                          <div className="mt-2 h-2 w-full rounded bg-slate-100" />
                          <div className="mt-1.5 h-2 w-3/4 rounded bg-slate-100" />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="h-2.5 w-20 rounded bg-slate-300" />
                          <div className="mt-2 h-2 w-full rounded bg-slate-100" />
                          <div className="mt-1.5 h-2 w-5/6 rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Heading */}
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Everything in one place
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From resume analysis to interview day.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500">
              ResumeMatch turns a job description into a complete application
              preparation workflow.
            </p>
          </div>

          {/* Feature grid */}
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {[
              {
                number: "01",
                title: "Resume Match",
                description:
                  "See how closely your resume aligns with the requirements of your target role.",
              },
              {
                number: "02",
                title: "Skill Gap Analysis",
                description:
                  "Identify important skills and keywords that are missing or need stronger representation.",
              },
              {
                number: "03",
                title: "Tailored Resume",
                description:
                  "Adapt your existing resume content to better match the target job while preserving its original design.",
              },
              {
                number: "04",
                title: "Cover Letter",
                description:
                  "Generate a concise, role-specific cover letter using your actual experience.",
              },
              {
                number: "05",
                title: "Interview Preparation",
                description:
                  "Practice relevant technical questions and accurate answers based on the role and your background.",
              },
              {
                number: "06",
                title: "Application Workspace",
                description:
                  "Keep your resume analysis and preparation workflow organized in one focused workspace.",
              },
            ].map((feature) => (
              <div
                key={feature.number}
                className="group rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-slate-300">
                    {feature.number}
                  </span>

                  <div className="h-2 w-2 rounded-full bg-slate-300 transition group-hover:bg-slate-950" />
                </div>

                <h3 className="mt-12 text-lg font-bold tracking-tight text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section
        id="how-it-works"
        className="border-y border-slate-100 bg-slate-50/60 py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Heading */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Simple workflow
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From resume to interview-ready
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500">
              Upload once. Let ResumeMatch handle the analysis and preparation.
            </p>
          </div>

          {/* Steps */}
          <div className="relative mt-16 grid gap-8 md:grid-cols-3">

            {/* Connecting line */}
            <div className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-slate-200 md:block" />

            {[
              {
                number: "01",
                title: "Upload your application",
                description:
                  "Add your resume and paste the job description you're targeting.",
              },
              {
                number: "02",
                title: "Understand your match",
                description:
                  "AI analyzes your experience, skills, keywords, and potential gaps.",
              },
              {
                number: "03",
                title: "Prepare to apply",
                description:
                  "Generate a tailored resume, cover letter, and interview preparation.",
              },
            ].map((step) => (
              <div key={step.number} className="relative text-center">

                {/* Number */}
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-900 shadow-sm">
                  {step.number}
                </div>

                <h3 className="mt-7 text-lg font-bold tracking-tight text-slate-950">
                  {step.title}
                </h3>

                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA */}
      <section id="about" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 text-center shadow-2xl shadow-slate-900/10 sm:px-12 lg:px-20">

            {/* Subtle background shapes */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">

              <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                Ready when you are
              </p>

              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Build a stronger application for your next opportunity.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
                Understand your match, improve your resume, and walk into your
                interview better prepared.
              </p>

              <button
                onClick={onStart}
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Start analyzing your resume
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="mt-5 text-xs text-slate-500">
                Upload your resume and job description to get started.
              </p>

            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">

            {/* Brand */}
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>

                <span className="text-lg font-bold tracking-tight text-slate-950">
                  Resume<span className="text-slate-400">Match</span>
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                An AI-powered workspace for building stronger resumes,
                understanding job requirements, and preparing for interviews.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3">

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Product
                </p>

                <div className="mt-4 space-y-3">
                  <a
                    href="#features"
                    className="block text-sm text-slate-500 transition hover:text-slate-950"
                  >
                    Features
                  </a>

                  <a
                    href="#how-it-works"
                    className="block text-sm text-slate-500 transition hover:text-slate-950"
                  >
                    How it works
                  </a>

                  <button
                    onClick={onStart}
                    className="block text-sm text-slate-500 transition hover:text-slate-950"
                  >
                    Analyze resume
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Workflow
                </p>

                <div className="mt-4 space-y-3">
                  <span className="block text-sm text-slate-500">
                    Resume matching
                  </span>

                  <span className="block text-sm text-slate-500">
                    Skill analysis
                  </span>

                  <span className="block text-sm text-slate-500">
                    Interview prep
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Built with
                </p>

                <div className="mt-4 space-y-3">
                  <span className="block text-sm text-slate-500">
                    React
                  </span>

                  <span className="block text-sm text-slate-500">
                    FastAPI
                  </span>

                  <span className="block text-sm text-slate-500">
                    AI APIs
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              © 2026 ResumeMatch. Built for smarter job applications.
            </p>

            <p className="text-xs font-medium text-slate-400">
              React + FastAPI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;