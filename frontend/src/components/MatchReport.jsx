import {
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  Target,
} from "lucide-react";

function parseMatchAnalysis(matchAnalysis) {
  if (!matchAnalysis) {
    return {};
  }

  if (typeof matchAnalysis === "object") {
    return matchAnalysis;
  }

  try {
    return JSON.parse(matchAnalysis);
  } catch {
    return {};
  }
}

function MatchReport({ matchAnalysis }) {
  const data = parseMatchAnalysis(matchAnalysis);

  const score = Number(data.score ?? data.match_score ?? 0);

  const strengths = Array.isArray(data.strengths)
    ? data.strengths
    : [];

  const missingSkills = Array.isArray(data.missing_skills)
    ? data.missing_skills
    : [];

  const suggestions = Array.isArray(data.suggestions)
    ? data.suggestions
    : [];

  const getScoreLabel = () => {
    if (score >= 80) return "Strong match";
    if (score >= 65) return "Good match";
    if (score >= 50) return "Moderate match";
    return "Needs improvement";
  };

  const getScoreDescription = () => {
    if (score >= 80) {
      return "Your resume aligns well with the requirements of this role.";
    }

    if (score >= 65) {
      return "Your resume has a good foundation for this role, with a few areas to strengthen.";
    }

    if (score >= 50) {
      return "Your resume shows some relevant experience, but several requirements could be better aligned.";
    }

    return "There are significant gaps between your current resume and the target role.";
  };

  return (
    <section className="mt-8">
      {/* Match score */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Target className="size-4" />
              Match score
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {getScoreLabel()}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {getScoreDescription()}
            </p>

            <div className="mt-4 inline-flex items-center rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
              Score is based on requirements, responsibilities,
              preferred skills, and supported resume keywords.
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <div className="relative flex size-32 items-center justify-center rounded-full bg-slate-100">
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-950">
                    {score}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    out of 100
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score progress */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Resume alignment</span>
            <span className="text-slate-900">{score}%</span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-700"
              style={{
                width: `${Math.min(Math.max(score, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Strengths */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="size-4" />
            Your strengths
          </div>

          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            What already matches
          </h3>

          {strengths.length > 0 ? (
            <div className="mt-5 space-y-3">
              {strengths.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex gap-3 rounded-2xl bg-slate-50 p-4"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-600">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">
              No specific strengths were returned for this analysis.
            </p>
          )}
        </div>

        {/* Missing skills */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
            <CircleAlert className="size-4" />
            Skill gaps
          </div>

          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            What needs attention
          </h3>

          {missingSkills.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {missingSkills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">
                No major missing skills were identified.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Lightbulb className="size-4" />
          Improvement suggestions
        </div>

        <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
          How to improve your application
        </h3>

        {suggestions.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {suggestions.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-blue-600 shadow-sm">
                  {index + 1}
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  {item}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">
            No additional suggestions were returned for this analysis.
          </p>
        )}
      </div>
    </section>
  );
}

export default MatchReport;