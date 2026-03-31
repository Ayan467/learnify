import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { chatAPI } from '../utils/api';
import { getSocket } from '../utils/socket';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimers = useRef({});

  // Socket listeners
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const onMessage = (msg) => {
      setMessages(prev => {
        const exists = prev.find(m => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
      // Increment unread if not in active conversation
      const otherId = msg.sender?._id || msg.sender;
      if (otherId !== user._id && otherId !== activeConversation?._id) {
        setUnreadCount(c => c + 1);
      }
    };

    const onOnline = (users) => setOnlineUsers(users);

    const onTyping = ({ senderId, isTyping }) => {
      setTypingUsers(prev => ({ ...prev, [senderId]: isTyping }));
      if (isTyping) {
        clearTimeout(typingTimers.current[senderId]);
        typingTimers.current[senderId] = setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [senderId]: false }));
        }, 3000);
      }
    };

    socket.on('chat:message', onMessage);
    socket.on('users:online', onOnline);
    socket.on('chat:typing', onTyping);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('users:online', onOnline);
      socket.off('chat:typing', onTyping);
    };
  }, [user, activeConversation]);

  const fetchMessages = useCallback(async (userId) => {
    try {
      const { data } = await chatAPI.getMessages(userId);
      setMessages(data.data.messages);
    } catch {}
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await chatAPI.getConversations();
      setConversations(data.data.conversations);
    } catch {}
  }, []);

  const sendMessage = useCallback((receiverId, message) => {
    const socket = getSocket();
    socket.emit('chat:send', {
      senderId: user._id,
      receiverId,
      message,
    });
  }, [user]);

  const emitTyping = useCallback((receiverId, isTyping) => {
    const socket = getSocket();
    socket.emit('chat:typing', { senderId: user._id, receiverId, isTyping });
  }, [user]);

  const markRead = useCallback((senderId) => {
    const socket = getSocket();
    socket.emit('chat:read', { senderId, receiverId: user._id });
    setUnreadCount(0);
  }, [user]);

  const isOnline = useCallback((userId) => onlineUsers.includes(userId), [onlineUsers]);

  return (
    <ChatContext.Provider value={{
      messages, conversations, activeConversation, onlineUsers, unreadCount, typingUsers,
      setActiveConversation, fetchMessages, fetchConversations,
      sendMessage, emitTyping, markRead, isOnline,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
