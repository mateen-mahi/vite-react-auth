import { useState, useRef, useEffect, useCallback } from "react";
import {
  FiPlus, FiTrash2, FiSearch, FiFileText,
  FiBold, FiItalic, FiUnderline, FiLink,
  FiList, FiAlignLeft, FiMinus, FiX,
  FiGrid, FiList as FiListIcon,
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
import Underline from "@tiptap/extension-underline";
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

// ─── Toolbar (same as before) ─────────────────────────────
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // null = new note
  const saveTimeout = useRef(null);

  // ── Fetch notes ───────────────────────────────────────────
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const res = await api.get(`/notes/user/${user._id}`);
        setNotes(res.data.data);
      } catch (err) {
        console.error("Fetch notes error:", err.response?.data || err.message);
        setError("Failed to load notes.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [user?._id]);

  // ── TipTap Editor (for modal) ────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, linkOnPaste: true }),
      Placeholder.configure({ placeholder: "Start writing your note…" }),
      Underline,
    ],
    content: editingNote?.content || "<p></p>",
    onUpdate: ({ editor }) => {
      // Update the editingNote content in real time
      const html = editor.getHTML();
      const plain = stripHtml(html);
      const firstLine = plain.split(/\n/)[0]?.slice(0, 60) || "Untitled note";
      setEditingNote((prev) => ({
        ...prev,
        content: html,
        title: firstLine,
        updatedAt: new Date().toISOString(),
      }));
    },
  });

  // Update editor content when editingNote changes
  useEffect(() => {
    if (editor && editingNote) {
      editor.commands.setContent(editingNote.content || "<p></p>");
    }
  }, [editingNote, editor]);

  // ── Toolbar commands ──────────────────────────────────────
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

  // ── CRUD ──────────────────────────────────────────────────
  const openNewNote = () => {
    setEditingNote({
      title: "Untitled note",
      content: "<p></p>",
      isPinned: false,
      _id: null, // new
    });
    setModalOpen(true);
  };

  const openEditNote = (note) => {
    setEditingNote({ ...note });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
  };

  const saveNote = async () => {
    if (!editingNote) return;
    try {
      const { title, content, isPinned, _id } = editingNote;
      if (_id) {
        // Update existing
        const res = await api.put(`/notes/${_id}`, { title, content, isPinned });
        const updated = res.data.data;
        setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      } else {
        // Create new
        const res = await api.post("/notes", { title, content, isPinned });
        const created = res.data.data;
        setNotes((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (err) {
      console.error("Save note error:", err.response?.data || err.message);
      setError("Failed to save note.");
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const original = [...notes];
    setNotes((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/notes/${id}`);
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      setNotes(original);
      setError("Failed to delete note.");
    }
  };

  const togglePin = async (id, e) => {
    e?.stopPropagation();
    const original = [...notes];
    const note = notes.find((n) => n._id === id);
    if (!note) return;
    const updated = { ...note, isPinned: !note.isPinned };
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
    try {
      await api.patch(`/notes/${id}/pin`);
    } catch (err) {
      console.error("Toggle pin error:", err.response?.data || err.message);
      setNotes(original);
      setError("Failed to toggle pin.");
    }
  };

  // ── Filtered notes ────────────────────────────────────────
  const filtered = notes.filter((n) =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    stripHtml(n.content).toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="notes-page-redesign">
      {/* Header */}
      <header className="notes-header">
        <h1 className="notes-title"><FiFileText /> My Notes</h1>
        <div className="notes-header-controls">
          <div className="notes-search-wrap">
            <FiSearch className="notes-search-icon" />
            <input
              className="notes-search"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="notes-view-toggle">
            <button
              className={`notes-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </button>
            <button
              className={`notes-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiListIcon />
            </button>
          </div>
          <button className="notes-new-btn" onClick={openNewNote}>
            <FiPlus /> New Note
          </button>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="notes-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}><FiX /></button>
        </div>
      )}

      {/* Notes grid / list */}
      <div className={`notes-container ${viewMode}`}>
        {loading && <p className="notes-loading">Loading notes…</p>}
        {!loading && filtered.length === 0 && (
          <div className="notes-empty-state">
            <FiFileText className="notes-empty-icon" />
            <p>No notes yet. Create your first note!</p>
            <button className="notes-new-btn-lg" onClick={openNewNote}>
              <FiPlus /> New Note
            </button>
          </div>
        )}
        {filtered.map((note) => (
          <div
            key={note._id}
            className={`notes-card ${note.isPinned ? "pinned" : ""}`}
            onClick={() => openEditNote(note)}
          >
            <div className="notes-card-header">
              <h3 className="notes-card-title">
                {note.title}
                {note.isPinned && <span className="notes-pin-badge">📌</span>}
              </h3>
              <div className="notes-card-actions">
                <button
                  className="notes-pin-btn"
                  onClick={(e) => togglePin(note._id, e)}
                  title={note.isPinned ? "Unpin" : "Pin"}
                >
                  📌
                </button>
                <button
                  className="notes-delete-btn"
                  onClick={(e) => handleDelete(note._id, e)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p className="notes-card-preview">
              {stripHtml(note.content).slice(0, 120)}
            </p>
            <div className="notes-card-footer">
              <span className="notes-card-time">{timeAgo(note.updatedAt)}</span>
              <span className="notes-card-wordcount">
                {stripHtml(note.content).split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Modal (Create / Edit) ─────────────────────────── */}
      {modalOpen && (
        <div className="notes-modal-overlay" onClick={closeModal}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notes-modal-header">
              <h2>{editingNote?._id ? "Edit Note" : "New Note"}</h2>
              <button className="notes-modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>

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

            {/* Editor */}
            <div className="notes-modal-editor-wrapper">
              <EditorContent editor={editor} className="notes-editor" />
            </div>

            {/* Modal footer */}
            <div className="notes-modal-footer">
              <div className="notes-modal-meta">
                <span>
                  {editingNote ? stripHtml(editingNote.content).split(/\s+/).filter(Boolean).length : 0} words
                </span>
                <label className="notes-pin-toggle">
                  <input
                    type="checkbox"
                    checked={editingNote?.isPinned || false}
                    onChange={(e) =>
                      setEditingNote((prev) => ({ ...prev, isPinned: e.target.checked }))
                    }
                  />
                  Pin note
                </label>
              </div>
              <div className="notes-modal-actions">
                <button className="notes-btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="notes-btn-primary" onClick={saveNote}>
                  {editingNote?._id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}