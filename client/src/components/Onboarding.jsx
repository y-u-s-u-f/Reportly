import { useState } from "react";
import { Camera, Mic, MapPin, ThumbsUp, ArrowRight, X } from "lucide-react";
import Logo from "./Logo.jsx";

const STORAGE_KEY = "reportly:onboarded";

const STEPS = [
  {
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    icon: <Logo className="h-12 w-12" />,
    title: "Welcome to Reportly",
    body: "Spot a pothole, broken streetlight, or illegal dumping? Snap it and the right department gets notified.",
  },
  {
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    icon: <Camera size={36} className="text-teal-500 dark:text-teal-300" />,
    title: "Tap the big camera",
    body: "The teal circle at the bottom opens your camera. One tap and your photo is the start of a report.",
  },
  {
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    icon: <Mic size={36} className="text-teal-500 dark:text-teal-300" />,
    title: "Talk, don't type",
    body: "Tap the big mic to describe the issue. You can also type — whichever is faster for you.",
  },
  {
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    icon: <MapPin size={36} className="text-teal-500 dark:text-teal-300" />,
    title: "See what's nearby",
    body: "The Map and Dashboard tabs show open reports near you, color-coded by severity.",
  },
  {
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    icon: <ThumbsUp size={36} className="text-teal-500 dark:text-teal-300" />,
    title: "Add your voice",
    body: "Already reported? Just upvote — you'll be counted without filing a new one.",
  },
];

export function hasOnboarded() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  function finish() {
    markOnboarded();
    onDone?.();
  }

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i
                    ? "w-8 bg-teal-500"
                    : idx < i
                      ? "w-2 bg-teal-500/50"
                      : "w-2 bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1 px-2 min-h-[36px]"
            aria-label="Skip onboarding"
          >
            Skip
            <X size={12} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center py-4">
          <div
            className={`h-20 w-20 rounded-2xl inline-flex items-center justify-center mb-5 ${step.iconBg}`}
          >
            {step.icon}
          </div>
          <h2 className="text-xl font-bold mb-2">{step.title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xs">
            {step.body}
          </p>
        </div>

        <button
          type="button"
          onClick={() => (isLast ? finish() : setI((n) => n + 1))}
          className="mt-5 w-full min-h-[52px] rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-base inline-flex items-center justify-center gap-2 transition"
        >
          {isLast ? "Get started" : "Next"}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
