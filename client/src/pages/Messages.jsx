import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { deleteConversationApi, archiveConversationApi } from '../services/messageService';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations, setConversations, loadingConversations, refreshConversations } = useChat();

  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Auto-select conversation from URL params (?conversation=id)
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === convId);
      if (conv) {
        setActiveConversation(conv);
        setMobileShowChat(true);
      }
    }
  }, [searchParams, conversations]);

  // If search query changes, reload conversations from backend
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      refreshConversations();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, showArchived, refreshConversations]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
    // Sync to query param
    setSearchParams({ conversation: conv._id });
  };

  const handleBack = () => {
    setMobileShowChat(false);
    setActiveConversation(null);
    setSearchParams({});
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This will delete all messages.')) return;
    try {
      await deleteConversationApi(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMobileShowChat(false);
        setSearchParams({});
      }
      toast.success('Conversation deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete conversation');
    }
  };

  const handleArchiveConversation = async (conversationId, archive) => {
    try {
      await archiveConversationApi(conversationId, archive);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMobileShowChat(false);
        setSearchParams({});
      }
      toast.success(archive ? 'Conversation archived' : 'Conversation unarchived');
    } catch (err) {
      toast.error(err.message || 'Failed to archive conversation');
    }
  };

  // Filter conversations locally by search query if needed as fallback, or use raw list
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const otherParticipant = c.participants.find((p) => p._id !== user?._id);
    const matchUser = otherParticipant?.name?.toLowerCase().includes(q);
    const matchProperty = c.property?.title?.toLowerCase().includes(q);
    return matchUser || matchProperty;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
      <div
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        style={{ height: 'calc(100dvh - 140px)', minHeight: '400px' }}
      >
        <div className="flex h-full">
          {/* Sidebar — conversations */}
          <div
            className={`h-full w-full flex-shrink-0 lg:w-[340px] lg:block ${
              mobileShowChat ? 'hidden' : 'block'
            }`}
          >
            <ConversationList
              conversations={filteredConversations}
              activeId={activeConversation?._id}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
              onArchive={handleArchiveConversation}
              currentUserId={user?._id}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              loading={loadingConversations}
              showArchived={showArchived}
              onToggleArchived={() => setShowArchived(!showArchived)}
            />
          </div>

          {/* Chat window */}
          <div
            className={`h-full flex-1 lg:block ${
              mobileShowChat ? 'block' : 'hidden'
            }`}
          >
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                currentUserId={user?._id}
                onBack={handleBack}
                onMessageSent={refreshConversations}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-50/30">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <FiMessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <p className="mt-5 text-lg font-semibold text-secondary">
                    Your Messages
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Select a conversation from the sidebar to start chatting, or contact a property owner to begin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
