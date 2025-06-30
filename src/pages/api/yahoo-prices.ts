import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol, range = '3y', interval = '1d' } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    res.status(400).json({ error: 'Missing symbol' });
    return;
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  try {
    const yahooRes = await fetch(url);
    const data = await yahooRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Yahoo' });
  }
}