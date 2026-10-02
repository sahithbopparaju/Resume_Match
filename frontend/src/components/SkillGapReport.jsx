import {
  AlertCircle,
  BookOpen,
  Clock3,
  ExternalLink,
  Target,
} from "lucide-react";

function parseSkillGap(skillGap) {
  if (!skillGap) return {};

  if (typeof skillGap === "object") {
    return skillGap;
  }

  try {
    return JSON.parse(skillGap);
  } catch {
    return {};
  }
}

function SkillGapReport({ skillGap }) {
  const data = parseSkillGap(skillGap);

  const missingSkills = Array.isArray(data?.missing_skills)
    ? data.missing_skills
    : [];

  if (!missingSkills.length) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
            <Target className="h-5 w-5 text-emerald-600" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">
            No major skill gaps detected
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your resume appears to cover the main skills identified in the
            target job description.
          </p>
        </div>
      </div>
    );
  }

  const getPriorityStyle = (priority) => {
    const value = String(priority || "").toLowerCase();

    if (value === "high") {
      return {
        badge:
          "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
        dot: "bg-red-500",
      };
    }

    if (value === "medium") {
      return {
        badge:
          "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
        dot: "bg-amber-500",
      };
    }

    return {
      badge:
        "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
      dot: "bg-slate-400",
    };
  };

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {missingSkills.map((item, index) => {
        const priority = getPriorityStyle(item?.priority);

        const resources = Array.isArray(item?.learn_via)
          ? item.learn_via
          : [];

        return (
          <article
            key={`${item?.skill || "skill"}-${index}`}
            className="p-6 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
          >
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">

                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    {item?.skill || "Skill"}
                  </h3>

                  {item?.reason && (
                    <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {item.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Priority */}
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${priority.badge}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${priority.dot}`}
                />
                {item?.priority || "low"} priority
              </span>
            </div>

            {/* Learning time */}
            {item?.estimated_time && (
              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Estimated learning time:
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {item.estimated_time}
                </span>
              </div>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />

                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recommended resources
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {resources.map((resource, resourceIndex) => (
                    <a
                      key={`${resource?.name || "resource"}-${resourceIndex}`}
                      href={resource?.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {resource?.name || "Learning resource"}
                        </p>

                        {resource?.type && (
                          <p className="mt-1 text-[10px] capitalize text-slate-400">
                            {resource.type}
                          </p>
                        )}
                      </div>

                      <ExternalLink className="ml-3 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default SkillGapReport;