import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Mic,
  MapPin,
  ThumbsUp,
  ArrowRight,
  Check,
  Plus,
} from "lucide-react";
import Logo from "../components/ui/Logo.jsx";
import Button from "../components/ui/Button.jsx";
import { spring } from "../design/motion.js";

const STORAGE_KEY = "reportly:onboarded";

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
export function resetOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const STEPS = [
  {
    accent: "brand",
    icon: <Logo className="h-14 w-14" />,
    title: "Welcome to Reportly",
    body: "Spot a pothole, broken light, or dumped trash? Snap it and the right city department hears about it in minutes.",
  },
  {
    accent: "primary",
    icon: <Plus size={42} strokeWidth={2.4} />,
    title: "Report in four taps",
    body: "The big (+) button opens a guided flow: photo, location, description, review. Skip what you don't have — AI fills the gaps.",
  },
  {
    accent: "primary",
    icon: <Mic size={38} strokeWidth={2} />,
    title: "Talk, don't type",
    body: "Prefer speaking? Hit the voice button in the Describe step — we transcribe it and classify it for you.",
  },
  {
    accent: "primary",
    icon: <MapPin size={38} strokeWidth={2} />,
    title: "See what's nearby",
    body: "Home and Map show open reports around you, ranked by distance and severity. Resolved ones are marked so you know what's been fixed.",
  },
  {
    accent: "accent",
    icon: <ThumbsUp size={38} strokeWidth={2} />,
    title: "Amplify, don't duplicate",
    body: "Already reported? Tap upvote — you're counted without filing again. More affected people = faster action.",
  },
];

export default function Onboarding({ onDone }) {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [direction, setDirection] = useState(1);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  function finish(go) {
    markOnboarded();
    onDone?.();
    if (go) {
      setTimeout(() => navigate("/report"), 120);
    }
  }

  function next() {
    if (isLast) return finish(false);
    setDirection(1);
    setI((n) => n + 1);
  }
  function back() {
    if (i === 0) return;
    setDirection(-1);
    setI((n) => n - 1);
  }

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        className="relative w-full sm:max-w-md m-0 sm:m-4 bg-[color:var(--color-surface-0)] rounded-t-[32px] sm:rounded-[32px] shadow-[var(--elev-4)] overflow-hidden"
      >
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <Progress step={i} total={STEPS.length} />
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-[12px] font-medium ink-muted hover:ink transition px-2 h-8 rounded-full"
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        </div>

        <div className="relative min-h-[340px] flex items-stretch overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={i}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ ...spring, duration: 0.32 }}
              className="absolute inset-0 flex flex-col items-center text-center px-8 py-4"
            >
              <IconBubble accent={step.accent}>{step.icon}</IconBubble>
              <h2 className="font-display text-[28px] leading-[1.1] ink mt-6 tracking-tight">
                {step.title}
              </h2>
              <p className="text-[14px] ink-muted leading-relaxed mt-3 max-w-[320px]">
                {step.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 pb-6 pt-2 flex items-center gap-2">
          {i > 0 ? (
            <button
              type="button"
              onClick={back}
              className="h-11 px-4 text-sm font-medium ink-muted hover:ink rounded-xl"
            >
              Back
            </button>
          ) : (
            <div className="w-[72px]" aria-hidden />
          )}
          <Button
            size="lg"
            fullWidth
            onClick={isLast ? () => finish(true) : next}
            iconTrailing={isLast ? <Check size={18} /> : <ArrowRight size={18} />}
          >
            {isLast ? "File my first report" : "Next"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Progress({ step, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, idx) => {
        const state = idx < step ? "past" : idx === step ? "current" : "future";
        return (
          <motion.span
            key={idx}
            animate={{
              width: state === "current" ? 28 : 8,
              backgroundColor:
                state === "future"
                  ? "var(--color-line)"
                  : state === "past"
                    ? "var(--color-primary-300)"
                    : "var(--color-primary-600)",
            }}
            transition={spring}
            className="h-1.5 rounded-full"
          />
        );
      })}
    </div>
  );
}

function IconBubble({ children, accent = "primary" }) {
  const classes =
    accent === "accent"
      ? "bg-[color:var(--color-accent-400)] text-[color:var(--color-primary-950)]"
      : accent === "brand"
        ? "bg-[color:var(--color-primary-50)]"
        : "bg-[color:var(--color-primary-600)] text-white";
  return (
    <motion.div
      initial={{ scale: 0.6, rotate: -8 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ ...spring, delay: 0.04 }}
      className={`h-24 w-24 rounded-[28px] inline-flex items-center justify-center shadow-[var(--elev-2)] ${classes}`}
    >
      {children}
    </motion.div>
  );
}
