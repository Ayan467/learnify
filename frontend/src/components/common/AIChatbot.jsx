import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SYSTEM_PROMPT = `You are Alexa, a friendly AI learning assistant for Learnify — an online learning platform. 
Your role is to:
- Help students find courses that match their interests and goals
- Answer questions about programming, web development, data science, and tech topics
- Motivate and encourage learners
- Give study tips and learning strategies
- Answer general knowledge questions helpfully
- Greet users warmly (good morning/afternoon/evening based on context)
Keep responses concise, friendly, and encouraging. Use occasional emojis to be warm. 
When suggesting courses, mention that Learnify has React, Node.js, and MERN stack courses available.`;

const GREETING = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning! 🌅';
  if (hour < 17) return 'Good afternoon! ☀️';
  return 'Good evening! 🌙';
};

export default function AIChatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `${GREETING()} I'm **Alexa**, your AI learning assistant! 🤖\n\nI can help you find courses, answer questions, or just chat about tech. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

      if (!OPENAI_KEY) {
        // Fallback demo responses when no API key
        const demo = getDemoResponse(text);
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: demo }]);
          setLoading(false);
        }, 800);
        return;
      }

      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const reply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Simple suggested prompts
  const suggestions = [
    'What courses are available?',
    'How do I get started with React?',
    'Give me study tips',
    'What is the MERN stack?',
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-500 rounded-2xl shadow-lg shadow-primary-500/30 flex items-center justify-center transition-all duration-200 active:scale-90 group"
        title="Chat with Alexa AI"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.2 15.3" />
          </svg>
        )}
        {/* Pulse dot */}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-dark-900 animate-pulse-slow" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass-card flex flex-col shadow-2xl shadow-black/50 animate-slide-up"
          style={{ height: '520px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <div>
              <p className="font-display font-semibold text-white text-sm">Alexa</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                AI Assistant · Always online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white/5 text-slate-200 rounded-bl-sm border border-white/5'
                }`}>
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>
                      {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                      {j < m.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions (only at start) */}
            {messages.length === 1 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(send, 50); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:border-primary-500/40 hover:text-primary-400 transition-colors bg-white/3">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Alexa anything..."
                rows={1}
                className="flex-1 input-field resize-none text-sm py-2 min-h-[40px] max-h-24"
                style={{ lineHeight: '1.5' }}
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Demo responses when no OpenAI key
const getDemoResponse = (text) => {
  const t = text.toLowerCase();
  if (t.includes('course') || t.includes('learn')) return "We have amazing courses on React, Node.js, and the full MERN stack! 🚀 Check out the Courses page to browse. All courses include video lectures and quizzes!";
  if (t.includes('react')) return "React is a powerful JavaScript library for building UIs! 💡 We have a complete React course starting from basics all the way to hooks and context. It's free!";
  if (t.includes('hello') || t.includes('hi')) return `${GREETING()} Great to meet you! I'm Alexa, your learning companion. What would you like to learn today? 😊`;
  if (t.includes('tip') || t.includes('study')) return "Here are some great study tips! 📚\n1. Code along with lectures — don't just watch\n2. Take quizzes after each lecture\n3. Build small projects as you learn\n4. Stay consistent — even 30 mins/day adds up!";
  if (t.includes('mern')) return "MERN stands for MongoDB, Express, React, and Node.js — it's one of the most popular full-stack setups in 2024! We have a comprehensive MERN Masterclass course available. 🛠️";
  if (t.includes('certif')) return "You earn a certificate after completing all lectures and quizzes in a course! 🎓 Just hit 100% progress and your certificate will be available to download from your dashboard.";
  return "That's a great question! 🤔 I'm in demo mode right now (no OpenAI key configured), but once set up with a real API key I can answer anything. For now, browse our courses or chat with admin for help!";
};

const SendIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);
