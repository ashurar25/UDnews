import axios from 'axios';
import NodeCache from 'node-cache';
import { parse } from 'node-html-parser';

// Cache results for 15 minutes
const cache = new NodeCache({ stdTTL: 60 * 15 });
const CACHE_KEY = 'lottery_latest_v2';

export type LotteryResults = {
  date?: string;
  firstPrize?: string;
  nearFirstPrize?: string[];
  front3?: string[];
  last3?: string[];
  last2?: string;
  prize2?: string[];
  prize3?: string[];
  prize4?: string[];
  prize5?: string[];
  source: string;
  fetchedAt: string;
};

const SOURCE_URL = 'https://www.glo.or.th/home-page';
const FALLBACK_URL = 'https://www.lottery.co.th/show';

function normalizeText(html: string) {
  try {
    const root = parse(html);
    return root.text.replace(/\s+/g, ' ').trim();
  } catch {
    return (html || '').replace(/\s+/g, ' ').trim();
  }
}

function extractFromText(textContent: string) {
  const findAll = (re: RegExp) => {
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(textContent)) !== null) {
      out.push(m[1]);
      if (out.length > 1000) break;
    }
    return out;
  };

  // Date patterns commonly found
  const dateMatch = textContent.match(/งวดวันที่\s*([0-9]{1,2}[^0-9]{1,10}[0-9]{4})/)
    || textContent.match(/ผลสลากกินแบ่งรัฐบาล\s*งวดวันที่\s*([^\n]+?)\s*(?:รางวัลที่|เลขท้าย|เลขหน้า)/);

  const firstPrizeMatch = textContent.match(/รางวัลที่\s*1[^0-9]*([0-9]{6})/)
    || textContent.match(/รางวัลที่หนึ่ง[^0-9]*([0-9]{6})/);

  const nearFirst = findAll(/รางวัลข้างเคียงรางวัลที่\s*1[^0-9]*([0-9]{6})/g)
    .concat(findAll(/เลขข้างเคียงรางวัลที่หนึ่ง[^0-9]*([0-9]{6})/g)).slice(0, 2);

  const front3 = findAll(/เลขหน้า\s*3\s*ตัว[^0-9]*([0-9]{3})/g)
    .concat(findAll(/เลขหน้า\s*สาม\s*ตัว[^0-9]*([0-9]{3})/g)).slice(0, 2);

  const last3 = findAll(/เลขท้าย\s*3\s*ตัว[^0-9]*([0-9]{3})/g)
    .concat(findAll(/เลขท้าย\s*สาม\s*ตัว[^0-9]*([0-9]{3})/g)).slice(0, 2);

  const last2Match = textContent.match(/เลขท้าย\s*2\s*ตัว[^0-9]*([0-9]{2})/)
    || textContent.match(/เลขท้าย\s*สอง\s*ตัว[^0-9]*([0-9]{2})/);

  const prize2 = findAll(/รางวัลที่\s*2[^0-9]*([0-9]{6})/g).slice(0, 5);
  const prize3 = findAll(/รางวัลที่\s*3[^0-9]*([0-9]{6})/g).slice(0, 10);
  const prize4 = findAll(/รางวัลที่\s*4[^0-9]*([0-9]{6})/g).slice(0, 50);
  const prize5 = findAll(/รางวัลที่\s*5[^0-9]*([0-9]{6})/g).slice(0, 100);

  return {
    date: dateMatch?.[1],
    firstPrize: firstPrizeMatch?.[1],
    nearFirstPrize: nearFirst.length ? nearFirst : undefined,
    front3: front3.length ? front3 : [],
    last3: last3.length ? last3 : [],
    last2: last2Match?.[1],
    prize2: prize2.length ? prize2 : undefined,
    prize3: prize3.length ? prize3 : undefined,
    prize4: prize4.length ? prize4 : undefined,
    prize5: prize5.length ? prize5 : undefined,
  } as Partial<LotteryResults>;
}

function isIncomplete(p: Partial<LotteryResults>) {
  return !(p.firstPrize && (p.front3?.length || 0) > 0 && (p.last3?.length || 0) > 0 && p.last2);
}

export async function getLatestLotteryResults(): Promise<LotteryResults> {
  const cached = cache.get<LotteryResults>(CACHE_KEY);
  if (cached) return cached;

  // Fetch the GLO home page
  const res = await axios.get(SOURCE_URL, { timeout: 15000, responseType: 'text' });
  const html = res.data as string;
  const textContent = normalizeText(html);

  const primary = extractFromText(textContent);

  let payload: LotteryResults = {
    date: primary.date,
    firstPrize: primary.firstPrize,
    nearFirstPrize: primary.nearFirstPrize,
    front3: primary.front3 || [],
    last3: primary.last3 || [],
    last2: primary.last2,
    prize2: primary.prize2,
    prize3: primary.prize3,
    prize4: primary.prize4,
    prize5: primary.prize5,
    source: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
  };

  // If incomplete, try fallback source
  if (isIncomplete(payload)) {
    try {
      const res2 = await axios.get(FALLBACK_URL, { timeout: 15000, responseType: 'text' });
      const text2 = normalizeText(res2.data as string);
      const fb = extractFromText(text2);
      const merged: LotteryResults = {
        date: payload.date || fb.date,
        firstPrize: payload.firstPrize || fb.firstPrize,
        nearFirstPrize: (payload.nearFirstPrize && payload.nearFirstPrize.length ? payload.nearFirstPrize : fb.nearFirstPrize),
        front3: (payload.front3 && payload.front3.length ? payload.front3 : (fb.front3 || [])),
        last3: (payload.last3 && payload.last3.length ? payload.last3 : (fb.last3 || [])),
        last2: payload.last2 || fb.last2,
        prize2: payload.prize2 || fb.prize2,
        prize3: payload.prize3 || fb.prize3,
        prize4: payload.prize4 || fb.prize4,
        prize5: payload.prize5 || fb.prize5,
        source: FALLBACK_URL,
        fetchedAt: new Date().toISOString(),
      };
      payload = merged;
    } catch {
      // swallow; keep primary even if incomplete
    }
  }

  // Cache only when payload is complete
  if (!isIncomplete(payload)) {
    cache.set(CACHE_KEY, payload);
  }
  return payload;
}
