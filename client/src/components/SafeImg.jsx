import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function SafeImg({ src, alt = "", className = "", fallbackClassName = "", fallback, ...rest }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (fallback) return fallback;
    return (
      <div
        className={`inline-flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 ${fallbackClassName || className}`}
        aria-label="Photo unavailable"
      >
        <ImageOff size={20} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
