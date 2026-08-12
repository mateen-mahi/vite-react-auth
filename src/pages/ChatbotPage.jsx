import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSend, FiSquare, FiPlus, FiArrowLeft, FiCpu, FiUser, FiZap,
} from "react-icons/fi";
import api from "../services/api";
import "../styles/ChatbotPage.css";

// Extend this list (and the matching backend PROVIDERS registry in
// chatbot.controller.js) to add more models later — nothing else in this
// file needs to change.
const FALLBACK_PROVIDERS = [
  { id: "openai", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState(FALLBACK_PROVIDERS);
  const [provider, setProvider] = useState("openai");
  const [messages, setMessages] = useState([]); // { id, role: "user"|"assistant", content }
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  // Pull the live provider list from the backend registry, falling back to
  // the hardcoded list above if that fails — the page still works either way.
  useEffect(() => {
    api
      .get("/chatbot/providers")
      .then((res) => {
        if (res.data?.providers?.length) setProviders(res.data.providers);
      })
      .catch(() => {
        /* fallback list already set */
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    setInput("");

    const userMsg = { id: uid(), role: "user", content: text };
    const assistantMsgId = uid();
    const historyForRequest = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMsg, { id: assistantMsgId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${api.defaults.baseURL}/chatbot/message`, {
        method: "POST",
        credentials: "include", // sends the auth cookie, same as the shared axios instance
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, messages: historyForRequest }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "The chatbot didn't respond. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m))
        );
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User clicked Stop — not a real error, leave the partial answer as-is.
      } else {
        console.error("Chatbot error:", err);
        setError(err.message || "Something went wrong. Please try again.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId || m.content));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    if (streaming) stopStreaming();
    setMessages([]);
    setError(null);
  };

  return (
    <div className="cb-page">
      <div className="cb-header">
        <button className="cb-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <FiArrowLeft />
        </button>
        <div className="cb-header-title">
          <FiZap className="cb-header-icon" />
          <div>
            <h1>AI Study Assistant</h1>
            <p>Ask questions, get explanations, or brainstorm — pick a model below.</p>
          </div>
        </div>
        <button className="cb-new-chat-btn" onClick={handleNewChat}>
          <FiPlus /> New Chat
        </button>
      </div>

      <div className="cb-provider-row">
        {providers.map((p) => (
          <button
            key={p.id}
            className={`cb-provider-pill ${provider === p.id ? "active" : ""}`}
            onClick={() => setProvider(p.id)}
            disabled={streaming}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="cb-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="cb-empty-state">
            <FiCpu />
            <p className="cb-empty-title">Ask me anything</p>
            <p className="cb-empty-sub">
              Try: "Explain recursion like I'm new to programming" or "Summarize this week's lecture topic."
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`cb-message-row ${m.role}`}>
              <div className={`cb-avatar ${m.role}`}>
                {m.role === "user" ? <FiUser /> : <FiCpu />}
              </div>
              <div className="cb-bubble">
                {m.content || (streaming && <span className="cb-typing-dots"><span /><span /><span /></span>)}
              </div>
            </div>
          ))
        )}
        {error && <p className="cb-error">{error}</p>}
      </div>

      <div className="cb-input-row">
        <textarea
          className="cb-input"
          placeholder="Type your message… (Enter to send, Shift+Enter for a new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={streaming}
        />
        {streaming ? (
          <button className="cb-send-btn stop" onClick={stopStreaming} title="Stop generating">
            <FiSquare />
          </button>
        ) : (
          <button className="cb-send-btn" onClick={handleSend} disabled={!input.trim()} title="Send">
            <FiSend />
          </button>
        )}
      </div>
    </div>
  );
}
