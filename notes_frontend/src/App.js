import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional theme notes app with in-memory CRUD and optional backend integration.
 * Components: Header, Sidebar, NotesList, NoteEditor.
 * Model: { id, title, content, createdAt, updatedAt, tags: string[] }
 */

// Helpers
const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

// PUBLIC_INTERFACE
export function detectApiBase() {
  /** Detect API base URL from environment; return undefined if not set. */
  const maybe =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_WS_URL;
  if (!maybe || String(maybe).trim() === '') return undefined;
  return String(maybe).replace(/\/+$/, '');
}

/**
 * A small persistence shim: if backend isn't present, persist to localStorage
 */
const storageKey = 'notes_app_state_v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveToStorage(data) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore storage errors (e.g., quota)
  }
}

// PUBLIC_INTERFACE
export function defaultNote() {
  /** Create a new default note object */
  const ts = nowISO();
  return {
    id: uid(),
    title: 'Untitled note',
    content: '',
    tags: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

// PUBLIC_INTERFACE
export function matchesQuery(note, query) {
  /** Returns true if a note matches a case-insensitive search query across title, content, tags */
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (note.title || '').toLowerCase().includes(q) ||
    (note.content || '').toLowerCase().includes(q) ||
    (note.tags || []).some((t) => String(t).toLowerCase().includes(q))
  );
}

// PUBLIC_INTERFACE
export function filterByTag(note, activeTag) {
  /** Returns true if activeTag is empty or note contains the tag */
  if (!activeTag) return true;
  return (note.tags || []).includes(activeTag);
}

// Header Component
function Header({ theme, onToggleTheme, onNewNote, search, setSearch }) {
  return (
    <header className="header" role="banner">
      <div className="brand">
        <div className="logo" aria-hidden="true">📝</div>
        <div className="brand-meta">
          <h1 className="app-title">Ocean Notes</h1>
          <p className="app-subtitle">Focus-first personal notes</p>
        </div>
      </div>
      <div className="header-actions">
        <div className="search-wrap">
          <label htmlFor="search" className="visually-hidden">Search notes</label>
          <input
            id="search"
            type="search"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <button className="btn primary" onClick={onNewNote}>
          + New
        </button>
        <button
          className="btn ghost"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

// Sidebar Component
function Sidebar({ notes, activeTag, setActiveTag, onClearTag }) {
  // Aggregate tags
  const tagCounts = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [notes]);

  return (
    <aside className="sidebar" aria-label="Sidebar with filters">
      <div className="sidebar-section">
        <h2 className="section-title">Filters</h2>
        <div className="filters">
          <button
            className={`chip ${!activeTag ? 'active' : ''}`}
            onClick={() => setActiveTag('')}
            aria-pressed={!activeTag}
          >
            All
          </button>
          {tagCounts.map(({ tag, count }) => (
            <button
              key={tag}
              className={`chip ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(tag)}
              aria-pressed={activeTag === tag}
            >
              #{tag} <span className="chip-count">{count}</span>
            </button>
          ))}
        </div>
        {activeTag && (
          <button className="btn small ghost mt-8" onClick={onClearTag}>
            Clear tag filter
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <h2 className="section-title">Tags (placeholder)</h2>
        <p className="muted">Use the editor to add tags to your notes.</p>
      </div>
    </aside>
  );
}

// NotesList Component
function NotesList({ notes, selectedId, onSelect, onDelete }) {
  if (!notes.length) {
    return (
      <div role="status" className="empty-state">
        <p>No notes yet. Create a new one to get started.</p>
      </div>
    );
  }
  return (
    <ul className="notes-list" role="list">
      {notes.map((n) => (
        <li key={n.id}>
          <button
            className={`note-card ${selectedId === n.id ? 'active' : ''}`}
            onClick={() => onSelect(n.id)}
            aria-pressed={selectedId === n.id}
            aria-label={`Open note: ${n.title || 'Untitled'}`}
          >
            <div className="note-card-title">{n.title || 'Untitled'}</div>
            <div className="note-card-meta">
              <span className="date">{new Date(n.updatedAt).toLocaleString()}</span>
              <div className="tags">
                {(n.tags || []).slice(0, 3).map((t) => (
                  <span className="tag" key={t}>#{t}</span>
                ))}
              </div>
            </div>
          </button>
          <button
            className="icon-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(n.id);
            }}
            aria-label={`Delete note ${n.title || 'Untitled'}`}
            title="Delete"
          >
            🗑
          </button>
        </li>
      ))}
    </ul>
  );
}

// NoteEditor Component
function NoteEditor({ note, onChange, onSave }) {
  if (!note) {
    return (
      <div className="editor empty-state">
        <p>Select a note to start editing, or create a new one.</p>
      </div>
    );
  }

  const handleTitle = (e) => onChange({ ...note, title: e.target.value, updatedAt: nowISO() });
  const handleContent = (e) => onChange({ ...note, content: e.target.value, updatedAt: nowISO() });
  const handleTags = (e) => {
    const raw = e.target.value;
    const tags = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    onChange({ ...note, tags, updatedAt: nowISO() });
  };

  return (
    <div className="editor" role="region" aria-label="Note editor">
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          className="input large"
          value={note.title}
          onChange={handleTitle}
          placeholder="Note title"
        />
      </div>

      <div className="field">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          className="textarea"
          value={note.content}
          onChange={handleContent}
          placeholder="Write your thoughts here…"
          rows={12}
        />
      </div>

      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          className="input"
          value={(note.tags || []).join(', ')}
          onChange={handleTags}
          placeholder="e.g., work, ideas, todos"
          aria-describedby="tagsHelp"
        />
        <div id="tagsHelp" className="help-text">
          Separate tags with commas. Example: design, research
        </div>
      </div>

      <div className="actions">
        <button className="btn primary" onClick={() => onSave(note)}>Save</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main App component with in-memory state and optional backend calls */
  const [theme, setTheme] = useState('light');
  const [notes, setNotes] = useState(() => {
    const fromStorage = loadFromStorage();
    return Array.isArray(fromStorage) ? fromStorage : [];
  });
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const apiBase = detectApiBase();

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist to localStorage when notes change and no backend is configured
  useEffect(() => {
    if (!apiBase) {
      saveToStorage(notes);
    }
  }, [notes, apiBase]);

  // Backend interaction helpers (graceful fallback to in-memory only)
  const saveNoteBackend = async (note) => {
    if (!apiBase) return null;
    try {
      const method = notes.some((n) => n.id === note.id) ? 'PUT' : 'POST';
      const url = method === 'POST' ? `${apiBase}/notes` : `${apiBase}/notes/${note.id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error('Failed to save note');
      return await res.json();
    } catch {
      return null;
    }
  };

  const deleteNoteBackend = async (id) => {
    if (!apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/notes/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  };

  const onToggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const createNote = () => {
    const n = defaultNote();
    setNotes((prev) => [n, ...prev]);
    setSelectedId(n.id);
  };

  const updateNote = (updated) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const saveNote = async (note) => {
    const saved = await saveNoteBackend(note);
    if (saved && saved.id) {
      // Sync with server response if provided
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    }
  };

  const removeNote = async (id) => {
    const ok = await deleteNoteBackend(id);
    // Regardless of backend result for now, remove locally to keep UI snappy.
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const filtered = useMemo(() => {
    return notes
      .filter((n) => matchesQuery(n, search))
      .filter((n) => filterByTag(n, activeTag))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [notes, search, activeTag]);

  const selected = notes.find((n) => n.id === selectedId) || null;

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNewNote={createNote}
        search={search}
        setSearch={setSearch}
      />
      <div className="content-area">
        <Sidebar
          notes={notes}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          onClearTag={() => setActiveTag('')}
        />
        <main className="main">
          <section className="notes-panel" aria-label="Notes list">
            <NotesList
              notes={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={removeNote}
            />
          </section>
          <section className="editor-panel" aria-label="Editor">
            <NoteEditor note={selected} onChange={updateNote} onSave={saveNote} />
          </section>
        </main>
      </div>
      <footer className="footer" role="contentinfo">
        <div className="muted small">
          {apiBase ? (
            <span>Connected to backend: {apiBase}</span>
          ) : (
            <span>Using in-memory/local storage. Configure REACT_APP_API_BASE to sync with a backend.</span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
