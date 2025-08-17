import axios from 'axios';
import NodeCache from 'node-cache';
import { parse } from 'node-html-parser';

// Cache results for 15 minutes
const cache = new NodeCache({ stdTTL: 60 * 15 });

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

export async function getLatestLotteryResults(): Promise<LotteryResults> {
  const cached = cache.get<LotteryResults>('lottery_latest');
  if (cached) return cached;

  // Fetch the GLO home page
  const res = await axios.get(SOURCE_URL, { timeout: 15000, responseType: 'text' });
  const html = res.data as string;

  const root = parse(html);

  // The exact DOM structure can change. We'll try to locate blocks by Thai labels.
  // Extract helper: find numbers near a label
  const textContent = root.text.replace(/\s+/g, ' ').trim();

  // Simple regex-based extraction as a resilient baseline
  const findAll = (re: RegExp) => {
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(textContent)) !== null) {
      out.push(m[1]);
      if (out.length > 1000) break;
    }
    return out;
  };

  // Try to infer date in format 16 สิงหาคม 2568 หรือ DD/MM/YYYY
  const dateMatch = textContent.match(/งวดวันที่\s*([0-9]{1,2}[^0-9]{1,10}[0-9]{4})/);

  // First prize: 6 digits
  const firstPrizeMatch = textContent.match(/รางวัลที่\s*1[^0-9]*([0-9]{6})/);

  // Near first prize: two 6-digit numbers often appear after label
  const nearFirst = findAll(/รางวัลข้างเคียงรางวัลที่\s*1[^0-9]*([0-9]{6})/g);

  // Front 3 digits: two 3-digit numbers
  const front3 = findAll(/เลขหน้า\s*3\s*ตัว[^0-9]*([0-9]{3})/g);

  // Last 3 digits: two 3-digit numbers
  const last3 = findAll(/เลขท้าย\s*3\s*ตัว[^0-9]*([0-9]{3})/g);

  // Last 2 digits: one 2-digit number
  const last2Match = textContent.match(/เลขท้าย\s*2\s*ตัว[^0-9]*([0-9]{2})/);

  // Prize 2: five 6-digit numbers typically
  const prize2 = findAll(/รางวัลที่\s*2[^0-9]*([0-9]{6})/g).slice(0, 5);
  const prize3 = findAll(/รางวัลที่\s*3[^0-9]*([0-9]{6})/g).slice(0, 10);
  const prize4 = findAll(/รางวัลที่\s*4[^0-9]*([0-9]{6})/g).slice(0, 50);
  const prize5 = findAll(/รางวัลที่\s*5[^0-9]*([0-9]{6})/g).slice(0, 100);

  const payload: LotteryResults = {
    date: dateMatch?.[1],
    firstPrize: firstPrizeMatch?.[1],
    nearFirstPrize: nearFirst.length ? nearFirst.slice(0, 2) : undefined,
    front3: front3.slice(0, 2),
    last3: last3.slice(0, 2),
    last2: last2Match?.[1],
    prize2: prize2.length ? prize2 : undefined,
    prize3: prize3.length ? prize3 : undefined,
    prize4: prize4.length ? prize4 : undefined,
    prize5: prize5.length ? prize5 : undefined,
    source: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
  };

  cache.set('lottery_latest', payload);
  return payload;
}
