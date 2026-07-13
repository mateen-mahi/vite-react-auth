// import { useState, useEffect, useRef, useCallback } from "react";
// import { useAuth } from "../context/AuthContext";
// import api from "../services/api";
// import {
//   FiSend, FiSearch, FiGlobe, FiMessageCircle,
//   FiX, FiAlertCircle, FiRefreshCw,
// } from "react-icons/fi";
// import "../styles/chat.css";



// const formatTime = (ts) =>
//   ts
//     ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//     : "";

// const formatDay = (ts) => {
//   if (!ts) return "";
//   const d = new Date(ts);
//   const today = new Date();
//   const yesterday = new Date(today);
//   yesterday.setDate(today.getDate() - 1);
//   if (d.toDateString() === today.toDateString()) return "Today";
//   if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
//   return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
// };

// // ─── Message bubble ────────────────────────────────────────────────────────
// function MessageBubble({ message, currentUserId, showName = true }) {
//   const isOwn = message.senderId === currentUserId;
//   const initial = (message.sender || "?")[0].toUpperCase();

//   return (
//     <div className={`chat-message ${isOwn ? "own" : "other"}`}>
//       {!isOwn && (
//         <div className="chat-msg-avatar" title={message.sender}>
//           {initial}
//         </div>
//       )}
//       <div className="chat-bubble-wrap">
//         {!isOwn && showName && (
//           <p className="chat-sender-name">{message.sender}</p>
//         )}
//         <div className={`chat-bubble ${isOwn ? "own" : "other"}`}>
//           {message.text}
//         </div>
//         <p className={`chat-timestamp ${isOwn ? "own" : ""}`}>
//           {formatTime(message.timestamp)}
//         </p>
//       </div>
//     </div>
//   );
// }

// // ─── Day separator ──────────────────────────────────────────────────────────
// function DaySeparator({ label }) {
//   return (
//     <div className="chat-day-sep">
//       <span>{label}</span>
//     </div>
//   );
// }

// // Groups messages by day for inserting day separators
// function groupByDay(messages) {
//   const groups = [];
//   let lastDay = null;
//   messages.forEach((msg) => {
//     const day = formatDay(msg.timestamp);
//     if (day !== lastDay) {
//       groups.push({ type: "separator", label: day, key: `sep-${msg.timestamp}` });
//       lastDay = day;
//     }
//     groups.push({ type: "message", data: msg, key: msg.id });
//   });
//   return groups;
// }

// // ─── Shared input bar ──────────────────────────────────────────────────────
// function InputBar({ value, onChange, onSend, placeholder, disabled }) {
//   return (
//     <div className="chat-input-bar">
//       <input
//         className="chat-input"
//         placeholder={placeholder}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && !disabled && onSend()}
//         disabled={disabled}
//       />
//       <button
//         className="chat-send-btn"
//         onClick={onSend}
//         disabled={disabled || !value.trim()}
//         title="Send"
//       >
//         <FiSend />
//       </button>
//     </div>
//   );
// }

// // ─── Global Chat ───────────────────────────────────────────────────────────
// function GlobalChat({ user, emitEvent, onEvent, isConnected }) {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const processedIds = useRef(new Set());
//   const counter = useRef(0);
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     const cleanup = onEvent("receive-global-message", (msg) => {
//       if (processedIds.current.has(msg.id)) return;
//       processedIds.current.add(msg.id);
//       setMessages((prev) => [...prev, msg]);
//     });
//     return cleanup;
//   }, [onEvent]);

//   const send = useCallback(() => {
//     if (!input.trim() || !isConnected) return;
//     const id = `global-${Date.now()}-${counter.current++}`;
//     const msg = {
//       id,
//       text: input.trim(),
//       sender: user.username,
//       senderId: user._id,
//       timestamp: new Date().toISOString(),
//     };
//     processedIds.current.add(id);
//     emitEvent("global-message", msg);
//     setMessages((prev) => [...prev, msg]);
//     setInput("");
//   }, [input, isConnected, user, emitEvent]);

//   const grouped = groupByDay(messages);

//   return (
//     <div className="chat-window">
//       <div className="chat-messages">
//         {messages.length === 0 ? (
//           <div className="chat-empty-state">
//             <FiGlobe className="chat-empty-icon" />
//             <p className="chat-empty-title">Global Chat</p>
//             <p className="chat-empty-sub">
//               Messages here are broadcast to every connected user.
//             </p>
//           </div>
//         ) : (
//           grouped.map((item) =>
//             item.type === "separator" ? (
//               <DaySeparator key={item.key} label={item.label} />
//             ) : (
//               <MessageBubble
//                 key={item.key}
//                 message={item.data}
//                 currentUserId={user._id}
//                 showName
//               />
//             )
//           )
//         )}
//         <div ref={bottomRef} />
//       </div>
//       <InputBar
//         value={input}
//         onChange={setInput}
//         onSend={send}
//         placeholder={
//           isConnected ? "Broadcast a message to everyone…" : "Connecting…"
//         }
//         disabled={!isConnected}
//       />
//     </div>
//   );
// }

// // ─── Direct Messages ───────────────────────────────────────────────────────
// function DirectChat({ user, emitEvent, onEvent, isConnected }) {
//   // contacts: { [userId]: { _id, username, role } }
//   const [contacts, setContacts] = useState({});
//   // conversations: { [userId]: message[] }
//   const [conversations, setConversations] = useState({});
//   const [selectedId, setSelectedId] = useState(null);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [searching, setSearching] = useState(false);

//   const [input, setInput] = useState("");
//   const processedIds = useRef(new Set());
//   const counter = useRef(0);
//   const bottomRef = useRef(null);
//   const searchTimer = useRef(null);

//   // Scroll to bottom when conversation or selection changes
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [conversations, selectedId]);

//   // Listen for incoming DMs
//   useEffect(() => {
//     const cleanup = onEvent("receive-direct-message", (msg) => {
//       if (processedIds.current.has(msg.id)) return;
//       processedIds.current.add(msg.id);

//       const isOwn = msg.senderId === user._id;
//       // The "other" side of this conversation
//       const convKey = isOwn ? msg.toUserId : msg.senderId;
//       const contactInfo = isOwn
//         ? { _id: msg.toUserId, username: msg.toUsername || "User", role: "" }
//         : { _id: msg.senderId, username: msg.sender || "User", role: "" };

//       setContacts((prev) => ({
//         ...prev,
//         [convKey]: prev[convKey] || contactInfo,
//       }));

//       setConversations((prev) => ({
//         ...prev,
//         [convKey]: [...(prev[convKey] || []), msg],
//       }));
//     });
//     return cleanup;
//   }, [onEvent, user._id]);

//   // Debounced username search
//   useEffect(() => {
//     if (!searchQuery.trim()) {
//       setSearchResults([]);
//       return;
//     }
//     clearTimeout(searchTimer.current);
//     searchTimer.current = setTimeout(async () => {
//       setSearching(true);
//       try {
//         const res = await api.get("/users/all-users");
//         const all = res.data.users || [];
//         const matched = all.filter(
//           (u) =>
//             u._id !== user._id &&
//             u.username.toLowerCase().includes(searchQuery.toLowerCase())
//         );
//         setSearchResults(matched.slice(0, 8));
//       } catch {
//         setSearchResults([]);
//       } finally {
//         setSearching(false);
//       }
//     }, 300);
//     return () => clearTimeout(searchTimer.current);
//   }, [searchQuery, user._id]);

//   const selectContact = (contact) => {
//     setContacts((prev) => ({ ...prev, [contact._id]: contact }));
//     setConversations((prev) => ({ ...prev, [contact._id]: prev[contact._id] || [] }));
//     setSelectedId(contact._id);
//     setSearchQuery("");
//     setSearchResults([]);
//   };

//   const send = useCallback(() => {
//     if (!input.trim() || !selectedId || !isConnected) return;
//     const id = `dm-${Date.now()}-${counter.current++}`;
//     const msg = {
//       id,
//       text: input.trim(),
//       sender: user.username,
//       senderId: user._id,
//       toUserId: selectedId,
//       toUsername: contacts[selectedId]?.username || "",
//       timestamp: new Date().toISOString(),
//     };
//     processedIds.current.add(id);
//     emitEvent("direct-message", { toUserId: selectedId, messageData: msg });
//     setConversations((prev) => ({
//       ...prev,
//       [selectedId]: [...(prev[selectedId] || []), msg],
//     }));
//     setInput("");
//   }, [input, selectedId, isConnected, user, contacts, emitEvent]);

//   const selectedContact = selectedId ? contacts[selectedId] : null;
//   const currentMessages = selectedId ? conversations[selectedId] || [] : [];
//   const grouped = groupByDay(currentMessages);

//   return (
//     <div className="dm-layout">

//       {/* ── Sidebar ── */}
//       <div className="dm-sidebar">
//         <div className="dm-search-wrap">
//           <FiSearch className="dm-search-icon" />
//           <input
//             className="dm-search"
//             placeholder="Search by username…"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//           {searchQuery && (
//             <button
//               className="dm-clear-btn"
//               onClick={() => { setSearchQuery(""); setSearchResults([]); }}
//             >
//               <FiX />
//             </button>
//           )}
//         </div>

//         {/* Search results */}
//         {(searchResults.length > 0 || searching) && (
//           <div className="dm-results">
//             {searching && (
//               <div className="dm-searching">
//                 <FiRefreshCw className="cp-spin" /> Searching…
//               </div>
//             )}
//             {searchResults.map((u) => (
//               <button
//                 key={u._id}
//                 className="dm-result-item"
//                 onClick={() => selectContact(u)}
//               >
//                 <div className="dm-result-avatar">{u.username[0].toUpperCase()}</div>
//                 <div className="dm-result-info">
//                   <p className="dm-result-name">{u.username}</p>
//                   <p className="dm-result-role">{u.role}</p>
//                 </div>
//               </button>
//             ))}
//             {!searching && searchResults.length === 0 && (
//               <p className="dm-no-results">No users found.</p>
//             )}
//           </div>
//         )}

//         {/* Conversation list */}
//         <div className="dm-conv-list">
//           {Object.keys(contacts).length === 0 ? (
//             <p className="dm-conv-empty">
//               Search for a user above to start a conversation.
//             </p>
//           ) : (
//             Object.values(contacts).map((contact) => {
//               const msgs = conversations[contact._id] || [];
//               const last = msgs[msgs.length - 1];
//               const isActive = selectedId === contact._id;
//               return (
//                 <button
//                   key={contact._id}
//                   className={`dm-conv-item ${isActive ? "active" : ""}`}
//                   onClick={() => selectContact(contact)}
//                 >
//                   <div className="dm-conv-avatar">
//                     {contact.username[0].toUpperCase()}
//                   </div>
//                   <div className="dm-conv-info">
//                     <div className="dm-conv-row">
//                       <p className="dm-conv-name">{contact.username}</p>
//                       {last && (
//                         <span className="dm-conv-time">
//                           {formatTime(last.timestamp)}
//                         </span>
//                       )}
//                     </div>
//                     {last && (
//                       <p className="dm-conv-preview">
//                         {last.senderId === user._id ? "You: " : ""}
//                         {last.text}
//                       </p>
//                     )}
//                   </div>
//                 </button>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {/* ── Chat panel ── */}
//       <div className="dm-chat-panel">
//         {!selectedContact ? (
//           <div className="chat-empty-state">
//             <FiMessageCircle className="chat-empty-icon" />
//             <p className="chat-empty-title">Direct Messages</p>
//             <p className="chat-empty-sub">
//               Select a conversation or search for a user to get started.
//             </p>
//           </div>
//         ) : (
//           <>
//             {/* DM header */}
//             <div className="dm-chat-header">
//               <div className="dm-chat-avatar">
//                 {selectedContact.username[0].toUpperCase()}
//               </div>
//               <div>
//                 <p className="dm-chat-name">{selectedContact.username}</p>
//                 {selectedContact.role && (
//                   <p className="dm-chat-role">{selectedContact.role}</p>
//                 )}
//               </div>
//             </div>

//             {/* Messages */}
//             <div className="chat-messages">
//               {currentMessages.length === 0 ? (
//                 <div className="chat-empty-state">
//                   <FiMessageCircle className="chat-empty-icon small" />
//                   <p className="chat-empty-sub">
//                     No messages yet — say hi to {selectedContact.username}!
//                   </p>
//                 </div>
//               ) : (
//                 grouped.map((item) =>
//                   item.type === "separator" ? (
//                     <DaySeparator key={item.key} label={item.label} />
//                   ) : (
//                     <MessageBubble
//                       key={item.key}
//                       message={item.data}
//                       currentUserId={user._id}
//                       showName={false}
//                     />
//                   )
//                 )
//               )}
//               <div ref={bottomRef} />
//             </div>

//             <InputBar
//               value={input}
//               onChange={setInput}
//               onSend={send}
//               placeholder={`Message ${selectedContact.username}…`}
//               disabled={!isConnected}
//             />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Main Chat page ────────────────────────────────────────────────────────
// export default function Chat() {
//   const { user, loading, isConnected, socketId, connectionError, emitEvent, onEvent } =
//     useAuth();
//   const [activeTab, setActiveTab] = useState("global");

//   if (loading) {
//     return (
//       <div className="chat-page">
//         <div className="chat-empty-state">
//           <FiRefreshCw className="chat-empty-icon cp-spin" />
//           <p className="chat-empty-sub">Loading…</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="chat-page">
//         <div className="chat-empty-state">
//           <FiAlertCircle className="chat-empty-icon" />
//           <p className="chat-empty-title">Not authenticated</p>
//           <p className="chat-empty-sub">Please log in to use the chat.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="chat-page">

//       {/* ── Header ── */}
//       <div className="chat-page-header">
//         <div>
//           <h1 className="chat-page-title">Chat</h1>
//           <p className="chat-page-sub">
//             {isConnected
//               ? `Connected · ${socketId?.slice(0, 10)}…`
//               : "Connecting to server…"}
//           </p>
//         </div>
//         <span className={`chat-connection-badge ${isConnected ? "online" : "offline"}`}>
//           <span className="chat-badge-dot" />
//           {isConnected ? "Online" : "Offline"}
//         </span>
//       </div>

//       {connectionError && (
//         <div className="chat-error-bar">
//           <FiAlertCircle /> {connectionError}
//         </div>
//       )}

//       {/* ── Tabs ── */}
//       <div className="chat-tabs">
//         <button
//           className={`chat-tab ${activeTab === "global" ? "active" : ""}`}
//           onClick={() => setActiveTab("global")}
//         >
//           <FiGlobe /> Global Chat
//         </button>
//         <button
//           className={`chat-tab ${activeTab === "dm" ? "active" : ""}`}
//           onClick={() => setActiveTab("dm")}
//         >
//           <FiMessageCircle /> Direct Messages
//         </button>
//       </div>

//       {/* ── Content ── */}
//       <div className="chat-content">
//         {activeTab === "global" ? (
//           <GlobalChat
//             user={user}
//             emitEvent={emitEvent}
//             onEvent={onEvent}
//             isConnected={isConnected}
//           />
//         ) : (
//           <DirectChat
//             user={user}
//             emitEvent={emitEvent}
//             onEvent={onEvent}
//             isConnected={isConnected}
//           />
//         )}
//       </div>
//     </div>
//   );
// }




import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FiSend, FiSearch, FiGlobe, FiMessageCircle,
  FiX, FiAlertCircle, FiRefreshCw, FiChevronsUp,
} from "react-icons/fi";
import "../styles/chat.css";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const formatTime = (ts) =>
  ts
    ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

const formatDay = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function groupByDay(messages) {
  const groups = [];
  let lastDay = null;
  messages.forEach((msg) => {
    const day = formatDay(msg.timestamp);
    if (day !== lastDay) {
      groups.push({ type: "separator", label: day, key: `sep-${msg.id || msg.timestamp}` });
      lastDay = day;
    }
    groups.push({ type: "message", data: msg, key: msg.id });
  });
  return groups;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function MessageBubble({ message, currentUserId, showName = true }) {
  const isOwn = message.senderId === currentUserId;
  const initial = (message.sender || "?")[0].toUpperCase();

  return (
    <div className={`chat-message ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        <div className="chat-msg-avatar" title={message.sender}>
          {initial}
        </div>
      )}
      <div className="chat-bubble-wrap">
        {!isOwn && showName && (
          <p className="chat-sender-name">{message.sender}</p>
        )}
        <div className={`chat-bubble ${isOwn ? "own" : "other"}`}>
          {message.text}
        </div>
        <p className={`chat-timestamp ${isOwn ? "own" : ""}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function DaySeparator({ label }) {
  return (
    <div className="chat-day-sep">
      <span>{label}</span>
    </div>
  );
}

function InputBar({ value, onChange, onSend, placeholder, disabled }) {
  return (
    <div className="chat-input-bar">
      <input
        className="chat-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && onSend()}
        disabled={disabled}
      />
      <button
        className="chat-send-btn"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        title="Send"
      >
        <FiSend />
      </button>
    </div>
  );
}

function LoadingState({ text = "Loading…" }) {
  return (
    <div className="chat-empty-state">
      <FiRefreshCw className="chat-empty-icon cp-spin" />
      <p className="chat-empty-sub">{text}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL CHAT
// ═══════════════════════════════════════════════════════════════════════════

function GlobalChat({ user, emitEvent, onEvent, isConnected }) {
  // ── State ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────
  const oldestTimestamp = useRef(null);
  const processedIds = useRef(new Set());
  const messageCounter = useRef(0);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessageCount = useRef(0);

  // ── Load History from Server ───────────────────────────────────────────
  const loadHistory = useCallback(async (before = null) => {
    try {
      const params = { limit: 30 };
      if (before) params.before = before;

      const response = await api.get("/messages/global", { params });
      const fetchedMessages = response.data.messages || [];

      // Register IDs to prevent duplicate rendering from socket echoes
      fetchedMessages.forEach((msg) => processedIds.current.add(msg.id));

      if (before) {
        // Prepend older messages while preserving scroll position
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        setMessages((prev) => [...fetchedMessages, ...prev]);

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          }
        });
      } else {
        // Initial load: set messages and scroll to bottom
        setMessages(fetchedMessages);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
      }

      setHasMoreHistory(response.data.hasMore);
      if (fetchedMessages.length > 0) {
        oldestTimestamp.current = fetchedMessages[0].timestamp;
      }
    } catch (error) {
      console.error("Failed to load global history:", error);
    }
  }, []);

  // Initial history load
  useEffect(() => {
    setIsLoadingHistory(true);
    loadHistory().finally(() => setIsLoadingHistory(false));
  }, [loadHistory]);

  // ── Smart Auto-Scroll ──────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      const addedCount = messages.length - previousMessageCount.current;
      const container = messagesContainerRef.current;

      if (container) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = distanceFromBottom < 120;

        // Only auto-scroll if user is near bottom or a single live message arrived
        if (isNearBottom || addedCount === 1) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    previousMessageCount.current = messages.length;
  }, [messages]);

  // ── Listen for Live Messages ───────────────────────────────────────────
  useEffect(() => {
    const cleanup = onEvent("receive-global-message", (msg) => {
      if (processedIds.current.has(msg.id)) return;
      processedIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
    });
    return cleanup;
  }, [onEvent]);

  // ── Send Message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!input.trim() || !isConnected) return;

    const id = `global-${Date.now()}-${messageCounter.current++}`;
    const message = {
      id,
      text: input.trim(),
      sender: user.username,
      senderId: user._id,
      timestamp: new Date().toISOString(),
    };

    processedIds.current.add(id);
    emitEvent("global-message", message);
    setMessages((prev) => [...prev, message]);
    setInput("");
  }, [input, isConnected, user, emitEvent]);

  // ── Load More (Pagination) ─────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (!oldestTimestamp.current || isLoadingMore) return;

    setIsLoadingMore(true);
    await loadHistory(oldestTimestamp.current);
    setIsLoadingMore(false);
  };

  const groupedMessages = groupByDay(messages);

  return (
    <div className="chat-window">
      <div className="chat-messages" ref={messagesContainerRef}>
        {/* Load Earlier Messages Button */}
        {hasMoreHistory && (
          <button
            className="chat-load-more"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <FiRefreshCw className="cp-spin" /> Loading…
              </>
            ) : (
              <>
                <FiChevronsUp /> Load earlier messages
              </>
            )}
          </button>
        )}

        {/* Content States */}
        {isLoadingHistory ? (
          <LoadingState text="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <FiGlobe className="chat-empty-icon" />
            <p className="chat-empty-title">Global Chat</p>
            <p className="chat-empty-sub">
              Messages here are broadcast to every connected user.
            </p>
          </div>
        ) : (
          groupedMessages.map((item) =>
            item.type === "separator" ? (
              <DaySeparator key={item.key} label={item.label} />
            ) : (
              <MessageBubble
                key={item.key}
                message={item.data}
                currentUserId={user._id}
                showName
              />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      <InputBar
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        placeholder={
          isConnected ? "Broadcast a message to everyone…" : "Connecting…"
        }
        disabled={!isConnected}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

function DirectChat({ user, emitEvent, onEvent, isConnected }) {
  // ── State ──────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState({});
  const [conversations, setConversations] = useState({});
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [input, setInput] = useState("");

  // Per-conversation pagination metadata
  const [conversationMeta, setConversationMeta] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────
  const historyLoadedFor = useRef(new Set());
  const processedIds = useRef(new Set());
  const messageCounter = useRef(0);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const searchDebounceTimer = useRef(null);

  // ── Load DM History from Server ────────────────────────────────────────
  const loadDMHistory = useCallback(async (contactId, before = null) => {
    try {
      const params = { limit: 30 };
      if (before) params.before = before;

      const response = await api.get(`/messages/dm/${contactId}`, { params });
      const fetchedMessages = response.data.messages || [];

      fetchedMessages.forEach((msg) => processedIds.current.add(msg.id));

      if (before) {
        // Prepend older messages while preserving scroll position
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        setConversations((prev) => ({
          ...prev,
          [contactId]: [...fetchedMessages, ...(prev[contactId] || [])],
        }));

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          }
        });
      } else {
        setConversations((prev) => ({ ...prev, [contactId]: fetchedMessages }));
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
      }

      setConversationMeta((prev) => ({
        ...prev,
        [contactId]: {
          hasMore: response.data.hasMore,
          oldestTimestamp:
            fetchedMessages.length > 0
              ? fetchedMessages[0].timestamp
              : prev[contactId]?.oldestTimestamp || null,
        },
      }));
    } catch (error) {
      console.error("Failed to load DM history:", error);
    }
  }, []);

  // Load history once per conversation per session
  useEffect(() => {
    if (!selectedContactId || historyLoadedFor.current.has(selectedContactId)) return;

    historyLoadedFor.current.add(selectedContactId);
    setIsLoadingHistory(true);
    loadDMHistory(selectedContactId).finally(() => setIsLoadingHistory(false));
  }, [selectedContactId, loadDMHistory]);

  // ── Smart Auto-Scroll for DMs ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedContactId) return;

    const messages = conversations[selectedContactId];
    if (!messages?.length) return;

    const container = messagesContainerRef.current;
    if (container) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < 120;

      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [conversations, selectedContactId]);

  // ── Listen for Incoming DMs ────────────────────────────────────────────
  useEffect(() => {
    const cleanup = onEvent("receive-direct-message", (msg) => {
      if (processedIds.current.has(msg.id)) return;
      processedIds.current.add(msg.id);

      const isOwn = msg.senderId === user._id;
      const conversationKey = isOwn ? msg.toUserId : msg.senderId;
      const contactInfo = isOwn
        ? { _id: msg.toUserId, username: msg.toUsername || "User", role: "" }
        : { _id: msg.senderId, username: msg.sender || "User", role: "" };

      setContacts((prev) => ({
        ...prev,
        [conversationKey]: prev[conversationKey] || contactInfo,
      }));

      setConversations((prev) => ({
        ...prev,
        [conversationKey]: [...(prev[conversationKey] || []), msg],
      }));
    });
    return cleanup;
  }, [onEvent, user._id]);

  // ── Debounced Username Search ──────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get("/users/all-users");
        const allUsers = response.data.users || [];
        const matches = allUsers.filter(
          (u) =>
            u._id !== user._id &&
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(matches.slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounceTimer.current);
  }, [searchQuery, user._id]);

  // ── Contact Selection ────────────────────────────────────────────────────
  const selectContact = (contact) => {
    setContacts((prev) => ({ ...prev, [contact._id]: contact }));
    if (!conversations[contact._id]) {
      setConversations((prev) => ({ ...prev, [contact._id]: [] }));
    }
    setSelectedContactId(contact._id);
    setSearchQuery("");
    setSearchResults([]);
  };

  // ── Send DM ────────────────────────────────────────────────────────────
  const sendDirectMessage = useCallback(() => {
    if (!input.trim() || !selectedContactId || !isConnected) return;

    const id = `dm-${Date.now()}-${messageCounter.current++}`;
    const message = {
      id,
      text: input.trim(),
      sender: user.username,
      senderId: user._id,
      toUserId: selectedContactId,
      toUsername: contacts[selectedContactId]?.username || "",
      timestamp: new Date().toISOString(),
    };

    processedIds.current.add(id);
    emitEvent("direct-message", { toUserId: selectedContactId, messageData: message });
    setConversations((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), message],
    }));
    setInput("");
  }, [input, selectedContactId, isConnected, user, contacts, emitEvent]);

  // ── Load More DM History ───────────────────────────────────────────────
  const handleLoadMore = async () => {
    const meta = conversationMeta[selectedContactId];
    if (!meta?.oldestTimestamp || isLoadingMore) return;

    setIsLoadingMore(true);
    await loadDMHistory(selectedContactId, meta.oldestTimestamp);
    setIsLoadingMore(false);
  };

  // ── Derived State ──────────────────────────────────────────────────────
  const selectedContact = selectedContactId ? contacts[selectedContactId] : null;
  const currentMessages = selectedContactId ? conversations[selectedContactId] || [] : [];
  const currentMeta = selectedContactId ? conversationMeta[selectedContactId] : null;
  const groupedMessages = groupByDay(currentMessages);

  return (
    <div className="dm-layout">
      {/* ── Sidebar ── */}
      <div className="dm-sidebar">
        {/* Search */}
        <div className="dm-search-wrap">
          <FiSearch className="dm-search-icon" />
          <input
            className="dm-search"
            placeholder="Search by username…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="dm-clear-btn"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Search Results */}
        {(searchResults.length > 0 || isSearching) && (
          <div className="dm-results">
            {isSearching && (
              <div className="dm-searching">
                <FiRefreshCw className="cp-spin" /> Searching…
              </div>
            )}
            {searchResults.map((userResult) => (
              <button
                key={userResult._id}
                className="dm-result-item"
                onClick={() => selectContact(userResult)}
              >
                <div className="dm-result-avatar">
                  {userResult.username[0].toUpperCase()}
                </div>
                <div className="dm-result-info">
                  <p className="dm-result-name">{userResult.username}</p>
                  <p className="dm-result-role">{userResult.role}</p>
                </div>
              </button>
            ))}
            {!isSearching && searchResults.length === 0 && (
              <p className="dm-no-results">No users found.</p>
            )}
          </div>
        )}

        {/* Conversation List */}
        <div className="dm-conv-list">
          {Object.keys(contacts).length === 0 ? (
            <p className="dm-conv-empty">
              Search for a user above to start a conversation.
            </p>
          ) : (
            Object.values(contacts).map((contact) => {
              const messages = conversations[contact._id] || [];
              const lastMessage = messages[messages.length - 1];
              const isActive = selectedContactId === contact._id;

              return (
                <button
                  key={contact._id}
                  className={`dm-conv-item ${isActive ? "active" : ""}`}
                  onClick={() => selectContact(contact)}
                >
                  <div className="dm-conv-avatar">
                    {contact.username[0].toUpperCase()}
                  </div>
                  <div className="dm-conv-info">
                    <div className="dm-conv-row">
                      <p className="dm-conv-name">{contact.username}</p>
                      {lastMessage && (
                        <span className="dm-conv-time">
                          {formatTime(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="dm-conv-preview">
                        {lastMessage.senderId === user._id ? "You: " : ""}
                        {lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div className="dm-chat-panel">
        {!selectedContact ? (
          <div className="chat-empty-state">
            <FiMessageCircle className="chat-empty-icon" />
            <p className="chat-empty-title">Direct Messages</p>
            <p className="chat-empty-sub">
              Select a conversation or search for a user to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="dm-chat-header">
              <div className="dm-chat-avatar">
                {selectedContact.username[0].toUpperCase()}
              </div>
              <div>
                <p className="dm-chat-name">{selectedContact.username}</p>
                {selectedContact.role && (
                  <p className="dm-chat-role">{selectedContact.role}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={messagesContainerRef}>
              {currentMeta?.hasMore && (
                <button
                  className="chat-load-more"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <FiRefreshCw className="cp-spin" /> Loading…
                    </>
                  ) : (
                    <>
                      <FiChevronsUp /> Load earlier messages
                    </>
                  )}
                </button>
              )}

              {isLoadingHistory ? (
                <LoadingState text="Loading conversation…" />
              ) : currentMessages.length === 0 ? (
                <div className="chat-empty-state">
                  <FiMessageCircle className="chat-empty-icon small" />
                  <p className="chat-empty-sub">
                    No messages yet — say hi to {selectedContact.username}!
                  </p>
                </div>
              ) : (
                groupedMessages.map((item) =>
                  item.type === "separator" ? (
                    <DaySeparator key={item.key} label={item.label} />
                  ) : (
                    <MessageBubble
                      key={item.key}
                      message={item.data}
                      currentUserId={user._id}
                      showName={false}
                    />
                  )
                )
              )}
              <div ref={bottomRef} />
            </div>

            <InputBar
              value={input}
              onChange={setInput}
              onSend={sendDirectMessage}
              placeholder={`Message ${selectedContact.username}…`}
              disabled={!isConnected}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function Chat() {
  const {
    user,
    loading,
    isConnected,
    socketId,
    connectionError,
    emitEvent,
    onEvent,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("global");

  // ── Loading & Auth States ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-empty-state">
          <FiRefreshCw className="chat-empty-icon cp-spin" />
          <p className="chat-empty-sub">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="chat-page">
        <div className="chat-empty-state">
          <FiAlertCircle className="chat-empty-icon" />
          <p className="chat-empty-title">Not authenticated</p>
          <p className="chat-empty-sub">Please log in to use the chat.</p>
        </div>
      </div>
    );
  }

  // ── Main Layout ────────────────────────────────────────────────────────
  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-page-header">
        <div>
          <h1 className="chat-page-title">Chat</h1>
          <p className="chat-page-sub">
            {isConnected
              ? `Connected · ${socketId?.slice(0, 10)}…`
              : "Connecting to server…"}
          </p>
        </div>
        <span
          className={`chat-connection-badge ${
            isConnected ? "online" : "offline"
          }`}
        >
          <span className="chat-badge-dot" />
          {isConnected ? "Online" : "Offline"}
        </span>
      </div>

      {/* Error Banner */}
      {connectionError && (
        <div className="chat-error-bar">
          <FiAlertCircle /> {connectionError}
        </div>
      )}

      {/* Tabs */}
      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeTab === "global" ? "active" : ""}`}
          onClick={() => setActiveTab("global")}
        >
          <FiGlobe /> Global Chat
        </button>
        <button
          className={`chat-tab ${activeTab === "dm" ? "active" : ""}`}
          onClick={() => setActiveTab("dm")}
        >
          <FiMessageCircle /> Direct Messages
        </button>
      </div>

      {/* Content */}
      <div className="chat-content">
        {activeTab === "global" ? (
          <GlobalChat
            user={user}
            emitEvent={emitEvent}
            onEvent={onEvent}
            isConnected={isConnected}
          />
        ) : (
          <DirectChat
            user={user}
            emitEvent={emitEvent}
            onEvent={onEvent}
            isConnected={isConnected}
          />
        )}
      </div>
    </div>
  );
}