import { Link } from 'react-router-dom';

/**
 * EmptyState — consistent empty state component for all pages.
 *
 * Supports both onClick actions and navigation links via `actionHref`.
 */
const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  compact = false,
}) => {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-12 px-4' : 'py-20 px-6'
      }`}
    >
      {/* Icon or emoji */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        {emoji ? (
          <span className="text-3xl" role="img" aria-hidden="true">{emoji}</span>
        ) : Icon ? (
          <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
        ) : null}
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-secondary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      )}

      {/* Action — supports either a Link (href) or button (onClick) */}
      {actionLabel && (
        actionHref ? (
          <Link
            to={actionHref}
            className="mt-5 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            {actionLabel}
          </Link>
        ) : action ? (
          <button
            type="button"
            onClick={action}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            {actionLabel}
          </button>
        ) : null
      )}
    </div>
  );
};

export default EmptyState;
