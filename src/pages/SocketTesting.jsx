import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FiSend, FiSearch, FiGlobe, FiMessageCircle,
  FiX, FiAlertCircle, FiRefreshCw, FiChevronsUp, FiCheck, FiCheckCircle,
} from "react-icons/fi";
import "../styles/chat.css";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

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
// AVATAR — shows the real photo if present and loads correctly, otherwise
// falls back to the first letter of the name. Reused everywhere in this file.
// `className` should be one of the existing sizing classes below
// (chat-msg-avatar / dm-result-avatar / dm-conv-avatar / dm-chat-avatar) so
// it inherits the correct size/color for that context.
// ═══════════════════════════════════════════════════════════════════════════

function Avatar({ src, name, className }) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(src) && !imgError;
  const initial = (name || "?")[0]?.toUpperCase() || "?";

  return showImage ? (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} chat-avatar-photo`}
    />
  ) : (
    <div className={className}>{initial}</div>
  );
}

// Wraps Avatar with an online/offline presence dot. Pass `online={undefined}`
// (or omit the prop) to render no dot at all — used for global chat where
// presence isn't shown.
function AvatarWithPresence({ src, name, className, online }) {
  return (
    <div className="chat-avatar-presence-wrap">
      <Avatar src={src} name={name} className={className} />
      {online !== undefined && (
        <span className={`chat-presence-dot ${online ? "online" : "offline"}`} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function MessageBubble({ message, currentUserId, showName = true, showSeen = false }) {
  const isOwn = message.senderId === currentUserId;

  return (
    <div className={`chat-message ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        <Avatar
          src={message.senderImageUrl}
          name={message.sender}
          className="chat-msg-avatar"
        />
      )}
      <div className="chat-bubble-wrap">
        {!isOwn && showName && <p className="chat-sender-name">{message.sender}</p>}
        <div className={`chat-bubble ${isOwn ? "own" : "other"}`}>{message.text}</div>
        <p className={`chat-timestamp ${isOwn ? "own" : ""}`}>{formatTime(message.timestamp)}</p>
        {showSeen && (
          <p className="chat-seen-label">
            <FiCheckCircle /> Seen
          </p>
        )}
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
      <button className="chat-send-btn" onClick={onSend} disabled={disabled || !value.trim()} title="Send">
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const oldestTimestamp = useRef(null);
  const processedIds = useRef(new Set());
  const messageCounter = useRef(0);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessageCount = useRef(0);

  const loadHistory = useCallback(async (before = null) => {
    try {
      const params = { limit: 30 };
      if (before) params.before = before;

      const response = await api.get("/messages/global", { params });
      const fetchedMessages = response.data.messages || [];
      fetchedMessages.forEach((msg) => processedIds.current.add(msg.id));

      if (before) {
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        setMessages((prev) => [...fetchedMessages, ...prev]);
        requestAnimationFrame(() => {
          if (container) container.scrollTop = container.scrollHeight - previousScrollHeight;
        });
      } else {
        setMessages(fetchedMessages);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
      }

      setHasMoreHistory(response.data.hasMore);
      if (fetchedMessages.length > 0) oldestTimestamp.current = fetchedMessages[0].timestamp;
    } catch (error) {
      console.error("Failed to load global history:", error);
    }
  }, []);

  useEffect(() => {
    setIsLoadingHistory(true);
    loadHistory().finally(() => setIsLoadingHistory(false));
  }, [loadHistory]);

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      const addedCount = messages.length - previousMessageCount.current;
      const container = messagesContainerRef.current;
      if (container) {
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isNearBottom = distanceFromBottom < 120;
        if (isNearBottom || addedCount === 1) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    previousMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const cleanup = onEvent("receive-global-message", (msg) => {
      if (processedIds.current.has(msg.id)) return;
      processedIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
    });
    return cleanup;
  }, [onEvent]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !isConnected) return;
    const id = `global-${Date.now()}-${messageCounter.current++}`;
    const message = {
      id,
      text: input.trim(),
      sender: user.username,
      senderId: user._id,
      senderImageUrl: user.imageUrl || null, // NEW — carried through to every recipient + persisted history
      timestamp: new Date().toISOString(),
    };
    processedIds.current.add(id);
    emitEvent("global-message", message);
    setMessages((prev) => [...prev, message]);
    setInput("");
  }, [input, isConnected, user, emitEvent]);

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
        {hasMoreHistory && (
          <button className="chat-load-more" onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore
              ? <><FiRefreshCw className="cp-spin" /> Loading…</>
              : <><FiChevronsUp /> Load earlier messages</>}
          </button>
        )}

        {isLoadingHistory ? (
          <LoadingState text="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <FiGlobe className="chat-empty-icon" />
            <p className="chat-empty-title">Global Chat</p>
            <p className="chat-empty-sub">Messages here are broadcast to every connected user.</p>
          </div>
        ) : (
          groupedMessages.map((item) =>
            item.type === "separator" ? (
              <DaySeparator key={item.key} label={item.label} />
            ) : (
              <MessageBubble key={item.key} message={item.data} currentUserId={user._id} showName />
            )
          )
        )}
        <div ref={bottomRef} />
      </div>

      <InputBar
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        placeholder={isConnected ? "Broadcast a message to everyone…" : "Connecting…"}
        disabled={!isConnected}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

function DirectChat({ user, emitEvent, onEvent, isConnected, onlineUserIds, isActive }) {
  const [contacts, setContacts] = useState({});
  const [conversations, setConversations] = useState({});
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [input, setInput] = useState("");

  // NEW — unread message counts per contact
  const [unreadCounts, setUnreadCounts] = useState({});
  // NEW — who's currently typing to me (contactId or null)
  const [typingContactId, setTypingContactId] = useState(null);
  // NEW — { [contactId]: isoTimestamp } — the other side has seen everything up to this time
  const [seenUpTo, setSeenUpTo] = useState({});

  const [conversationMeta, setConversationMeta] = useState({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const historyLoadedFor = useRef(new Set());
  const processedIds = useRef(new Set());
  const messageCounter = useRef(0);
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const searchDebounceTimer = useRef(null);
  const typingEmitTimeoutRef = useRef(null);
  const typingClearTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // ── Refs mirroring state that socket listeners need FRESH, not stale ──
  // Listener effects below only run once (stable onEvent identity), so any
  // state they read would otherwise be frozen at whatever it was on mount.
  // Reading through a ref instead always gets the current value.
  const selectedContactIdRef = useRef(selectedContactId);
  useEffect(() => { selectedContactIdRef.current = selectedContactId; }, [selectedContactId]);

  const isActiveRef = useRef(isActive);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // ── Load DM History from Server ────────────────────────────────────────
  const loadDMHistory = useCallback(async (contactId, before = null) => {
    try {
      const params = { limit: 30 };
      if (before) params.before = before;

      const response = await api.get(`/messages/dm/${contactId}`, { params });
      const fetchedMessages = response.data.messages || [];
      fetchedMessages.forEach((msg) => processedIds.current.add(msg.id));

      if (before) {
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        setConversations((prev) => ({
          ...prev,
          [contactId]: [...fetchedMessages, ...(prev[contactId] || [])],
        }));
        requestAnimationFrame(() => {
          if (container) container.scrollTop = container.scrollHeight - previousScrollHeight;
        });
      } else {
        setConversations((prev) => ({ ...prev, [contactId]: fetchedMessages }));
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView());
      }

      setConversationMeta((prev) => ({
        ...prev,
        [contactId]: {
          hasMore: response.data.hasMore,
          oldestTimestamp: fetchedMessages.length > 0 ? fetchedMessages[0].timestamp : prev[contactId]?.oldestTimestamp || null,
        },
      }));
    } catch (error) {
      console.error("Failed to load DM history:", error);
    }
  }, []);

  useEffect(() => {
    if (!selectedContactId || historyLoadedFor.current.has(selectedContactId)) return;
    historyLoadedFor.current.add(selectedContactId);
    setIsLoadingHistory(true);
    loadDMHistory(selectedContactId).finally(() => setIsLoadingHistory(false));
  }, [selectedContactId, loadDMHistory]);

  useEffect(() => {
    if (!selectedContactId) return;
    const messages = conversations[selectedContactId];
    if (!messages?.length) return;
    const container = messagesContainerRef.current;
    if (container) {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 120) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
        ? { _id: msg.toUserId, username: msg.toUsername || "User", role: "", imageUrl: null }
        : { _id: msg.senderId, username: msg.sender || "User", role: "", imageUrl: msg.senderImageUrl || null };

      setContacts((prev) => ({
        ...prev,
        [conversationKey]: prev[conversationKey]
          ? { ...prev[conversationKey], imageUrl: contactInfo.imageUrl ?? prev[conversationKey].imageUrl }
          : contactInfo,
      }));

      setConversations((prev) => ({
        ...prev,
        [conversationKey]: [...(prev[conversationKey] || []), msg],
      }));

      if (!isOwn) {
        // Am I actively looking at THIS conversation, on the DM tab, right now?
        const isCurrentlyViewing = isActiveRef.current && selectedContactIdRef.current === conversationKey;
        if (isCurrentlyViewing) {
          emitEvent("dm-seen", { toUserId: conversationKey });
        } else {
          setUnreadCounts((prev) => ({ ...prev, [conversationKey]: (prev[conversationKey] || 0) + 1 }));
        }
      }
    });
    return cleanup;
  }, [onEvent, user._id, emitEvent]);

  // ── Listen for typing indicator ────────────────────────────────────────
  useEffect(() => {
    const cleanup = onEvent("dm-user-typing", ({ fromUserId, isTyping }) => {
      if (fromUserId !== selectedContactIdRef.current) return;
      setTypingContactId(isTyping ? fromUserId : null);
      clearTimeout(typingClearTimeoutRef.current);
      if (isTyping) {
        // Safety net in case a "stopped typing" signal never arrives
        typingClearTimeoutRef.current = setTimeout(() => setTypingContactId(null), 4000);
      }
    });
    return cleanup;
  }, [onEvent]);

  // Clear stale typing indicator when switching conversations
  useEffect(() => {
    setTypingContactId(null);
  }, [selectedContactId]);

  // ── Listen for seen receipts ───────────────────────────────────────────
  useEffect(() => {
    const cleanup = onEvent("dm-messages-seen", ({ byUserId, seenAt }) => {
      setSeenUpTo((prev) => ({ ...prev, [byUserId]: seenAt }));
    });
    return cleanup;
  }, [onEvent]);

  // Mark as read whenever the DM tab is active AND a conversation is open —
  // covers initial open, switching contacts, and switching back to this tab.
  useEffect(() => {
    if (isActive && selectedContactId) {
      setUnreadCounts((prev) => ({ ...prev, [selectedContactId]: 0 }));
      emitEvent("dm-seen", { toUserId: selectedContactId });
    }
  }, [isActive, selectedContactId, emitEvent]);

  // ── Debounced username search ──────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get("/users/all-users");
        const allUsers = response.data.users || [];
        const matches = allUsers.filter(
          (u) => u._id !== user._id && u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(matches.slice(0, 8));
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(searchDebounceTimer.current);
  }, [searchQuery, user._id]);

  const selectContact = (contact) => {
    setContacts((prev) => ({
      ...prev,
      [contact._id]: prev[contact._id] ? { ...prev[contact._id], ...contact } : contact,
    }));
    if (!conversations[contact._id]) {
      setConversations((prev) => ({ ...prev, [contact._id]: [] }));
    }
    setSelectedContactId(contact._id); // unread reset + dm-seen handled by the effect above
    setSearchQuery("");
    setSearchResults([]);
  };

  // ── Typing: emit on input change, throttled with a stop-after-pause timer ──
  const handleInputChange = (val) => {
    setInput(val);
    if (!selectedContactId || !isConnected) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitEvent("dm-typing", { toUserId: selectedContactId, isTyping: true });
    }

    clearTimeout(typingEmitTimeoutRef.current);
    typingEmitTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitEvent("dm-typing", { toUserId: selectedContactId, isTyping: false });
    }, 2000);
  };

  const sendDirectMessage = useCallback(() => {
    if (!input.trim() || !selectedContactId || !isConnected) return;

    // Sending counts as "stopped typing" immediately
    clearTimeout(typingEmitTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitEvent("dm-typing", { toUserId: selectedContactId, isTyping: false });
    }

    const id = `dm-${Date.now()}-${messageCounter.current++}`;
    const message = {
      id,
      text: input.trim(),
      sender: user.username,
      senderId: user._id,
      senderImageUrl: user.imageUrl || null, // NEW
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

  const handleLoadMore = async () => {
    const meta = conversationMeta[selectedContactId];
    if (!meta?.oldestTimestamp || isLoadingMore) return;
    setIsLoadingMore(true);
    await loadDMHistory(selectedContactId, meta.oldestTimestamp);
    setIsLoadingMore(false);
  };

  const selectedContact = selectedContactId ? contacts[selectedContactId] : null;
  const currentMessages = selectedContactId ? conversations[selectedContactId] || [] : [];
  const currentMeta = selectedContactId ? conversationMeta[selectedContactId] : null;
  const groupedMessages = groupByDay(currentMessages);
  const isContactTyping = typingContactId === selectedContactId;

  // "Seen" only renders on the LAST message, and only if it's mine and the
  // other person has seen up to (or past) its timestamp — matches how most
  // chat apps show a single seen indicator rather than one per bubble.
  const lastMessage = currentMessages[currentMessages.length - 1];
  const lastMessageIsSeen =
    lastMessage &&
    lastMessage.senderId === user._id &&
    selectedContactId &&
    seenUpTo[selectedContactId] &&
    new Date(lastMessage.timestamp) <= new Date(seenUpTo[selectedContactId]);

  return (
    <div className="dm-layout">
      {/* ── Sidebar ── */}
      <div className="dm-sidebar">
        <div className="dm-search-wrap">
          <FiSearch className="dm-search-icon" />
          <input
            className="dm-search"
            placeholder="Search by username…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="dm-clear-btn" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
              <FiX />
            </button>
          )}
        </div>

        {(searchResults.length > 0 || isSearching) && (
          <div className="dm-results">
            {isSearching && <div className="dm-searching"><FiRefreshCw className="cp-spin" /> Searching…</div>}
            {searchResults.map((userResult) => (
              <button key={userResult._id} className="dm-result-item" onClick={() => selectContact(userResult)}>
                <AvatarWithPresence
                  src={userResult.imageUrl}
                  name={userResult.username}
                  className="dm-result-avatar"
                  online={onlineUserIds.has(userResult._id)}
                />
                <div className="dm-result-info">
                  <p className="dm-result-name">{userResult.username}</p>
                  <p className="dm-result-role">{userResult.role}</p>
                </div>
              </button>
            ))}
            {!isSearching && searchResults.length === 0 && <p className="dm-no-results">No users found.</p>}
          </div>
        )}

        <div className="dm-conv-list">
          {Object.keys(contacts).length === 0 ? (
            <p className="dm-conv-empty">Search for a user above to start a conversation.</p>
          ) : (
            Object.values(contacts).map((contact) => {
              const messages = conversations[contact._id] || [];
              const lastMsg = messages[messages.length - 1];
              const isActiveItem = selectedContactId === contact._id;
              const unread = unreadCounts[contact._id] || 0;

              return (
                <button
                  key={contact._id}
                  className={`dm-conv-item ${isActiveItem ? "active" : ""}`}
                  onClick={() => selectContact(contact)}
                >
                  <AvatarWithPresence
                    src={contact.imageUrl}
                    name={contact.username}
                    className="dm-conv-avatar"
                    online={onlineUserIds.has(contact._id)}
                  />
                  <div className="dm-conv-info">
                    <div className="dm-conv-row">
                      <p className={`dm-conv-name ${unread > 0 ? "unread" : ""}`}>{contact.username}</p>
                      {lastMsg && <span className="dm-conv-time">{formatTime(lastMsg.timestamp)}</span>}
                    </div>
                    {lastMsg && (
                      <p className={`dm-conv-preview ${unread > 0 ? "unread" : ""}`}>
                        {lastMsg.senderId === user._id ? "You: " : ""}{lastMsg.text}
                      </p>
                    )}
                  </div>
                  {unread > 0 && <span className="dm-unread-badge">{unread > 9 ? "9+" : unread}</span>}
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
            <p className="chat-empty-sub">Select a conversation or search for a user to get started.</p>
          </div>
        ) : (
          <>
            <div className="dm-chat-header">
              <AvatarWithPresence
                src={selectedContact.imageUrl}
                name={selectedContact.username}
                className="dm-chat-avatar"
                online={onlineUserIds.has(selectedContact._id)}
              />
              <div>
                <p className="dm-chat-name">{selectedContact.username}</p>
                {isContactTyping ? (
                  <p className="dm-typing-indicator">typing…</p>
                ) : (
                  <p className="dm-chat-role">
                    {onlineUserIds.has(selectedContact._id) ? "Online" : "Offline"}
                  </p>
                )}
              </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              {currentMeta?.hasMore && (
                <button className="chat-load-more" onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore
                    ? <><FiRefreshCw className="cp-spin" /> Loading…</>
                    : <><FiChevronsUp /> Load earlier messages</>}
                </button>
              )}

              {isLoadingHistory ? (
                <LoadingState text="Loading conversation…" />
              ) : currentMessages.length === 0 ? (
                <div className="chat-empty-state">
                  <FiMessageCircle className="chat-empty-icon small" />
                  <p className="chat-empty-sub">No messages yet — say hi to {selectedContact.username}!</p>
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
                      showSeen={lastMessageIsSeen && item.data.id === lastMessage?.id}
                    />
                  )
                )
              )}
              <div ref={bottomRef} />
            </div>

            <InputBar
              value={input}
              onChange={handleInputChange}
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
    user, loading, isConnected, socketId, connectionError,
    emitEvent, onEvent, onlineUserIds,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("global");

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

  return (
    <div className="chat-page">
      <div className="chat-page-header">
        <div>
          <h1 className="chat-page-title">Chat</h1>
          <p className="chat-page-sub">
            {isConnected ? `Connected · ${socketId?.slice(0, 10)}…` : "Connecting to server…"}
          </p>
        </div>
        <span className={`chat-connection-badge ${isConnected ? "online" : "offline"}`}>
          <span className="chat-badge-dot" />
          {isConnected ? "Online" : "Offline"}
        </span>
      </div>

      {connectionError && (
        <div className="chat-error-bar"><FiAlertCircle /> {connectionError}</div>
      )}

      <div className="chat-tabs">
        <button className={`chat-tab ${activeTab === "global" ? "active" : ""}`} onClick={() => setActiveTab("global")}>
          <FiGlobe /> Global Chat
        </button>
        <button className={`chat-tab ${activeTab === "dm" ? "active" : ""}`} onClick={() => setActiveTab("dm")}>
          <FiMessageCircle /> Direct Messages
        </button>
      </div>

      <div className="chat-content">
        {activeTab === "global" ? (
          <GlobalChat user={user} emitEvent={emitEvent} onEvent={onEvent} isConnected={isConnected} />
        ) : (
          <DirectChat
            user={user}
            emitEvent={emitEvent}
            onEvent={onEvent}
            isConnected={isConnected}
            onlineUserIds={onlineUserIds}
            isActive={activeTab === "dm"}
          />
        )}
      </div>
    </div>
  );
}