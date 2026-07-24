import { v4 as uuidv4 } from 'uuid';

export type BotStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';

export interface BotInstance {
  id: string;
  name: string;
  status: BotStatus;
  qrCode: string | null;
  phoneNumber: string | null;
  createdAt: Date;
  lastActivity: Date | null;
  messageCount: number;
  error: string | null;
}

// In-memory store (use Redis/DB for production)
const bots = new Map<string, BotInstance>();
const qrCallbacks = new Map<string, (qr: string) => void>();
const connectionCallbacks = new Map<string, (phone: string) => void>();

export const botManager = {
  createBot(name: string): BotInstance {
    const id = uuidv4();
    const bot: BotInstance = {
      id,
      name,
      status: 'disconnected',
      qrCode: null,
      phoneNumber: null,
      createdAt: new Date(),
      lastActivity: null,
      messageCount: 0,
      error: null,
    };
    bots.set(id, bot);
    return bot;
  },

  getBot(id: string): BotInstance | undefined {
    return bots.get(id);
  },

  getAllBots(): BotInstance[] {
    return Array.from(bots.values());
  },

  updateBot(id: string, updates: Partial<BotInstance>): BotInstance | null {
    const bot = bots.get(id);
    if (!bot) return null;
    const updated = { ...bot, ...updates };
    bots.set(id, updated);
    return updated;
  },

  deleteBot(id: string): boolean {
    return bots.delete(id);
  },

  setQrCallback(id: string, cb: (qr: string) => void) {
    qrCallbacks.set(id, cb);
  },

  triggerQr(id: string, qr: string) {
    const cb = qrCallbacks.get(id);
    if (cb) cb(qr);
  },

  setConnectionCallback(id: string, cb: (phone: string) => void) {
    connectionCallbacks.set(id, cb);
  },

  triggerConnection(id: string, phone: string) {
    const cb = connectionCallbacks.get(id);
    if (cb) cb(phone);
  },

  incrementMessages(id: string) {
    const bot = bots.get(id);
    if (bot) {
      bots.set(id, {
        ...bot,
        messageCount: bot.messageCount + 1,
        lastActivity: new Date(),
      });
    }
  },
};
