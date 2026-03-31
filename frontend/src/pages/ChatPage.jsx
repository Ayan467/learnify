import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user } = useAuth();
  const { messages, fetchMessages, fetchConversations, conversations, sendMessage, emitTyping, markRead, isOnline, typingUsers } = useChat();
  const navigate = useNavigate();

  const [chatTarget, setChatTarget] = useState(null); // for student: the admin; for admin: selected student
  const [adminUser, setAdminUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      // Student: load admin user
      const loadAdmin = async () => {
        try {
          const { data } = await adminAPI.getStats(); // we just need admin context
          // Actually fetch conversations to find admin
          await fetchConversations();
        } catch {}
      };
      // For simplicity, students message a fixed admin. We'll load admin via conversations or seed
      // Students: find the admin from conversations or hard-code target as first admin
      fetchConversations().then(() => {});
      // Load an admin to chat with by fetching admin info via a public endpoint isn't available
      // So we store admin info in a workaround: fetch all conversations
    } else {
      // Admin: load all students
      const loadStudents = async () => {
        const { data } = await adminAPI.getStudents();
        setStudents(data.data.students);
      };
      loadStudents();
      fetchConversations();
    }
  }, [user]);

  // Student: auto-select first conversation (with admin) or find admin
  useEffect(() => {
    if (user?.role === 'student' && conversations.length > 0 && !chatTarget) {
      const adminConv = conversations.find(c => c._id?.role === 'admin');
      if (adminConv) setChatTarget(adminConv._id);
    }
  }, [conversations, user]);

  useEffect(() => {
    if (chatTarget) {
      fetchMessages(chatTarget._id);
      markRead(chatTarget._id);
    }
  }, [chatTarget]);

  const handleSend = () => {
    if (!input.trim() || !chatTarget) return;
    sendMessage(chatTarget._id, input.trim());
    setInput('');
    emitTyping(chatTarget._id, false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (chatTarget) {
      emitTyping(chatTarget._id, true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => emitTyping(chatTarget._id, false), 2000);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const myMessages = messages.filter(m => {
    if (!chatTarget) return false;
    const s = m.sender?._id || m.sender;
    const r = m.receiver?._id || m.receiver;
    return (s === user._id && r === chatTarget._id) || (s === chatTarget._id && r === user._id);
  });

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-6 h-screen flex flex-col">
        <div className="glass-card flex-1 flex overflow-hidden min-h-0">

          {/* Sidebar: conversations */}
          <div className="w-64 xl:w-72 border-r border-white/5 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-display font-semibold text-white text-base">
                {user?.role === 'admin' ? 'Students' : 'Support Chat'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{user?.role === 'admin' ? `${students.length} students` : 'Chat with admin'}</p>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {user?.role === 'admin' ? (
                students.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center py-8">No students yet</p>
                ) : (
                  students.map(s => (
                    <button key={s._id} onClick={() => setChatTarget(s)}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${chatTarget?._id === s._id ? 'bg-primary-600/10 border-r-2 border-primary-500' : 'hover:bg-white/3'}`}>
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
                          {s.name[0]}
                        </div>
                        {isOnline(s._id) && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      </div>
                    </button>
                  ))
                )
              ) : (
                // Student view: show conversations
                conversations.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-slate-600 text-xs mb-3">No messages yet</p>
                    <p className="text-slate-500 text-xs">Send a message to get support from our admin team.</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button key={conv._id?._id} onClick={() => setChatTarget(conv._id)}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${chatTarget?._id === conv._id?._id ? 'bg-primary-600/10 border-r-2 border-primary-500' : 'hover:bg-white/3'}`}>
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                          {conv._id?.name?.[0] || 'A'}
                        </div>
                        {isOnline(conv._id?._id) && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{conv._id?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="min-w-[20px] h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  ))
                )
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {chatTarget ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                      {chatTarget.name?.[0] || '?'}
                    </div>
                    {isOnline(chatTarget._id) && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-800" />}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{chatTarget.name}</p>
                    <p className="text-xs text-slate-500">
                      {typingUsers[chatTarget._id] ? <span className="text-primary-400">typing...</span> :
                       isOnline(chatTarget._id) ? <span className="text-emerald-400">Online</span> : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {myMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-slate-500 text-sm">No messages yet.<br />Say hello to get started!</p>
                    </div>
                  )}
                  {myMessages.map((msg, i) => {
                    const isMine = (msg.sender?._id || msg.sender) === user._id;
                    return (
                      <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] group`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white/5 text-slate-200 border border-white/5 rounded-bl-sm'
                          }`}>
                            {msg.message}
                          </div>
                          <p className={`text-[10px] text-slate-600 mt-1 ${isMine ? 'text-right' : 'text-left'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            {formatTime(msg.createdAt)}
                            {isMine && msg.isRead && ' · seen'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey}
                      placeholder={`Message ${chatTarget.name}...`}
                      rows={1}
                      className="flex-1 input-field resize-none text-sm py-2.5 min-h-[44px] max-h-28"
                      style={{ lineHeight: '1.5' }}
                    />
                    <button onClick={handleSend} disabled={!input.trim()}
                      className="w-11 h-11 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="text-5xl mb-4">💬</div>
                <h3 className="font-display font-semibold text-white text-xl mb-2">
                  {user?.role === 'admin' ? 'Select a student' : 'Start a conversation'}
                </h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  {user?.role === 'admin'
                    ? 'Choose a student from the sidebar to view and reply to their messages.'
                    : 'Chat with our admin team for course support and help.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SendIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);
