import { useState, useRef, useEffect, useCallback } from "react";
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
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline"; // ✅ NEW
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/notes.css";

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

// ─── Toolbar button groups (commands map to TipTap methods) ──
const TOOLBAR = [
  [
    { cmd: "undo",            icon: MdUndo,                title: "Undo" },
    { cmd: "redo",            icon: MdRedo,                title: "Redo" },
  ],
  [
    { cmd: "heading",         icon: MdTitle,               title: "Heading",      val: "h2" },
    { cmd: "bold",            icon: FiBold,                title: "Bold" },
    { cmd: "italic",          icon: FiItalic,              title: "Italic" },
    { cmd: "underline",       icon: FiUnderline,           title: "Underline" },
    { cmd: "strike",          icon: MdFormatStrikethrough, title: "Strikethrough" },
  ],
  [
    { cmd: "bulletList",      icon: FiList,                title: "Bullet list" },
    { cmd: "orderedList",     icon: MdFormatListNumbered,  title: "Numbered list" },
    { cmd: "blockquote",      icon: MdFormatQuote,         title: "Blockquote" },
  ],
  [
    { cmd: "link",            icon: FiLink,                title: "Insert link" },
    { cmd: "horizontalRule",  icon: FiMinus,               title: "Divider" },
  ],
];

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveTimeout = useRef(null);

  // ── Fetch notes ───────────────────────────────────────────
  useEffect(() => {
    const fetchNotes = async () => {
      // Guard: only fetch if user is available
      if (!user?._id) return;

      try {
        setLoading(true);
        const res = await api.get(`/notes/user/${user._id}`);
        setNotes(res.data.data);
        if (res.data.data.length > 0) {
          setActiveId(res.data.data[0]._id);
        }
      } catch (err) {
        setError("Failed to load notes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [user?._id]); // Re‑fetch when user changes

  const activeNote = notes.find((n) => n._id === activeId);

  // ── TipTap Editor ─────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing your note…",
      }),
      Underline, // ✅ Now underline works
    ],
    content: activeNote?.content || "<p></p>",
    onUpdate: ({ editor }) => {
      // Debounced save
      const html = editor.getHTML();
      const plain = stripHtml(html);
      const firstLine = plain.split(/\n/)[0]?.slice(0, 60) || "Untitled note";

      // Optimistic update
      if (activeNote) {
        const updated = { ...activeNote, content: html, title: firstLine, updatedAt: new Date().toISOString() };
        setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      }

      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (activeId) {
          api.put(`/notes/${activeId}`, { title: firstLine, content: html }).catch(console.error);
        }
      }, 500);
    },
  });

  // Update editor content when switching notes
  useEffect(() => {
    if (editor && activeNote) {
      editor.commands.setContent(activeNote.content || "<p></p>");
    }
  }, [activeNote, editor]);

  // ── Toolbar command handler ──────────────────────────────
  const execCmd = (cmd, val = null) => {
    if (!editor) return;
    switch (cmd) {
      case "undo":        editor.commands.undo(); break;
      case "redo":        editor.commands.redo(); break;
      case "bold":        editor.commands.toggleBold(); break;
      case "italic":      editor.commands.toggleItalic(); break;
      case "underline":   editor.commands.toggleUnderline(); break;
      case "strike":      editor.commands.toggleStrike(); break;
      case "heading":     editor.commands.toggleHeading({ level: parseInt(val.replace("h", "")) }); break;
      case "bulletList":  editor.commands.toggleBulletList(); break;
      case "orderedList": editor.commands.toggleOrderedList(); break;
      case "blockquote":  editor.commands.toggleBlockquote(); break;
      case "horizontalRule": editor.commands.setHorizontalRule(); break;
      case "link": {
        const url = prompt("Enter URL:", "https://");
        if (url) editor.commands.setLink({ href: url });
        break;
      }
      default: break;
    }
    editor.commands.focus();
  };

  // ── CRUD operations ──────────────────────────────────────
  const handleNew = async () => {
    try {
      const newNote = { title: "Untitled note", content: "<p></p>", isPinned: false };
      const res = await api.post("/notes", newNote);
      const created = res.data.data;
      setNotes((prev) => [created, ...prev]);
      setActiveId(created._id);
      setMobileView("editor");
    } catch (err) {
      setError("Failed to create note.");
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const original = [...notes];
    setNotes((prev) => prev.filter((n) => n._id !== id));
    if (activeId === id) {
      setActiveId(notes.length > 1 ? notes[0]?._id : null);
      setMobileView("list");
    }
    try {
      await api.delete(`/notes/${id}`);
    } catch (err) {
      setNotes(original);
      setError("Failed to delete note.");
      console.error(err);
    }
  };

  const handleSelect = (note) => {
    setActiveId(note._id);
    setMobileView("editor");
  };

  const togglePin = async (id, e) => {
    e.stopPropagation();
    const original = [...notes];
    const note = notes.find((n) => n._id === id);
    if (!note) return;
    const updated = { ...note, isPinned: !note.isPinned };
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
    try {
      await api.patch(`/notes/${id}/pin`);
    } catch (err) {
      setNotes(original);
      setError("Failed to toggle pin.");
      console.error(err);
    }
  };

  const filtered = notes.filter((n) =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    stripHtml(n.content).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="notes-page">
      {/* ══ SIDEBAR ══ */}
      <aside className={`notes-sidebar ${mobileView === "editor" ? "mobile-hide" : ""}`}>
        <div className="notes-sidebar-header">
          <div className="notes-sidebar-title-row">
            <h2 className="notes-sidebar-title"><FiFileText /> Notes</h2>
            <button className="notes-new-btn" onClick={handleNew}><FiPlus /></button>
          </div>
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
        <div className="notes-list">
          {loading && <p className="notes-empty">Loading…</p>}
          {!loading && error && <p className="notes-empty" style={{ color: "#ef4444" }}>{error}</p>}
          {!loading && filtered.length === 0 && !error && <p className="notes-empty">No notes found.</p>}
          {filtered.map((note) => (
            <button
              key={note._id}
              className={`notes-list-item ${note._id === activeId ? "active" : ""}`}
              onClick={() => handleSelect(note)}
            >
              <div className="notes-item-body">
                <p className="notes-item-title">
                  {note.title}
                  {note.isPinned && <span className="notes-pin-badge">📌</span>}
                </p>
                <p className="notes-item-preview">{stripHtml(note.content).slice(0, 80)}</p>
                <p className="notes-item-time">{timeAgo(note.updatedAt)}</p>
              </div>
              <div className="notes-item-actions">
                <button className="notes-pin-btn" onClick={(e) => togglePin(note._id, e)}>
                  📌
                </button>
                <button className="notes-delete-btn" onClick={(e) => handleDelete(note._id, e)}>
                  <FiTrash2 />
                </button>
              </div>
            </button>
          ))}
        </div>
        <div className="notes-sidebar-footer">{notes.length} note{notes.length !== 1 ? "s" : ""}</div>
      </aside>

      {/* ══ EDITOR ══ */}
      <main className={`notes-editor-panel ${mobileView === "list" ? "mobile-hide" : ""}`}>
        {!loading && !activeNote ? (
          <div className="notes-no-selection">
            <FiFileText className="notes-no-icon" />
            <p>Select or create a note</p>
            <button className="notes-new-btn-lg" onClick={handleNew}><FiPlus /> New Note</button>
          </div>
        ) : (
          <>
            <button className="notes-back-btn" onClick={() => setMobileView("list")}>← All Notes</button>

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

            <div className="notes-editor-wrapper">
              <EditorContent editor={editor} className="notes-editor" />
            </div>

            <div className="notes-editor-footer">
              <span><FiAlignLeft /> {activeNote ? stripHtml(activeNote.content).split(/\s+/).filter(Boolean).length : 0} words</span>
              <span>Last edited {activeNote ? timeAgo(activeNote.updatedAt) : "just now"}</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}