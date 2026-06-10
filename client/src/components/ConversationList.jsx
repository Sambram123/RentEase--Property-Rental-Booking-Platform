import { FiMessageSquare, FiSearch, FiUser } from 'react-icons/fi';

const fmtTime = (d) => {
  const now = new Date();
  const date = new Date(d);
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=40';

const ConversationList = ({
  conversations,
  activeId,
  onSelect,
  currentUserId,
  searchQuery,
  onSearchChange,
  loading,
}) => {
  return (
    <div className="flex h-full flex-col border-r border-gray-100 bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
          <FiMessageSquare className="h-5 w-5 text-primary" />
          Messages
        </h2>
        {/* Search */}
        <div className="mt-3 relative">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="conversation-search"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 rounded-xl p-3">
                <div className="h-11 w-11 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-gray-100" />
                  <div className="h-3 w-40 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-4">
            <FiMessageSquare className="h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm font-medium text-secondary">No conversations yet</p>
            <p className="mt-1 text-xs text-muted">
              Start a conversation by contacting a property owner
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {conversations.map((conv) => {
              const otherUser = conv.participants?.find(
                (p) => p._id !== currentUserId
              );
              const unread =
                conv.unreadCounts?.[currentUserId] ?? 0;
              const isActive = conv._id === activeId;
              const propertyImg =
                conv.property?.images?.[0] || PLACEHOLDER;

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => onSelect(conv)}
                  id={`conversation-${conv._id}`}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    isActive
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.name}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                        <FiUser className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${unread > 0 ? 'font-bold text-secondary' : 'font-medium text-secondary'}`}>
                        {otherUser?.name || 'User'}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted">
                        {fmtTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`truncate text-xs mt-0.5 ${unread > 0 ? 'font-medium text-secondary' : 'text-muted'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {/* Property reference */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <img
                        src={propertyImg}
                        alt=""
                        className="h-4 w-4 rounded object-cover"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />
                      <span className="truncate text-[10px] text-muted">
                        {conv.property?.title || 'Property'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
