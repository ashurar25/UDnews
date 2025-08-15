import { db } from './db';
import { newsArticles } from '@shared/schema';
import { and, gte, lte, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
// __dirname is not available in ESM; derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, 'data', 'daily-summaries.json');

export interface DailySummaryData {
  date: string; // YYYY-MM-DD
  bullets: string[];
  highlights: string[];
  topLinks: Array<{ id: number; title: string; url: string }>;
  generatedAt: string;
}

function ensureCacheFile() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf8');
}

function readCache(): Record<string, DailySummaryData> {
  try {
    ensureCacheFile();
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, DailySummaryData>) {
  ensureCacheFile();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function getCachedDailySummary(date: string): Promise<DailySummaryData | null> {
  const cache = readCache();
  return cache[date] || null;
}

export async function saveDailySummary(date: string, data: DailySummaryData) {
  const cache = readCache();
  cache[date] = data;
  writeCache(cache);
}

function toDateRange(dateStr: string) {
  const start = new Date(dateStr + 'T00:00:00+07:00'); // Asia/Bangkok
  const end = new Date(dateStr + 'T23:59:59.999+07:00');
  return { start, end };
}

async function fetchDailyArticles(dateStr: string) {
  const { start, end } = toDateRange(dateStr);
  const items = await db
    .select()
    .from(newsArticles)
    .where(and(gte(newsArticles.createdAt, start), lte(newsArticles.createdAt, end)))
    .orderBy(desc(newsArticles.createdAt))
    .limit(50 as any);
  return items as any[];
}

function buildPromptTH(articles: any[], dateStr: string) {
  const items = articles
    .map((a, i) => `- (${i + 1}) ${a.title}${a.summary ? `\nสรุปสั้น: ${a.summary}` : ''}`)
    .join('\n');
  return `วันนี้คือวันที่ ${dateStr} กรุณาสรุปข่าวประจำวันภาษาไทยให้กระชับและอ่านง่าย โดยอิงจากหัวข้อและย่อหน้าสั้นด้านล่างนี้:\n\n${items}\n\nรูปแบบผลลัพธ์ (JSON):\n{\n  "bullets": ["bullet สั้นๆ 5-7 ข้อ"],\n  "highlights": ["ประเด็นสำคัญ 3-5 ข้อ"],\n  "topLinks": [\n    {"title": "หัวข้อข่าวเด่น", "url": "ลิงก์ข่าว"}\n  ]\n}\nข้อกำหนด:\n- เขียนภาษาไทยล้วน\n- กระชับ ชัดเจน ใช้ภาษาข่าวมืออาชีพ\n- เลือกลิงก์ข่าวจากรายการที่ส่งมา (ถ้าระบบมี url)\n- ถ้าไม่มี url ให้ปล่อยเป็นค่าว่าง`;
}

async function callOpenAI(prompt: string) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${t}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return content;
}

export async function generateDailySummary(dateStr: string): Promise<DailySummaryData> {
  const articles = await fetchDailyArticles(dateStr);
  const prompt = buildPromptTH(articles, dateStr);
  const raw = await callOpenAI(prompt);
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try to extract JSON block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  }
  if (!parsed || !Array.isArray(parsed.bullets)) {
    parsed = { bullets: [], highlights: [], topLinks: [] };
  }

  // Map topLinks with our best-known URLs if present
  const topLinks = (parsed.topLinks || []).map((x: any) => ({
    title: String(x.title || ''),
    url: String(x.url || ''),
  }));

  const result: DailySummaryData = {
    date: dateStr,
    bullets: parsed.bullets || [],
    highlights: parsed.highlights || [],
    topLinks,
    generatedAt: new Date().toISOString(),
  };
  await saveDailySummary(dateStr, result);
  return result;
}
