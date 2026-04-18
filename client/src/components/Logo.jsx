export default function Logo({ className = "h-7 w-7" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Reportly logo"
    >
      <path
        d="M16 2C9.92 2 5 6.92 5 13c0 7.5 9.6 15.5 10.1 15.85a1.4 1.4 0 0 0 1.8 0C17.4 28.5 27 20.5 27 13 27 6.92 22.08 2 16 2Z"
        fill="#01696f"
      />
      <circle cx="16" cy="13" r="6.5" fill="#ffffff" />
      <path
        d="m12.5 13 2.5 2.5L20 10.5"
        stroke="#01696f"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
