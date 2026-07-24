import type { NextApiRequest, NextApiResponse } from 'next';
import { botManager } from '../../../lib/botManager';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const bots = botManager.getAllBots();
    return res.status(200).json({ bots });
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }
    const bot = botManager.createBot(name.trim());
    return res.status(201).json({ bot });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
