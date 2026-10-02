import { useState } from "react";

import {
  CheckCircle2,
  ChevronDown,
  Lock,
  MessageSquare,
} from "lucide-react";

function parseInterviewData(interviewPrep) {
  if (!interviewPrep) return [];

  if (Array.isArray(interviewPrep)) return interviewPrep;

  if (typeof interviewPrep === "object") {
    return interviewPrep.questions || [];
  }

  try {
    const parsed = JSON.parse(interviewPrep);
    return Array.isArray(parsed) ? parsed : parsed?.questions || [];
  } catch {
    return [];
  }
}

function InterviewPrep({ interviewPrep, score }) {
  const questions = parseInterviewData(interviewPrep);
  const [openIndex, setOpenIndex] = useState(null);

  if (Number(score || 0) < 65) {
    return (
      <div className="p-6">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center dark:border-slate-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">
            Interview prep is locked
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Improve your match score to 65%+ to unlock company-specific
            interview preparation.
          </p>

          <div className="mt-5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            Current match: {score || 0}%
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="p-6">
        <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
          <MessageSquare className="h-8 w-8 text-slate-300" />

          <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">
            Interview preparation not generated yet
          </h3>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Generate interview preparation to see relevant questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {questions.map((item, index) => {
        const question =
          typeof item === "string" ? item : item?.question || "Interview question";

        const answer =
          typeof item === "object" ? item?.answer : "";

        const type =
          typeof item === "object" ? item?.type || "Interview" : "Interview";

        const isOpen = openIndex === index;

        return (
          <div key={index} className="p-5">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-start gap-4 text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {type}
                  </span>
                </div>

                <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                  {question}
                </p>
              </div>

              <ChevronDown
                className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && answer && (
              <div className="ml-12 mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default InterviewPrep;