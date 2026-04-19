export default function EmptyState({ icon, title, subtitle, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
    >
      {icon && (
        <div className="h-16 w-16 rounded-full bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-600)] inline-flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="font-display text-[26px] leading-tight ink mb-2">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm ink-muted max-w-xs leading-relaxed">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
