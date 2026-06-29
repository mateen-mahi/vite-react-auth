import { useState, useRef, useCallback } from "react";
import {
  FiPlus, FiTrash2, FiSearch, FiFileText,
  FiBold, FiItalic, FiUnderline, FiLink,
  FiList, FiAlignLeft, FiMinus,
} from "react-icons/fi";
import {
  MdFormatStrikethrough,
  MdFormatQuote,
  MdFormatListNumbered,
  MdUndo,
  MdRedo,
  MdTitle,
} from "react-icons/md";
import "../styles/notes.css";

// ─── Dummy Data ────────────────────────────────────────────
const INITIAL_NOTES = [
  {
    id: 1,
    title: "React Learning Roadmap",
    content: "<h2>React Learning Roadmap</h2><p>Topics to cover this month:</p><ul><li><strong>Hooks</strong> — useState, useEffect, useRef, useContext</li><li><strong>React Router v6</strong> — Outlet, NavLink, params</li><li><strong>State Management</strong> — Context API first, then Zustand</li></ul><blockquote>Focus on building projects, not just watching tutorials.</blockquote>",
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 2,
    title: "API Integration Checklist",
    content: "<h2>API Integration Checklist</h2><ol><li>Set up Axios instance with base URL</li><li>Add request interceptor for auth token</li><li>Add response interceptor for 401 handling</li><li>Create service files per feature</li><li>Handle loading &amp; error states in UI</li></ol>",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 3,
    title: "Project Ideas",
    content: "<h2>Project Ideas</h2><p>Full-stack projects to build for portfolio:</p><ul><li>LMS — <strong>in progress ✅</strong></li><li>Job board with auth</li><li>Real-time chat app (Socket.io)</li><li>AI-powered quiz generator</li></ul>",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 4,
    title: "MongoDB Notes",
    content: "<h2>MongoDB Notes</h2><p>Key concepts to remember:</p><ul><li>Documents are stored as <strong>BSON</strong></li><li>Use <strong>Mongoose</strong> for schema validation</li><li>Indexes improve query performance significantly</li><li>Aggregation pipeline for complex queries</li></ul><p><u>Practice aggregation more this week.</u></p>",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// ─── Helpers ───────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const stripHtml = (html) =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

let nextId = INITIAL_NOTES.length + 1;

// ─── Toolbar button groups ─────────────────────────────────
const TOOLBAR = [
  [
    { cmd: "undo",            icon: MdUndo,                title: "Undo" },
    { cmd: "redo",            icon: MdRedo,                title: "Redo" },
  ],
  [
    { cmd: "formatBlock",     icon: MdTitle,               title: "Heading",      val: "H2" },
    { cmd: "bold",            icon: FiBold,                title: "Bold" },
    { cmd: "italic",          icon: FiItalic,              title: "Italic" },
    { cmd: "underline",       icon: FiUnderline,           title: "Underline" },
    { cmd: "strikeThrough",   icon: MdFormatStrikethrough, title: "Strikethrough" },
  ],
  [
    { cmd: "insertUnorderedList", icon: FiList,                title: "Bullet list" },
    { cmd: "insertOrderedList",   icon: MdFormatListNumbered,  title: "Numbered list" },
    { cmd: "formatBlock",         icon: MdFormatQuote,         title: "Blockquote",   val: "BLOCKQUOTE" },
  ],
  [
    { cmd: "createLink",      icon: FiLink,                title: "Insert link" },
    { cmd: "insertHorizontalRule", icon: FiMinus,          title: "Divider" },
  ],
];

export default function Notes() {
  const [notes, setNotes]           = useState(INITIAL_NOTES);
  const [activeId, setActiveId]     = useState(INITIAL_NOTES[0].id);
  const [search, setSearch]         = useState("");
  const [mobileView, setMobileView] = useState("list"); // "list" | "editor"
  const editorRef                   = useRef(null);

  const activeNote = notes.find((n) => n.id === activeId);

  // ── Filtered notes ───────────────────────────────────────
  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    stripHtml(n.content).toLowerCase().includes(search.toLowerCase())
  );

  // ── Create new note ──────────────────────────────────────
  const handleNew = () => {
    const note = {
      id: nextId++,
      title: "Untitled note",
      content: "<p></p>",
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setMobileView("editor");
    setTimeout(() => editorRef.current?.focus(), 50);
  };

  // ── Delete note ──────────────────────────────────────────
  const handleDelete = (id, e) => {
    e.stopPropagation();
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeId === id) {
      setActiveId(remaining[0]?.id ?? null);
      setMobileView("list");
    }
  };

  // ── Select note ──────────────────────────────────────────
  const handleSelect = (note) => {
    setActiveId(note.id);
    setMobileView("editor");
  };

  // ── Editor input — sync content + derive title ───────────
  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const plain = stripHtml(html);
    const firstLine = plain.split(/\n/)[0]?.slice(0, 60) || "Untitled note";

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, content: html, title: firstLine, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, [activeId]);

  // ── Toolbar command ──────────────────────────────────────
  const execCmd = (cmd, val = null) => {
    if (cmd === "createLink") {
      const url = prompt("Enter URL:", "https://");
      if (url) document.execCommand("createLink", false, url);
    } else if (val) {
      document.execCommand("formatBlock", false, val);
    } else {
      document.execCommand(cmd, false, null);
    }
    editorRef.current?.focus();
    handleEditorInput();
  };

  return (
    <div className="notes-page">

      {/* ══ LEFT PANEL ══ */}
      <aside className={`notes-sidebar ${mobileView === "editor" ? "mobile-hide" : ""}`}>

        {/* Header */}
        <div className="notes-sidebar-header">
          <div className="notes-sidebar-title-row">
            <h2 className="notes-sidebar-title">
              <FiFileText /> Notes
            </h2>
            <button className="notes-new-btn" onClick={handleNew} title="New note">
              <FiPlus />
            </button>
          </div>

          {/* Search */}
          <div className="notes-search-wrap">
            <FiSearch className="notes-search-icon" />
            <input
              className="notes-search"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="notes-list">
          {filtered.length === 0 && (
            <p className="notes-empty">No notes found.</p>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              className={`notes-list-item ${note.id === activeId ? "active" : ""}`}
              onClick={() => handleSelect(note)}
            >
              <div className="notes-item-body">
                <p className="notes-item-title">{note.title}</p>
                <p className="notes-item-preview">{stripHtml(note.content).slice(0, 80)}</p>
                <p className="notes-item-time">{timeAgo(note.updatedAt)}</p>
              </div>
              <button
                className="notes-delete-btn"
                onClick={(e) => handleDelete(note.id, e)}
                title="Delete note"
              >
                <FiTrash2 />
              </button>
            </button>
          ))}
        </div>

        <div className="notes-sidebar-footer">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </div>
      </aside>

      {/* ══ EDITOR PANEL ══ */}
      <main className={`notes-editor-panel ${mobileView === "list" ? "mobile-hide" : ""}`}>
        {!activeNote ? (
          <div className="notes-no-selection">
            <FiFileText className="notes-no-icon" />
            <p>Select a note or create a new one</p>
            <button className="notes-new-btn-lg" onClick={handleNew}>
              <FiPlus /> New Note
            </button>
          </div>
        ) : (
          <>
            {/* Mobile back button */}
            <button
              className="notes-back-btn"
              onClick={() => setMobileView("list")}
            >
              ← All Notes
            </button>

            {/* Toolbar */}
            <div className="notes-toolbar">
              {TOOLBAR.map((group, gi) => (
                <div key={gi} className="notes-toolbar-group">
                  {group.map(({ cmd, icon: Icon, title, val }) => (
                    <button
                      key={title}
                      className="notes-tool-btn"
                      title={title}
                      onMouseDown={(e) => { e.preventDefault(); execCmd(cmd, val); }}
                    >
                      <Icon />
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Editable area */}
            <div
              ref={editorRef}
              className="notes-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              dangerouslySetInnerHTML={{ __html: activeNote.content }}
              key={activeNote.id} /* remount editor when switching notes */
              spellCheck
            />

            {/* Footer */}
            <div className="notes-editor-footer">
              <span><FiAlignLeft /> {stripHtml(activeNote.content).split(/\s+/).filter(Boolean).length} words</span>
              <span>Last edited {timeAgo(activeNote.updatedAt)}</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}