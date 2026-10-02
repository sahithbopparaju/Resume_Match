import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Trash2,
} from "lucide-react";

function History({ history = [], onSelect, onDelete, onClear }) {
  if (!history.length) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center dark:border-slate-700 dark:bg-slate-900">
        <FileText className="h-8 w-8 text-slate-300" />

        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
          No analysis history
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Completed resume analyses will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Previous analyses
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {history.length} saved application{history.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {history.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-300" />
            </div>

            <button
              onClick={() => onSelect(item)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {item.role || "Resume Analysis"}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                {item.company && <span>{item.company}</span>}

                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>

                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {item.score ?? 0}%
              </span>

              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 transition group-hover:opacity-100"
                aria-label="Delete analysis"
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
              </button>

              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;