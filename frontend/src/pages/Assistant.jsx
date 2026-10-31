import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { Code2, ArrowRight, Send, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { askQuestion } from '../services/assistantService';
import BrainVisual from '../components/assistant/BrainVisual';
import './Assistant.css';

const SUGGESTIONS = [
  'Why does checkout use a state machine?',
  'What could this change break?',
  'Summarize recent decisions',
];

const RECENT_QUESTIONS = [
  'What changed in checkout this week?',
  'Which modules rely on auth?',
];

const MEMORY_STATS = [
  { value: '1,284', label: 'Files indexed' },
  { value: '8,942', label: 'Commits mapped' },
  { value: '248', label: 'Decisions captured' },
  { value: '96%', label: 'Evidence coverage' },
];

function TypingIndicator() {
  return (
    <div className="assistant-message assistant-message-assistant">
      <div className="assistant-message-bubble assistant-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `m-${Date.now()}-${idCounter}`;
}

export default function Assistant() {
  const location = useLocation();
  useProjects();
  const reduce = useReducedMotion();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, loading, reduce]);

  const handledStateRef = useRef(false);
  useEffect(() => {
    const q = location.state?.question;
    if (q && !handledStateRef.current) {
      handledStateRef.current = true;
      submit(q);
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps


  const submit = async (question) => {
    const q = (typeof question === 'string' ? question : input).trim();
    if (!q || loading) return;
    const userMsg = { id: nextId(), role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await askQuestion(q);
      const answer = res?.answer ?? 'No answer returned.';
      const sources = Array.isArray(res?.sources) ? res.sources : [];
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: answer, sources, preview: true }]);
      setLastSources(sources);
    } catch (e) {
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: `Something went wrong: ${e?.message || 'Unknown error'}`, error: true }]);
      setLastSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const evidenceLinked = lastSources.length > 0;

  return (
    <motion.div className="assistant-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <header className="assistant-header">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="assistant-eyebrow">YOUR AI DELIVERY PARTNER</div>
          <h1 className="assistant-title">Assistant</h1>
          <p className="assistant-subtitle">Ask anything about your codebase, decisions, and the history behind the work.</p>
        </motion.div>
        <motion.div className="assistant-status-pill" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <span className="assistant-status-dot" />
          Assistant UI Preview
        </motion.div>
      </header>

      <motion.div className="assistant-layout" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <section className="assistant-chat-panel">
          <div className="assistant-panel-top">
            <button type="button" className="assistant-project-selector">
              <Code2 size={14} />
              <span>project-brain · main</span>
            </button>
            <div className={`assistant-evidence-pill ${evidenceLinked ? 'linked' : ''}`}>
              {evidenceLinked ? 'Evidence linked' : 'No evidence yet'}
            </div>
          </div>

          <div className="assistant-chat-body">
            {messages.length === 0 && !loading ? (
              <motion.div className="assistant-empty-state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <BrainVisual reduce={reduce} />
                <h2 className="assistant-empty-title">What do you want to understand?</h2>
                <p className="assistant-empty-sub">Ask about decisions, risk, bugs, or the history behind a file.</p>
                <div className="assistant-suggestions">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button key={s} type="button" className="assistant-chip" onClick={() => submit(s)} whileHover={reduce ? {} : { y: -2 }} whileTap={reduce ? {} : { scale: 0.98 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}>
                      {s}
                      <ArrowRight size={13} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="assistant-messages">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div key={m.id} className={`assistant-message assistant-message-${m.role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <div className="assistant-message-bubble">
                        {m.preview && m.role === 'assistant' && !m.error && (
                          <span className="assistant-preview-tag">Preview</span>
                        )}
                        <div>{m.content}</div>
                        {m.sources && m.sources.length > 0 && (
                          <div className="assistant-sources">
                            {m.sources.map((src, i) => (
                              <span key={i} className="assistant-source">
                                {typeof src === 'string' ? src : src?.title || src?.path || 'source'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="assistant-composer">
            <textarea ref={textareaRef} className="assistant-input" placeholder="Ask the brain anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} disabled={loading} />
            <motion.button type="button" className="assistant-ask-btn" onClick={() => submit()} disabled={loading || !input.trim()} whileHover={reduce ? {} : { y: -1 }} whileTap={reduce ? {} : { scale: 0.98 }}>
              {loading ? <Loader2 size={14} className="assistant-spin" /> : <Send size={14} />}
              Ask brain
            </motion.button>
          </div>
        </section>

        <motion.aside className="assistant-memory-panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
          <motion.div className="assistant-memory-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <div className="assistant-card-title">Memory context</div>
            <div className="assistant-card-sub">What the brain is using</div>
            <div className="assistant-stats">
              {MEMORY_STATS.map((st) => (
                <div key={st.label} className="assistant-stat-row">
                  <span className="assistant-stat-value">{st.value}</span>
                  <span className="assistant-stat-label">{st.label}</span>
                </div>
              ))}
            </div>
            <div className="assistant-demo-note">Demo values — backend not connected</div>
          </motion.div>

          <motion.div className="assistant-memory-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
            <div className="assistant-card-title">Recent questions</div>
            <div className="assistant-card-sub">Your local session</div>
            <div className="assistant-recent-list">
              {RECENT_QUESTIONS.map((q) => (
                <motion.button key={q} type="button" className="assistant-recent-btn" onClick={() => submit(q)} whileHover={reduce ? {} : { x: 2 }} whileTap={reduce ? {} : { scale: 0.98 }}>
                  <span>{q}</span>
                  <ArrowRight size={13} />
                </motion.button>
              ))}
            </div>
            <div className="assistant-demo-note">Example prompts — no history yet</div>
          </motion.div>
        </motion.aside>
      </motion.div>
    </motion.div>
  );
}

