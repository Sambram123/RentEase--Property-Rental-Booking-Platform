/**
 * EmptyState — consistent empty state component for all pages
 */
const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  actionLabel,
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-12 px-4' : 'py-20 px-6'
      }`}
    >
      {/* Icon or emoji */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        {emoji ? (
          <span className="text-3xl">{emoji}</span>
        ) : Icon ? (
          <Icon className="h-8 w-8 text-gray-400" />
        ) : null}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-secondary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      )}

      {/* Action button */}
      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
