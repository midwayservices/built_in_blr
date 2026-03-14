'use client';
import { useEffect, useMemo, useState } from 'react';

type Status = 'running' | 'idle' | 'paused' | 'finished';

type Machine = {
  id: string;
  name: string;
  status: Status;
  timeLeftMinutes: number;
  updatedAt: string;
};

type MachinesResponse = {
  machines: Machine[];
  updatedAt: string;
};

// Add global styles for responsive design
if (typeof document !== 'undefined' && !document.getElementById('mobile-styles')) {
  const style = document.createElement('style');
  style.id = 'mobile-styles';
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
    
    @media (max-width: 600px) {
      [data-card] {
        padding: 12px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default function ClientHome() {
  const [data, setData] = useState<MachinesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReloadPrompt, setShowReloadPrompt] = useState(false);

  const fetchData = async () => {
    setError(null);
    try {
      const res = await fetch('/api/machines', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as MachinesResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message ?? 'Error');
    } finally {
      setLoading(false);
      setShowReloadPrompt(false);
      resetReloadTimer();
    }
  };

  const resetReloadTimer = () => {
    window.clearTimeout((window as any).__reloadTimer);
    (window as any).__reloadTimer = window.setTimeout(() => {
      setShowReloadPrompt(true);
    }, 20000);
  };

  useEffect(() => {
    fetchData();
    return () => {
      window.clearTimeout((window as any).__reloadTimer);
    };
  }, []);

  const lastUpdated = useMemo(() => {
    const ts = data?.updatedAt ?? data?.machines?.[0]?.updatedAt;
    return ts ? new Date(ts).toLocaleString() : null;
  }, [data]);

  return (
    <main style={styles.container}>
      <h1 style={styles.h1}>Washing Machines</h1>
      {loading && <p style={styles.message}>Loading...</p>}
      {error && (
        <p style={styles.error}>
          {error}{' '}
          <button onClick={fetchData} style={styles.button}>
            Retry
          </button>
        </p>
      )}
      {!loading && !error && data && (
        <>
          <div style={styles.cards}>
            {data.machines.map((m) => (
              <div key={m.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>{m.name}</h2>
                  <StatusPill status={m.status} />
                </div>
                <p style={styles.timeLeft}>Time left: {m.timeLeftMinutes} min</p>
                <p style={styles.updated}>Updated: {new Date(m.updatedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
          {lastUpdated && <p style={styles.updated}>Last updated: {lastUpdated}</p>}
          <button
            onClick={fetchData}
            style={{ ...styles.reload, ...(showReloadPrompt ? styles.reloadPulse : {}) }}
            title="Reload data"
          >
            Reload
          </button>
          {showReloadPrompt && <p style={styles.hint}>Data may be stale — click reload.</p>}
        </>
      )}
    </main>
  );
}

function StatusPill({ status }: { status: Status }) {
  const color =
    status === 'running'
      ? '#16a34a'
      : status === 'idle'
      ? '#6b7280'
      : status === 'paused'
      ? '#eab308'
      : '#3b82f6';
  return (
    <span style={{ ...styles.pill, backgroundColor: color }}>
      {status.toUpperCase()}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '16px',
    fontFamily: 'system-ui, Arial',
    minHeight: '100vh'
  },
  h1: {
    marginBottom: 16,
    fontSize: 'clamp(24px, 6vw, 32px)',
    marginTop: 0
  },
  message: {
    textAlign: 'center',
    color: '#6b7280'
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 16,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  cardTitle: {
    margin: 0,
    fontSize: 'clamp(18px, 4vw, 20px)',
    flex: 1,
    minWidth: 0
  },
  timeLeft: {
    margin: '8px 0',
    fontSize: 16
  },
  updated: {
    color: '#6b7280',
    fontSize: 12,
    margin: '4px 0'
  },
  error: {
    color: '#b91c1c',
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  button: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  reload: {
    marginTop: 16,
    padding: '10px 16px',
    borderRadius: 9999,
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    background: '#f9fafb',
    fontSize: '16px',
    fontWeight: 500,
    width: '100%',
    maxWidth: 200,
    transition: 'all 0.2s'
  },
  reloadPulse: {
    animation: 'pulse 1.5s infinite',
    boxShadow: '0 0 0 0 rgba(59,130,246,0.7)'
  },
  hint: {
    color: '#1f2937',
    marginTop: 8,
    fontSize: '14px',
    textAlign: 'center'
  },
  footer: {
    marginTop: 32,
    color: '#6b7280',
    fontSize: 14
  },
  pill: {
    color: 'white',
    padding: '4px 8px',
    fontSize: 12,
    letterSpacing: 0.5,
    borderRadius: 4,
    whiteSpace: 'nowrap',
    flexShrink: 0
  }
};
