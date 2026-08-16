import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiX, FiSend, FiAlertCircle, FiTrash2 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/ChatWidget.css";

const API_BASE = api.defaults?.baseURL || "/api/v1";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! I can help with questions about using Learnix platform, or general education topics. What do you need?",
};

export default function ChatWidget() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // All hooks run unconditionally, every render — the logged-out gate
  // below must stay AFTER them, never before, or React's hook order
  // breaks between renders.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  // Logged-out visitors don't get the chatbot at all — nothing renders.
  if (!user) return null;

  const clearConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  };

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);

    const historyForRequest = messages
      .filter((m) => m !== WELCOME_MESSAGE)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "assistant", text: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // matches api.js's withCredentials: true (cookie auth)
        body: JSON.stringify({ message: trimmed, history: historyForRequest }),
      });

      if (res.status === 401) {
        throw new Error("Your session expired — please log in again.");
      }
      if (!res.ok || !res.body) {
        throw new Error("The assistant is temporarily unavailable.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, text: last.text + chunk };
          return next;
        });
      }
    } catch (err) {
      setError(err.message || "Couldn't reach the assistant. Try again.");
      // Drop the empty placeholder bubble instead of leaving a blank one.
      setMessages((prev) =>
        prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant" && m.text === ""))
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-grow the textarea up to a max height, then scroll internally.
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || streaming) return;
    send(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <button
        className="cw-bubble"
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
      >
        {open ? <FiX /> : <FiMessageCircle />}
      </button>

      {open && (
        <div className="cw-panel" role="dialog" aria-label="Platform assistant chat">
          <div className="cw-header">
            <div>
              <span className="cw-header-title">Platform Assistant</span>
              <span className="cw-header-sub">Software &amp; education questions only</span>
            </div>
            <button
              className="cw-clear-btn"
              onClick={clearConversation}
              disabled={streaming}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <FiTrash2 />
            </button>
          </div>

          <div className="cw-messages" ref={scrollRef}>
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const isStreamingPlaceholder = streaming && i === messages.length - 1;

              return (
                <div key={i} className={`cw-bubble-msg ${isUser ? "user" : "assistant"}`}>
                  {m.text ? (
                    isUser ? (
                      // User's own typed text — render as plain text, not
                      // markdown, so it always shows exactly what they typed.
                      m.text
                    ) : (
                      // Assistant replies come back as markdown (Gemini
                      // formats naturally) — render it properly instead of
                      // showing raw **asterisks** and bullet dashes.
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.text}</ReactMarkdown>
                    )
                  ) : isStreamingPlaceholder ? (
                    <span className="cw-typing">•••</span>
                  ) : (
                    ""
                  )}
                </div>
              );
            })}
            {error && (
              <div className="cw-error">
                <FiAlertCircle /> {error}
              </div>
            )}
          </div>

          <form className="cw-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="cw-input"
              placeholder="Ask about a course, feature, or topic…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              rows={1}
            />
            <button className="cw-send-btn" type="submit" disabled={streaming || !input.trim()}>
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </>
  );
}