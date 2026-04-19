export default function Logo({ className = "h-7 w-7" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-primary-500)" />
          <stop offset="1" stopColor="var(--color-primary-700)" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5c-6 0-10.5 4.3-10.5 10 0 7 8.2 15.1 9.9 16.7a1 1 0 0 0 1.3 0c1.7-1.6 9.8-9.7 9.8-16.7 0-5.7-4.5-10-10.5-10Z"
        fill="url(#logo-grad)"
      />
      <circle cx="16" cy="12.5" r="4" fill="var(--color-accent-400)" />
    </svg>
  );
}
