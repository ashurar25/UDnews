import { Router } from 'express';
import NodeCache from 'node-cache';
import Parser from 'rss-parser';
import { getLatestLotteryResults } from './services/lottery';

// Thai Government Lottery community API (Rayriffy)
// Docs: https://api.rayriffy.com/
const BASE = process.env.LOTTERY_API_BASE || 'https://api.rayriffy.com/api';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 }); // 5 minutes fresh cache
const STALE_TTL_SECONDS = 24 * 60 * 60; // 24 hours for stale fallback

function cacheKey(path: string) {
  return `lottery:${path}`;
}

function staleKey(path: string) {
  return `lottery:stale:${path}`;
}

async function getJson<T>(path: string): Promise<T> {
  const key = cacheKey(path);
  const sKey = staleKey(path);
  const cached = cache.get<T>(key);
  if (cached) return cached;
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`Lottery API error: ${res.status}`);
    const data = await res.json();
    // set fresh and stale caches
    cache.set(key, data, 300);
    cache.set(sKey, data, STALE_TTL_SECONDS);
    return data as T;
  } catch (err: any) {
    // fallback to stale cache if available
    const stale = cache.get<T>(sKey);
    if (stale) return stale;
    throw err;
  }
}

// Map Rayriffy payload to a normalized structure our client can use
function normalizeLatest(data: any) {
  // Rayriffy latest example fields:
  // data.response.date.th, date.en, governmentID
  // rewards: { first, last2, first3, last3, near1st, second, third, fourth, fifth }
  const r = data?.response?.rewards || {};
  return {
    date: data?.response?.date?.th || data?.response?.date?.en || '',
    drawDate: data?.response?.date?.en || '',
    governmentId: data?.response?.governmentID || '',
    prizes: {
      first: r?.first?.rewards || [],
      nearFirst: r?.near1st?.rewards || [],
      last2: r?.last2?.rewards || [],
      first3: r?.first3?.rewards || [],
      last3: r?.last3?.rewards || [],
      second: r?.second?.rewards || [],
      third: r?.third?.rewards || [],
      fourth: r?.fourth?.rewards || [],
      fifth: r?.fifth?.rewards || [],
    },
  };
}

function checkNumberAgainstPrizes(number: string, prizes: any) {
  const n = (number || '').trim();
  const result: { prize: string; match: string }[] = [];
  const add = (prize: string, match: string) => result.push({ prize, match });

  // 1st prize (6 digits exact)
  for (const p of prizes.first || []) {
    if (p === n) add('รางวัลที่ 1', p);
    // Near 1st: +/- 1
    const num = parseInt(p, 10);
    if (!Number.isNaN(num)) {
      if (String(num - 1).padStart(6, '0') === n || String(num + 1).padStart(6, '0') === n) {
        add('รางวัลข้างเคียงรางวัลที่ 1', n);
      }
    }
  }
  // 2nd-5th (6 digits exact)
  for (const p of prizes.second || []) if (p === n) add('รางวัลที่ 2', p);
  for (const p of prizes.third || []) if (p === n) add('รางวัลที่ 3', p);
  for (const p of prizes.fourth || []) if (p === n) add('รางวัลที่ 4', p);
  for (const p of prizes.fifth || []) if (p === n) add('รางวัลที่ 5', p);

  // 3-digit front/last
  const last3 = n.slice(-3);
  const first3 = n.slice(0, 3);
  for (const p of prizes.last3 || []) if (p === last3) add('เลขท้าย 3 ตัว', p);
  for (const p of prizes.first3 || []) if (p === first3) add('เลขหน้า 3 ตัว', p);

  // 2-digit last
  const last2 = n.slice(-2);
  for (const p of prizes.last2 || []) if (p === last2) add('เลขท้าย 2 ตัว', p);

  return result;
}

const router = Router();

// Official GLO homepage scrape (cached) - latest results
router.get('/latest', async (_req, res) => {
  try {
    const data = await getLatestLotteryResults();
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes client cache
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch latest lottery from GLO' });
  }
});

// Latest draw (normalized)
router.get('/thai/latest', async (req, res) => {
  try {
    const data = await getJson<any>('/lottery/latest');
    return res.json(normalizeLatest(data));
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch latest lottery' });
  }
});

// Historical by date (YYYY-MM-DD)
router.get('/thai/draws', async (req, res) => {
  try {
    const date = String((req.query as any).date || '').trim();
    if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    const data = await getJson<any>(`/lottery/${encodeURIComponent(date)}`);
    return res.json(normalizeLatest(data));
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch lottery draw' });
  }
});

// Check numbers (array of 6-digit strings) against latest draw
router.post('/thai/check', async (req, res) => {
  try {
    const numbers: string[] = Array.isArray(req.body?.numbers) ? req.body.numbers.map(String) : [];
    if (!numbers.length) return res.status(400).json({ error: 'numbers[] is required' });
    const data = await getJson<any>('/lottery/latest');
    const normalized = normalizeLatest(data);
    const results = numbers.map((num) => ({ number: num, matches: checkNumberAgainstPrizes(num, normalized.prizes) }));
    return res.json({ draw: normalized, results });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to check numbers' });
  }
});

export default router;

// -------------------------------
// Additional: Daily News lotto RSS
// -------------------------------
// Endpoint: GET /api/lottery/thai/rss/dailynews
// Returns: { items: Array<{ title, link, pubDate, isoDate, summary }> }
const parser = new Parser({ timeout: 10000 });

router.get('/thai/rss/dailynews', async (_req, res) => {
  const key = cacheKey('dailynews-rss');
  const cached = cache.get<any>(key);
  if (cached) return res.json(cached);

  try {
    const feedUrl = 'https://www.dailynews.co.th/lotto/feed/';
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items || []).map((it) => ({
      title: it.title || '',
      link: it.link || '',
      pubDate: it.pubDate || '',
      isoDate: it.isoDate || '',
      // Some feeds use 'contentSnippet' or 'content', fallback to empty
      summary: (it as any).contentSnippet || (it as any).content || '',
    }));
    const payload = { items };
    cache.set(key, payload, 300);
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to fetch Daily News RSS' });
  }
});
