export const spring = { type: "spring", stiffness: 380, damping: 32 };
export const springSoft = { type: "spring", stiffness: 260, damping: 28 };
export const ease = { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.26 };

export const sheetMotion = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: spring,
};

export const fadeMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
};

export const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: ease,
};

export const pressTap = { scale: 0.97 };

export function reduceMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
