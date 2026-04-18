import { statusLabel } from "../lib/notify.js";

const STEPS = ["received", "assigned", "in_progress", "resolved"];

export default function StatusSteps({ status }) {
  const currentIdx = Math.max(0, STEPS.indexOf(status));
  const fillPct = (currentIdx / (STEPS.length - 1)) * 100;
  return (
    <div className="w-full">
      <div className="relative h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className="step-fill absolute inset-y-0 left-0 bg-teal-500 rounded-full"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider font-medium">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`flex flex-col items-center gap-1 flex-1 ${
              i <= currentIdx
                ? "text-teal-600 dark:text-teal-300"
                : "text-zinc-400 dark:text-zinc-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                i <= currentIdx ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
            <span>{statusLabel(step)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
