import { FiUser, FiCheck } from 'react-icons/fi';

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const StatusReceipt = ({ status, isRead }) => {
  const currentStatus = isRead || status === 'read' ? 'read' : status;

  if (currentStatus === 'read') {
    return (
      <span className="inline-flex text-sky-200" title="Read">
        <span className="flex">
          <FiCheck className="h-3.5 w-3.5 -mr-2" />
          <FiCheck className="h-3.5 w-3.5" />
        </span>
      </span>
    );
  }
  if (currentStatus === 'delivered') {
    return (
      <span className="inline-flex text-white/40" title="Delivered">
        <span className="flex">
          <FiCheck className="h-3.5 w-3.5 -mr-2" />
          <FiCheck className="h-3.5 w-3.5" />
        </span>
      </span>
    );
  }
  // 'sent' or default
  return (
    <span className="inline-flex text-white/40" title="Sent">
      <FiCheck className="h-3.5 w-3.5" />
    </span>
  );
};

const MessageBubble = ({ message, isOwn, onDelete }) => {
  const sender = message.sender;

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="shrink-0 mt-auto">
          {sender?.avatar ? (
            <img
              src={sender.avatar}
              alt={sender.name}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <FiUser className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`group relative max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-gray-100 text-secondary rounded-bl-md'
          }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
        <div className={`mt-1 flex items-center gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-muted'}`}>
            {fmtTime(message.createdAt)}
          </span>
          {isOwn && (
            <StatusReceipt status={message.status} isRead={message.isRead} />
          )}
        </div>

        {/* Delete on hover (own messages) */}
        {isOwn && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message._id)}
            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition rounded-full bg-white border border-gray-200 h-6 w-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm"
            title="Delete message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Date separator component
export const DateSeparator = ({ date }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 border-t border-gray-100" />
    <span className="text-[10px] font-medium text-muted bg-white px-2 rounded-full border border-gray-50 py-0.5">
      {fmtDate(date)}
    </span>
    <div className="flex-1 border-t border-gray-100" />
  </div>
);

export default MessageBubble;
