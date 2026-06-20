import { memo, useCallback } from 'react';
import { FiMessageSquare, FiSearch, FiUser, FiTrash2, FiArchive, FiInbox } from 'react-icons/fi';
import { useChat } from '../context/ChatContext';
import { getUserAvatar } from '../utils/avatar';


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

const ConversationList = memo(({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onArchive,
  currentUserId,
  searchQuery,
  onSearchChange,
  loading,
  showArchived,
  onToggleArchived,
}) => {
  const { onlineUsers, typingUsers } = useChat();

  return (
    <div className="flex h-full flex-col border-r border-gray-100 bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-secondary">
          <FiMessageSquare className="h-5 w-5 text-primary" />
          Messages
        </h2>
        {/* Search & Toggle Archived */}
        <div className="flex items-center justify-between mt-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 pl-10 pr-4 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              id="conversation-search"
            />
          </div>
          <button
            type="button"
            onClick={onToggleArchived}
            className={`ml-2 px-3 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
              showArchived
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-white border-gray-200 text-secondary hover:bg-gray-50'
            }`}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
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
            <p className="mt-3 text-sm font-medium text-secondary">
              {showArchived ? 'No archived chats' : 'No conversations yet'}
            </p>
            {!showArchived && (
              <p className="mt-1 text-xs text-muted">
                Start a conversation by contacting a property owner
              </p>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => {
              const otherUser = conv.participants?.find(
                (p) => p._id !== currentUserId
              );
              
              // Unread count
              const unread = conv.unreadCounts?.[currentUserId] ?? 0;
              const isActive = conv._id === activeId;
              const propertyImg = conv.property?.images?.[0] || PLACEHOLDER;
              const avatar = otherUser ? getUserAvatar(otherUser) : '';

              // Real-time states from context
              const presence = onlineUsers.get(otherUser?._id?.toString());
              const isOnline = presence?.isOnline ?? false;
              const isTyping = typingUsers[conv._id]?.has(otherUser?._id);

              return (
                <div
                  key={conv._id}
                  className={`group flex items-center justify-between rounded-xl px-2 py-2.5 transition border ${
                    isActive
                      ? 'bg-primary/5 border-primary/20'
                      : 'hover:bg-gray-50/80 border-transparent'
                  }`}
                >
                  {/* Select button */}
                  <button
                    type="button"
                    onClick={() => onSelect(conv)}
                    id={`conversation-${conv._id}`}
                    className="flex flex-1 items-center gap-3 text-left min-w-0"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={otherUser?.name}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                          <FiUser className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      
                      {/* Online dot indicator */}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                      )}

                      {/* Unread count badge */}
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
                          {conv.lastMessageAt ? fmtTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      
                      {/* Typing indicator or message preview */}
                      {isTyping ? (
                        <p className="truncate text-xs mt-0.5 text-green-600 font-medium animate-pulse">
                          typing...
                        </p>
                      ) : (
                        <p className={`truncate text-xs mt-0.5 ${unread > 0 ? 'font-semibold text-secondary' : 'text-muted'}`}>
                          {conv.lastMessage || 'No messages yet'}
                        </p>
                      )}
                      
                      {/* Property reference */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <img
                          src={propertyImg}
                          alt=""
                          className="h-3.5 w-3.5 rounded object-cover"
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                        />
                        <span className="truncate text-[10px] text-muted">
                          {conv.property?.title || 'Property'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Actions (visible on hover) */}
                  <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(conv._id, !showArchived);
                      }}
                      title={showArchived ? 'Unarchive' : 'Archive'}
                      className="p-1 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition"
                    >
                      {showArchived ? <FiInbox className="h-3.5 w-3.5" /> : <FiArchive className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv._id);
                      }}
                      title="Delete Conversation"
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ConversationList.displayName = 'ConversationList';

export default ConversationList;
