import { useEffect, useState } from 'react';

interface Note {
  id: string;
  text: string;
  url: string;
  pageTitle: string;
  createdAt: string;
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  async function loadNotes() {
    const res = await browser.runtime.sendMessage({ type: 'GET_NOTES' });
    setNotes(res.notes || []);
  }

  async function handleDelete(id: string) {
    await browser.runtime.sendMessage({ type: 'DELETE_NOTE', id });
    loadNotes();
  }

  useEffect(() => {
    loadNotes();
    const onChanged = (changes: { [key: string]: any }) => {
      if (changes.notes) loadNotes();
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Rwote</h1>
        <span className="count">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
      </header>

      {notes.length === 0 ? (
        <div className="empty">
          <p>No notes yet</p>
          <p className="empty-hint">Select text on any page → right-click → Save to Rwote</p>
        </div>
      ) : (
        <div className="notes">
          {notes.map((note) => (
            <div key={note.id} className="card">
              <div className="card-text">{escHtml(note.text)}</div>
              <div className="card-meta">
                <a
                  className="card-link"
                  href={note.url}
                  title={note.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {escHtml(note.pageTitle || note.url)}
                </a>
                <span className="card-time">{formatTime(note.createdAt)}</span>
              </div>
              <button className="card-del" onClick={() => handleDelete(note.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
