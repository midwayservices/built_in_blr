"use client";
import { useEffect, useState } from 'react';
import type { Machine } from '@/lib/types';

export default function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/machines', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthed(false);
      } else {
        const json = await res.json();
        setMachines(json.machines);
        setAuthed(true);
        setLoadedAt(json.updatedAt);
      }
    } catch {
      setAuthed(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      await checkAuth();
    } else {
      setError('Invalid password');
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machines })
    });
    setSaving(false);
    if (res.ok) {
      const json = await res.json();
      setMachines(json.machines);
      setLoadedAt(json.updatedAt);
    } else if (res.status === 401) {
      setAuthed(false);
    } else {
      const text = await res.text();
      setError(text || 'Save failed');
    }
  };

  if (authed === null) return <main style={styles.container}><h1>Admin</h1><p>Loading...</p></main>;
  if (!authed) {
    return (
      <main style={styles.container}>
        <h1>Admin</h1>
        <form onSubmit={login} style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <h1>Admin</h1>
      <p style={styles.meta}>Loaded at: {loadedAt ? new Date(loadedAt).toLocaleString() : '-'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        {machines.map((m, idx) => (
          <div key={m.id} style={styles.card}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              value={m.name}
              onChange={(e) => update(idx, { name: e.target.value })}
            />
            <label style={styles.label}>Status</label>
            <select
              style={styles.input}
              value={m.status}
              onChange={(e) => update(idx, { status: e.target.value as Machine['status'] })}
            >
              <option value="running">running</option>
              <option value="idle">idle</option>
              <option value="paused">paused</option>
              <option value="finished">finished</option>
            </select>
            <label style={styles.label}>Time left (min)</label>
            <input
              type="number"
              min={0}
              style={styles.input}
              value={m.timeLeftMinutes}
              onChange={(e) => update(idx, { timeLeftMinutes: Number(e.target.value) })}
            />
            <p style={styles.meta}>Updated: {new Date(m.updatedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={save} disabled={saving} style={styles.button}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </main>
  );

  function update(idx: number, patch: Partial<Machine>) {
    setMachines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch, updatedAt: new Date().toISOString() };
      return next;
    });
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 900, margin: '0 auto', padding: 24 },
  card: { border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' },
  label: { display: 'block', fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 4 },
  input: { border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, width: '100%' },
  button: { padding: '10px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' },
  meta: { color: '#6b7280', fontSize: 12 }
};

