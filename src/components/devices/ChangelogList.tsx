import { ChangelogEntry } from "@/types";
import { format } from "date-fns";
import { Clock, PlusCircle, Edit2, AlertCircle } from "lucide-react";

const actionIcon: Record<string, React.ElementType> = {
  CREATED: PlusCircle,
  UPDATED: Edit2,
  STATUS_CHANGED: AlertCircle,
  NOTE_ADDED: Edit2,
};

const actionColor: Record<string, string> = {
  CREATED: "text-emerald-600 bg-emerald-50",
  UPDATED: "text-blue-600 bg-blue-50",
  STATUS_CHANGED: "text-amber-600 bg-amber-50",
  NOTE_ADDED: "text-purple-600 bg-purple-50",
};

export function ChangelogList({ entries }: { entries: ChangelogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-slate-400 text-sm italic">No history yet.</p>;
  }

  return (
    <ol className="relative border-l border-slate-200 space-y-4 ml-3">
      {entries.map((entry) => {
        const Icon = actionIcon[entry.action] ?? Clock;
        const colorClass = actionColor[entry.action] ?? "text-slate-600 bg-slate-50";

        return (
          <li key={entry.id} className="ml-4">
            <div className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ${colorClass}`}>
              <Icon size={12} />
            </div>
            <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
              <p className="text-sm font-medium text-slate-800">{entry.summary}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>{entry.author}</span>
                <span>·</span>
                <span>{format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}</span>
              </div>
              {entry.diff && (
                <details className="mt-2">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                    View changes
                  </summary>
                  <div className="mt-1 space-y-1">
                    {Object.entries(JSON.parse(entry.diff)).map(([field, vals]) => {
                      const [oldVal, newVal] = vals as [unknown, unknown];
                      return (
                        <div key={field} className="text-xs font-mono bg-slate-50 rounded p-1.5">
                          <span className="text-slate-500">{field}: </span>
                          <span className="line-through text-red-500">{String(oldVal ?? "—")}</span>
                          <span className="text-slate-400"> → </span>
                          <span className="text-emerald-600">{String(newVal ?? "—")}</span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
