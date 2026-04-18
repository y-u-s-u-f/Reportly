import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PhotoCarousel({ photos, className = "" }) {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  function scrollToIndex(i) {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.children[i];
    target?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  const many = photos.length > 1;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 ${className}`}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth aspect-video"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {photos.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            loading="lazy"
            className="w-full shrink-0 snap-start object-cover"
          />
        ))}
      </div>

      {many && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 hover:bg-black/75 text-white inline-flex items-center justify-center disabled:opacity-0 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(photos.length - 1, index + 1))}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/55 hover:bg-black/75 text-white inline-flex items-center justify-center disabled:opacity-0 transition"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 tracking-wide">
            {index + 1} / {photos.length}
          </div>

          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
