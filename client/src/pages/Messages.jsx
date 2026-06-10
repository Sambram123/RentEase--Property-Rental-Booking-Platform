import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { fetchConversations } from '../services/messageService';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations(searchQuery);
      setConversations(data.conversations || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-select conversation from URL params
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

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const handleMessageSent = () => {
    // Refresh conversation list to update lastMessage
    loadConversations();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        style={{ height: 'calc(100vh - 140px)', minHeight: '500px' }}
      >
        <div className="flex h-full">
          {/* Sidebar — conversations */}
          <div
            className={`h-full w-full flex-shrink-0 lg:w-[340px] lg:block ${
              mobileShowChat ? 'hidden' : 'block'
            }`}
          >
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?._id}
              onSelect={handleSelectConversation}
              currentUserId={user?._id}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              loading={loading}
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
                onMessageSent={handleMessageSent}
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
