import type { NextApiRequest, NextApiResponse } from 'next';
import { botManager } from '../../../lib/botManager';

// Active Baileys sockets per bot
const activeSockets = new Map<string, any>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  // GET - status bot
  if (req.method === 'GET') {
    const bot = botManager.getBot(id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    return res.status(200).json({ bot });
  }

  // DELETE - hapus bot
  if (req.method === 'DELETE') {
    const sock = activeSockets.get(id);
    if (sock) {
      try { await sock.logout(); } catch {}
      activeSockets.delete(id);
    }
    botManager.deleteBot(id);
    return res.status(200).json({ success: true });
  }

  // PATCH - connect / disconnect / send message
  if (req.method === 'PATCH') {
    const { action, phone, message, to } = req.body;

    // --- CONNECT with pairing code ---
    if (action === 'connect') {
      const bot = botManager.getBot(id);
      if (!bot) return res.status(404).json({ error: 'Bot not found' });
      if (!phone) return res.status(400).json({ error: 'phone number required for pairing code' });

      botManager.updateBot(id, { status: 'connecting', error: null });

      // Dynamic import agar tidak crash di Vercel edge
      const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = await import('@whiskeysockets/baileys');
      const { Boom } = await import('@hapi/boom');
      const { makeInMemoryStore } = await import('@whiskeysockets/baileys');
      const P = (await import('pino')).default;

      const logger = P({ level: 'silent' });
      // Auth state pakai memori saja (ganti ke Redis/DB untuk production)
      const { state, saveCreds } = await useMultiFileAuthState(`/tmp/auth_${id}`);

      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        printQRInTerminal: false,
        mobile: false,
      });

      activeSockets.set(id, sock);

      // Request pairing code
      if (!sock.authState.creds.registered) {
        const cleanPhone = phone.replace(/\D/g, '');
        setTimeout(async () => {
          try {
            const code = await sock.requestPairingCode(cleanPhone);
            botManager.updateBot(id, {
              status: 'qr_ready',
              qrCode: code, // simpan pairing code di field qrCode
            });
          } catch (e: any) {
            botManager.updateBot(id, { status: 'error', error: e.message });
          }
        }, 3000);
      }

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }: any) => {
        if (connection === 'open') {
          const phone = sock.user?.id?.split(':')[0] ?? 'Unknown';
          botManager.updateBot(id, {
            status: 'connected',
            phoneNumber: phone,
            qrCode: null,
          });
        }

        if (connection === 'close') {
          const reason = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = reason !== DisconnectReason.loggedOut;
          botManager.updateBot(id, {
            status: shouldReconnect ? 'connecting' : 'disconnected',
            error: shouldReconnect ? 'Reconnecting...' : 'Logged out',
          });
          if (!shouldReconnect) activeSockets.delete(id);
        }
      });

      sock.ev.on('messages.upsert', () => {
        botManager.incrementMessages(id);
      });

      return res.status(200).json({ message: 'Connecting... pairing code will be ready in seconds' });
    }

    // --- DISCONNECT ---
    if (action === 'disconnect') {
      const sock = activeSockets.get(id);
      if (sock) {
        try { await sock.logout(); } catch {}
        activeSockets.delete(id);
      }
      botManager.updateBot(id, { status: 'disconnected', phoneNumber: null, qrCode: null });
      return res.status(200).json({ success: true });
    }

    // --- SEND MESSAGE ---
    if (action === 'send') {
      const sock = activeSockets.get(id);
      if (!sock) return res.status(400).json({ error: 'Bot not connected' });
      if (!to || !message) return res.status(400).json({ error: 'to and message required' });

      const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      botManager.incrementMessages(id);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  res.setHeader('Allow', ['GET', 'DELETE', 'PATCH']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
