import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Bot, Sparkles, Send, Copy, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Strands from '../ui/Strands';

export default function RelayAiModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { activeUser, messages: chatHistory, sendMessage } = useChat();

  const [selectedTone, setSelectedTone] = useState('Professional');

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am Relay AI, your intelligent messaging assistant. ${
        activeUser ? `I am synced with your conversation with ${activeUser.username}.` : 'How can I assist your communications today?'
      }`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [insertedId, setInsertedId] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const activeName = activeUser?.username || 'your contact';

  // Smart AI Engine Logic (Clean text without asterisks or emojis)
  const buildAiResponse = (queryText, toneOverride = selectedTone) => {
    const lower = queryText.toLowerCase();

    // 1. CHAT SUMMARIZER
    if (lower.includes('summarize') || lower.includes('summary')) {
      if (!chatHistory || chatHistory.length === 0) {
        return `Chat Summary Report\n\nNo message history found in your active conversation with ${activeName}. Select a contact with messages in the sidebar to generate an instant AI breakdown!`;
      }

      const recentMsgs = chatHistory.slice(-8);
      const userCount = recentMsgs.filter((m) => m.sender_id === profile?.id).length;
      const partnerCount = recentMsgs.length - userCount;
      const lastContent = recentMsgs[recentMsgs.length - 1]?.content || '';

      return `Live Chat Summary (${activeName})\n\n` +
        `Key Highlights:\n` +
        `- Total Messages Analyzed: ${chatHistory.length} messages\n` +
        `- Activity Ratio: You (${userCount}) vs ${activeName} (${partnerCount})\n` +
        `- Latest Message: "${lastContent.slice(0, 80)}${lastContent.length > 80 ? '...' : ''}"\n\n` +
        `Recommended Action:\nFollow up on pending points or click below to send a reply!`;
    }

    // 2. DRAFTS & REPLIES
    if (lower.includes('draft') || lower.includes('polite') || lower.includes('reply') || lower.includes('write')) {
      if (toneOverride === 'Professional') {
        return `Professional Response Draft:\n\n` +
          `"Hi ${activeName}, thank you for your message. I have noted your update and will verify the details shortly. Let me know if any immediate assistance is required in the interim."`;
      } else if (toneOverride === 'Friendly') {
        return `Friendly Response Draft:\n\n` +
          `"Hey ${activeName}! Thanks for checking in. Everything looks great on my end. Catching up with you shortly!"`;
      } else if (toneOverride === 'Concise') {
        return `Direct Response Draft:\n\n` +
          `"Got it, ${activeName}. Reviewing now and will follow up shortly. Thanks!"`;
      } else {
        return `Response Draft:\n\n` +
          `"Hey ${activeName}, thanks for keeping me posted. I am reviewing this right now and will get back to you in just a moment."`;
      }
    }

    // 3. TRANSLATIONS
    if (lower.includes('translate') || lower.includes('spanish') || lower.includes('french') || lower.includes('japanese') || lower.includes('language')) {
      const sample = chatHistory[chatHistory.length - 1]?.content || queryText;
      return `Multilingual Translation Engine\n\n` +
        `Source Text: "${sample}"\n\n` +
        `- Spanish: "Hola, gracias por tu mensaje. Lo revisaré de inmediato."\n` +
        `- French: "Bonjour, merci pour votre message. Je vais vérifier cela sous peu."\n` +
        `- Japanese: "ご連絡ありがとうございます。間もなく確認いたします。"\n` +
        `- German: "Hallo, danke für Ihre Nachricht. Ich werde das in Kürze überprüfen."`;
    }

    // 4. SECURITY & SYSTEM SPECS
    if (lower.includes('webrtc') || lower.includes('encryption') || lower.includes('security') || lower.includes('privacy')) {
      return `Relay Security & Privacy Specs\n\n` +
        `- P2P Audio Calls: End-to-end encrypted WebRTC audio streams via DTLS-SRTP.\n` +
        `- Row-Level Security: PostgreSQL database isolated per-user via
         RLS policies.\n` +
        `- Session Safety: Token state persistence saved locally in browser storage.\n` +
        `- Realtime Messaging: WebSocket protocol with instant delivery confirmation.`;
    }

    // 5. PRODUCTIVITY TIPS
    if (lower.includes('tip') || lower.includes('productivity') || lower.includes('help')) {
      return `Messaging Productivity Tips\n\n` +
        `1. Voice Calls: Switch to P2P voice calling for high-density discussions.\n` +
        `2. Search Filter: Triage unread messages via the sidebar filter bar.\n` +
        `3. One-Click Send: Draft responses here and click "Send to Chat" to dispatch them instantly!`;
    }

    // DEFAULT RESPONSE
    return `Relay AI Assistant\n\n` +
      `I processed your query regarding: "${queryText}".\n\n` +
      `Here is how I can assist your messaging with ${activeName}:\n` +
      `- Draft Replies: Select a tone (Professional, Friendly, Concise) to auto-generate replies.\n` +
      `- Summarize Chat: Extract key action points from your active conversation.\n` +
      `- Live Translation: Translate messages across 5+ languages.\n\n` +
      `Click any action button below or type a custom prompt!`;
  };

  // Streaming Text Effect
  const streamAiResponse = (fullText) => {
    const aiMsgId = (Date.now() + 1).toString();
    const newMsg = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(false);

    let index = 0;
    const speedMs = 12;

    const timer = setInterval(() => {
      index += 3;
      if (index >= fullText.length) {
        index = fullText.length;
        clearInterval(timer);
      }

      const currentChunk = fullText.slice(0, index);
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, text: currentChunk } : m))
      );
      scrollToBottom();
    }, speedMs);
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    const fullResponse = buildAiResponse(query.trim());

    setTimeout(() => {
      streamAiResponse(fullResponse);
    }, 350);
  };

  const handleCopyToClipboard = (id, text) => {
    const cleanText = text.replace(/[*#]/g, '').trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertToChat = (id, text) => {
    if (!activeUser) return;
    const match = text.match(/"([^"]+)"/);
    const draftText = match ? match[1] : text.replace(/[*#]/g, '').trim();

    if (sendMessage) {
      sendMessage(draftText);
      setInsertedId(id);
      setTimeout(() => setInsertedId(null), 2500);
    }
  };

  const SUGGESTIONS = [
    { label: 'Summarize Chat', prompt: 'Summarize our active chat' },
    { label: 'Draft Reply', prompt: 'Draft a polite reply for my contact' },
    { label: 'Translate', prompt: 'Translate message to Spanish and French' },
    { label: 'Security Specs', prompt: 'Explain Relay WebRTC encryption' },
    { label: 'Productivity Tips', prompt: 'Give me 3 messaging productivity tips' },
  ];

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1050 }} onClick={onClose}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '560px',
          width: '92%',
          height: '600px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          background: isDark ? 'var(--bg-header)' : '#ffffff',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            background: 'var(--bg-sidebar)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                flexShrink: 0,
              }}
            >
              <Bot size={22} />
            </div>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Relay AI Assistant
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    lineHeight: 1.3,
                  }}
                >
                  v2.5 Neural Engine
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 0,
              flexShrink: 0,
              marginLeft: '16px',
            }}
            title="Close Assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tone Selection Bar */}
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.4px' }}>DRAFT TONE:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Professional', 'Friendly', 'Concise'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTone(t)}
                style={{
                  fontSize: '11px',
                  fontWeight: selectedTone === t ? 600 : 500,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: selectedTone === t ? 'rgba(0, 168, 132, 0.18)' : 'var(--bg-input)',
                  color: selectedTone === t ? '#00a884' : 'var(--text-secondary)',
                  border: selectedTone === t ? '1px solid rgba(0, 168, 132, 0.4)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area Wrapper with Fixed Strands WebGL Background */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* One Single Big Strands WebGL Background Fixed in Area */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              opacity: 0.35,
              zIndex: 0,
            }}
          >
            <Strands
              colors={["#F97316", "#7C3AED", "#06B6D4"]}
              count={3}
              speed={0.5}
              amplitude={1}
              waviness={1}
              thickness={0.7}
              glow={2.6}
              taper={3}
              spread={1}
              intensity={0.6}
              saturation={2}
              opacity={1}
              scale={1.5}
              glass={false}
              refraction={1}
              dispersion={1}
              glassSize={1}
              hueShift={0}
            />
          </div>

          {/* Scrollable Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              zIndex: 1,
            }}
          >

          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  gap: '10px',
                  alignSelf: isAi ? 'flex-start' : 'flex-end',
                  maxWidth: '88%',
                }}
              >
                {isAi && (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Bot size={15} />
                  </div>
                )}

                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    borderTopLeftRadius: isAi ? 0 : '12px',
                    borderTopRightRadius: isAi ? '12px' : 0,
                    background: isAi ? 'var(--bg-input)' : 'var(--accent-green)',
                    color: isAi ? 'var(--text-primary)' : '#ffffff',
                    border: isAi ? '1px solid var(--border-color)' : 'none',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <div>{m.text}</div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      marginTop: '8px',
                      gap: '12px',
                      paddingTop: '6px',
                      borderTop: isAi ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '10.5px', opacity: 0.7 }}>{m.time}</span>

                    {isAi && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(m.id, m.text)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            padding: 0,
                          }}
                          title="Copy message to clipboard"
                        >
                          {copiedId === m.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                color: '#00a884',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '8px 12px',
                background: 'rgba(0, 168, 132, 0.1)',
                borderRadius: '8px',
                width: 'fit-content',
              }}
            >
              <Sparkles size={16} className="animate-spin" />
              <span>Relay AI is thinking...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

        {/* Interactive Suggestion Prompt Chips */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          style={{
            padding: '10px 16px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            background: 'var(--bg-sidebar)',
            borderTop: '1px solid var(--border-color)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(item.prompt)}
              style={{
                fontSize: '12px',
                padding: '6.5px 14px',
                borderRadius: '16px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-green)';
                e.currentTarget.style.background = 'var(--bg-active)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-input)';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '10px',
            background: 'var(--bg-header)',
          }}
        >
          <input
            type="text"
            placeholder={`Ask Relay AI`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: input.trim() ? 'var(--accent-green)' : 'var(--bg-input)',
              border: 'none',
              color: '#ffffff',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'grid',
              placeItems: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
