import { useState, useEffect, useCallback } from 'react';

interface Bot {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  qrCode: string | null;
  phoneNumber: string | null;
  createdAt: string;
  lastActivity: string | null;
  messageCount: number;
  error: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  disconnected: '#64748b',
  connecting: '#f59e0b',
  qr_ready: '#6366f1',
  connected: '#22c55e',
  error: '#ef4444',
};

const STATUS_LABEL: Record<string, string> = {
  disconnected: 'Terputus',
  connecting: 'Menghubungkan...',
  qr_ready: 'Pairing Code Siap',
  connected: 'Terhubung',
  error: 'Error',
};

export default function Home() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [newBotName, setNewBotName] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectModal, setConnectModal] = useState<{ botId: string; name: string } | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [sendModal, setSendModal] = useState<{ botId: string; name: string } | null>(null);
  const [sendTo, setSendTo] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBots = useCallback(async () => {
    const res = await fetch('/api/bots');
    const data = await res.json();
    setBots(data.bots ?? []);
  }, []);

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 3000);
    return () => clearInterval(interval);
  }, [fetchBots]);

  const createBot = async () => {
    if (!newBotName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBotName.trim() }),
      });
      if (res.ok) {
        setNewBotName('');
        fetchBots();
        showToast('Bot berhasil dibuat!');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteBot = async (id: string) => {
    if (!confirm('Hapus bot ini?')) return;
    await fetch(`/api/bots/${id}`, { method: 'DELETE' });
    fetchBots();
    showToast('Bot dihapus');
  };

  const connectBot = async () => {
    if (!connectModal || !phoneInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/${connectModal.botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', phone: phoneInput.trim() }),
      });
      if (res.ok) {
        showToast('Menghubungkan... tunggu pairing code muncul (~3 detik)');
        setConnectModal(null);
        setPhoneInput('');
      } else {
        const d = await res.json();
        showToast(d.error ?? 'Gagal', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectBot = async (id: string) => {
    await fetch(`/api/bots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect' }),
    });
    fetchBots();
    showToast('Bot diputus');
  };

  const sendMessage = async () => {
    if (!sendModal || !sendTo.trim() || !sendMsg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/${sendModal.botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', to: sendTo.trim(), message: sendMsg.trim() }),
      });
      if (res.ok) {
        showToast('Pesan terkirim!');
        setSendModal(null);
        setSendTo('');
        setSendMsg('');
      } else {
        const d = await res.json();
        showToast(d.error ?? 'Gagal kirim', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const connectedCount = bots.filter(b => b.status === 'connected').length;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1e; color: #e2e8f0; font-family: 'Inter', 'Segoe UI', sans-serif; min-height: 100vh; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        .header { background: linear-gradient(135deg, #0d1b2e 0%, #0f2744 100%); border-bottom: 1px solid #1e3a5f; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .logo { width: 40px; height: 40px; background: linear-gradient(135deg, #25d366, #128c7e); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .header h1 { font-size: 20px; font-weight: 700; color: #f0f9ff; letter-spacing: -0.3px; }
        .header p { font-size: 13px; color: #64748b; margin-top: 2px; }
        .badge { background: #0f3460; border: 1px solid #1e5090; color: #7dd3fc; font-size: 12px; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
        .main { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: #0d1b2e; border: 1px solid #1e3a5f; border-radius: 12px; padding: 20px; }
        .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .stat-card .value { font-size: 32px; font-weight: 800; color: #f0f9ff; line-height: 1; }
        .stat-card .value.green { color: #22c55e; }
        .stat-card .value.indigo { color: #818cf8; }
        .create-section { background: #0d1b2e; border: 1px solid #1e3a5f; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
        .create-section h2 { font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
        .input-row { display: flex; gap: 10px; }
        input[type="text"], input[type="tel"] { background: #070d19; border: 1px solid #1e3a5f; border-radius: 8px; color: #e2e8f0; font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.2s; }
        input[type="text"]:focus, input[type="tel"]:focus { border-color: #3b82f6; }
        .input-row input { flex: 1; }
        textarea { background: #070d19; border: 1px solid #1e3a5f; border-radius: 8px; color: #e2e8f0; font-size: 14px; padding: 10px 14px; outline: none; width: 100%; resize: vertical; transition: border-color 0.2s; font-family: inherit; }
        textarea:focus { border-color: #3b82f6; }
        .btn { border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; padding: 10px 18px; transition: all 0.2s; white-space: nowrap; }
        .btn-primary { background: #3b82f6; color: #fff; }
        .btn-primary:hover { background: #2563eb; }
        .btn-primary:disabled { background: #1e3a5f; color: #475569; cursor: not-allowed; }
        .btn-success { background: #166534; color: #86efac; border: 1px solid #15803d; }
        .btn-success:hover { background: #15803d; }
        .btn-warning { background: #78350f; color: #fcd34d; border: 1px solid #92400e; }
        .btn-warning:hover { background: #92400e; }
        .btn-danger { background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; }
        .btn-danger:hover { background: #7f1d1d; }
        .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; }
        .btn-ghost { background: transparent; color: #64748b; border: 1px solid #1e3a5f; }
        .btn-ghost:hover { background: #0d1b2e; color: #94a3b8; }
        .bots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .bot-card { background: #0d1b2e; border: 1px solid #1e3a5f; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: border-color 0.2s; }
        .bot-card:hover { border-color: #2d5a9e; }
        .bot-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .bot-avatar { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .bot-info { flex: 1; min-width: 0; }
        .bot-name { font-size: 15px; font-weight: 700; color: #f0f9ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bot-phone { font-size: 12px; color: #64748b; margin-top: 3px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .bot-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .bot-stat { background: #070d19; border: 1px solid #0f2744; border-radius: 8px; padding: 10px 12px; }
        .bot-stat .s-label { font-size: 11px; color: #475569; margin-bottom: 4px; }
        .bot-stat .s-value { font-size: 16px; font-weight: 700; color: #cbd5e1; }
        .pairing-box { background: #0a1628; border: 1px solid #1e4080; border-radius: 10px; padding: 16px; text-align: center; }
        .pairing-box .p-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .pairing-code { font-size: 26px; font-weight: 800; color: #818cf8; letter-spacing: 6px; font-family: 'Courier New', monospace; }
        .pairing-hint { font-size: 11px; color: #475569; margin-top: 6px; }
        .bot-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .error-box { background: #1a0707; border: 1px solid #7f1d1d; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #fca5a5; }
        .empty-state { text-align: center; padding: 60px 20px; color: #475569; }
        .empty-state .icon { font-size: 48px; margin-bottom: 12px; }
        .empty-state p { font-size: 15px; }
        /* Modal */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .modal { background: #0d1b2e; border: 1px solid #1e3a5f; border-radius: 16px; padding: 28px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .modal h2 { font-size: 17px; font-weight: 700; color: #f0f9ff; margin-bottom: 6px; }
        .modal p { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
        .form-group { margin-bottom: 14px; }
        .form-group label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
        .form-group input, .form-group textarea { width: 100%; }
        /* Toast */
        .toast { position: fixed; bottom: 24px; right: 24px; z-index: 200; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.4); animation: slideUp 0.3s ease; }
        .toast.success { background: #14532d; color: #86efac; border: 1px solid #166534; }
        .toast.error { background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) { .main { padding: 16px; } .stats { grid-template-columns: 1fr; } .header { padding: 16px; } }
      `}</style>

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="logo">💬</div>
          <div>
            <h1>WA Bot Manager</h1>
            <p>Kelola semua bot WhatsApp dalam satu tempat</p>
          </div>
        </div>
        <div className="badge">{connectedCount} / {bots.length} Online</div>
      </div>

      <div className="main">
        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="label">Total Bot</div>
            <div className="value">{bots.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Terhubung</div>
            <div className="value green">{connectedCount}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Pesan</div>
            <div className="value indigo">{bots.reduce((a, b) => a + b.messageCount, 0)}</div>
          </div>
        </div>

        {/* Create Bot */}
        <div className="create-section">
          <h2>Tambah Bot Baru</h2>
          <div className="input-row">
            <input
              type="text"
              placeholder="Nama bot (misal: CS Bot, Notif Bot...)"
              value={newBotName}
              onChange={e => setNewBotName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createBot()}
            />
            <button className="btn btn-primary" onClick={createBot} disabled={loading || !newBotName.trim()}>
              + Tambah
            </button>
          </div>
        </div>

        {/* Bot Grid */}
        {bots.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🤖</div>
            <p>Belum ada bot. Tambahkan bot pertamamu!</p>
          </div>
        ) : (
          <div className="bots-grid">
            {bots.map(bot => {
              const color = STATUS_COLOR[bot.status] ?? '#64748b';
              return (
                <div className="bot-card" key={bot.id}>
                  <div className="bot-header">
                    <div className="bot-avatar" style={{ background: `${color}22` }}>🤖</div>
                    <div className="bot-info">
                      <div className="bot-name">{bot.name}</div>
                      <div className="bot-phone">{bot.phoneNumber ? `+${bot.phoneNumber}` : 'Belum tersambung'}</div>
                    </div>
                    <span
                      className="status-badge"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
                    >
                      <span className="status-dot" style={{ background: color }} />
                      {STATUS_LABEL[bot.status]}
                    </span>
                  </div>

                  {/* Pairing Code Box */}
                  {bot.status === 'qr_ready' && bot.qrCode && (
                    <div className="pairing-box">
                      <div className="p-label">Masukkan kode ini di WhatsApp</div>
                      <div className="pairing-code">{bot.qrCode}</div>
                      <div className="pairing-hint">
                        WA → Perangkat Tertaut → Tautkan Perangkat → Masukkan Kode
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {bot.error && bot.status === 'error' && (
                    <div className="error-box">⚠️ {bot.error}</div>
                  )}

                  {/* Stats */}
                  <div className="bot-stats">
                    <div className="bot-stat">
                      <div className="s-label">Pesan Masuk</div>
                      <div className="s-value">{bot.messageCount}</div>
                    </div>
                    <div className="bot-stat">
                      <div className="s-label">Aktif Terakhir</div>
                      <div className="s-value" style={{ fontSize: 11 }}>
                        {bot.lastActivity
                          ? new Date(bot.lastActivity).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bot-actions">
                    {bot.status === 'disconnected' || bot.status === 'error' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setConnectModal({ botId: bot.id, name: bot.name })}
                      >
                        🔗 Hubungkan
                      </button>
                    ) : bot.status === 'connected' ? (
                      <>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => setSendModal({ botId: bot.id, name: bot.name })}
                        >
                          ✉️ Kirim Pesan
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => disconnectBot(bot.id)}
                        >
                          Putus
                        </button>
                      </>
                    ) : null}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteBot(bot.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {connectModal && (
        <div className="overlay" onClick={() => setConnectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🔗 Hubungkan {connectModal.name}</h2>
            <p>Masukkan nomor WhatsApp yang akan dihubungkan. Pairing code akan muncul di kartu bot.</p>
            <div className="form-group">
              <label>Nomor WhatsApp</label>
              <input
                type="tel"
                placeholder="628xxxxxxxxxx (format internasional, tanpa +)"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConnectModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={connectBot} disabled={loading || !phoneInput.trim()}>
                {loading ? 'Menghubungkan...' : 'Dapatkan Kode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {sendModal && (
        <div className="overlay" onClick={() => setSendModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✉️ Kirim Pesan via {sendModal.name}</h2>
            <p>Kirim pesan WhatsApp langsung dari dashboard.</p>
            <div className="form-group">
              <label>Nomor Tujuan</label>
              <input
                type="tel"
                placeholder="628xxxxxxxxxx"
                value={sendTo}
                onChange={e => setSendTo(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Pesan</label>
              <textarea rows={4} placeholder="Tulis pesan..." value={sendMsg} onChange={e => setSendMsg(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSendModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !sendTo.trim() || !sendMsg.trim()}>
                {loading ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
