import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { useTrackEvent } from '@/lib/useTrackEvent';

interface TTSReaderProps {
  title?: string;
  summary?: string;
  htmlContent?: string; // HTML string
  newsId?: number;
}

function stripHtml(html?: string): string {
  if (!html) return '';
  // Replace <br> with newlines, remove tags, collapse spaces
  return html
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TTSReader: React.FC<TTSReaderProps> = ({ title, summary, htmlContent, newsId }) => {
  const { track } = useTrackEvent();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [readScope, setReadScope] = useState<'summary' | 'full'>('full');
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Detect small screens (mobile) once on mount
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 640px)').matches; // tailwind 'sm'
  }, []);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const textToRead = useMemo(() => {
    const parts =
      readScope === 'summary'
        ? [title, summary]
        : [title, summary, stripHtml(htmlContent)];
    let text = (parts.filter(Boolean) as string[]).join('\n\n');
    // Limit overly long reads on mobile to improve UX
    if (isMobile && readScope === 'full') {
      const MAX_CHARS_MOBILE = 2000; // ~few minutes of audio
      if (text.length > MAX_CHARS_MOBILE) {
        text = text.slice(0, MAX_CHARS_MOBILE).trimEnd() + '...';
      }
    }
    return text;
  }, [title, summary, htmlContent, readScope, isMobile]);

  // Load voices (some browsers load async)
  useEffect(() => {
    const synth = window.speechSynthesis;
    const load = () => {
      const v = synth.getVoices();
      setVoices(v);
      // Load preferred voice from localStorage if available
      const savedVoice = localStorage.getItem('tts.voice');
      const thaiVoices = v.filter(
        (voice) => voice.lang?.toLowerCase().startsWith('th') || /thai/i.test(voice.name)
      );
      if (savedVoice && v.find((voice) => voice.name === savedVoice)) {
        setSelectedVoice(savedVoice);
      } else if (thaiVoices[0]) {
        // Prefer Thai voice if available
        setSelectedVoice(thaiVoices[0].name);
      } else if (v[0]) {
        // Fallback to the first available voice
        setSelectedVoice(v[0].name);
      }
    };
    load();
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Load other preferences on mount
  useEffect(() => {
    const savedRate = localStorage.getItem('tts.rate');
    if (savedRate) {
      const num = Number(savedRate);
      if (!Number.isNaN(num)) setRate(num);
    }
    const savedScope = localStorage.getItem('tts.scope') as 'summary' | 'full' | null;
    if (savedScope === 'summary' || savedScope === 'full') {
      setReadScope(savedScope);
    } else if (isMobile) {
      // Default to summary on small screens when no prior preference
      setReadScope('summary');
    }
  }, [isMobile]);

  // Persist preferences when changed
  useEffect(() => {
    if (selectedVoice) localStorage.setItem('tts.voice', selectedVoice);
  }, [selectedVoice]);
  useEffect(() => {
    localStorage.setItem('tts.rate', String(rate));
  }, [rate]);
  useEffect(() => {
    localStorage.setItem('tts.scope', readScope);
  }, [readScope]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    utteranceRef.current = null;
    track('tts.stop', { newsId, scope: readScope, rate, voice: selectedVoice });
  };

  const startSpeaking = () => {
    if (!textToRead) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = rate; // 0.1 to 10
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    // If the selected voice is not Thai but Thai is desired, force lang to th-TH as a hint for engines
    const isThaiSelected = voice?.lang?.toLowerCase().startsWith('th') || /thai/i.test(voice?.name ?? '');
    utterance.lang = isThaiSelected ? (voice?.lang ?? 'th-TH') : (voice?.lang || 'th-TH');

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      utteranceRef.current = null;
      track('tts.end', { newsId, scope: readScope, rate, voice: selectedVoice });
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
      utteranceRef.current = null;
      track('tts.error', { newsId });
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    track('tts.play', { newsId, scope: readScope, rate, voice: selectedVoice }, { cooldownMs: 10_000 });
  };

  const togglePause = () => {
    if (!speaking) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      track('tts.resume', { newsId });
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
      track('tts.pause', { newsId });
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3 max-h-[70vh] overflow-y-auto sm:max-h-none sm:overflow-visible">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <div className="font-kanit font-semibold">ฟังข่าวนี้</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!speaking ? (
            <Button onClick={startSpeaking} className="gap-2" aria-label="เริ่มอ่านข่าว" title="เริ่มอ่านข่าว">
              <Play className="h-4 w-4" /> เล่น
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={togglePause} className="gap-2" aria-label={paused ? 'เล่นต่อ' : 'พักชั่วคราว'} title={paused ? 'เล่นต่อ' : 'พัก'}>
                <Pause className="h-4 w-4" /> {paused ? 'เล่นต่อ' : 'พัก'}
              </Button>
              <Button variant="destructive" onClick={stopSpeaking} className="gap-2" aria-label="หยุดอ่าน" title="หยุดอ่าน">
                <Square className="h-4 w-4" /> หยุด
              </Button>
            </>
          )}

          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setShowAdvanced((s) => !s)}
              aria-expanded={showAdvanced}
              aria-controls="tts-advanced"
            >
              {showAdvanced ? 'ซ่อนการตั้งค่า' : 'ตั้งค่าเพิ่มเติม'}
            </Button>
          )}
        </div>

        {/* Advanced controls */}
        <div
          id="tts-advanced"
          className={`${isMobile ? (showAdvanced ? 'block' : 'hidden') : 'block'} border-t pt-3 mt-2`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="voice" className="font-sarabun text-sm">เสียง</Label>
            <select
              id="voice"
              className="border rounded px-2 py-1 text-sm font-sarabun max-w-[60vw] sm:max-w-none"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              aria-label="เลือกเสียง"
            >
              {[
                // Show Thai voices first
                ...voices.filter((v) => v.lang?.toLowerCase().startsWith('th') || /thai/i.test(v.name)),
                // Then the rest (non-Thai)
                ...voices.filter((v) => !(v.lang?.toLowerCase().startsWith('th') || /thai/i.test(v.name)))
              ].map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>

            <Label htmlFor="scope" className="font-sarabun text-sm ml-2">ขอบเขต</Label>
            <select
              id="scope"
              className="border rounded px-2 py-1 text-sm font-sarabun"
              value={readScope}
              onChange={(e) => setReadScope(e.target.value as 'summary' | 'full')}
              aria-label="เลือกขอบเขตการอ่าน"
              title={readScope === 'summary' ? 'อ่านเฉพาะสรุป' : 'อ่านทั้งบทความ'}
            >
              <option value="summary">เฉพาะสรุป</option>
              <option value="full">ทั้งบทความ</option>
            </select>

            <Label htmlFor="rate" className="font-sarabun text-sm">ความเร็ว</Label>
            <input
              id="rate"
              type="range"
              min={0.75}
              max={1.25}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="accent-primary"
              aria-label="ปรับความเร็วเสียง"
              title={`ความเร็ว: ${rate.toFixed(2)}x`}
            />
            <span className="text-xs text-muted-foreground w-10">{rate.toFixed(2)}x</span>
          </div>

          {/* Notice when Thai voice is unavailable */}
          {voices.length > 0 && !voices.some((v) => v.lang?.toLowerCase().startsWith('th') || /thai/i.test(v.name)) && (
            <div className="w-full mt-2 text-xs text-muted-foreground font-sarabun bg-muted/40 border rounded p-2">
              ไม่พบเสียงภาษาไทยในเบราว์เซอร์ของคุณ จึงอาจอ่านเป็นสำเนียงภาษาอื่น
              <br />
              วิธีแก้แนะนำ:
              <ul className="list-disc ml-5 mt-1">
                <li><b>Windows (Edge/Chrome):</b> Settings → Time & Language → Language & region → Add language → เพิ่ม "Thai" และ <b>Speech</b> แล้วรีสตาร์ทเบราว์เซอร์</li>
                <li><b>macOS (Safari/Chrome):</b> System Settings → Accessibility → Spoken Content → System Voice → <b>Manage Voices…</b> → ดาวน์โหลดภาษาไทย</li>
                <li>หากยังไม่มีเสียงไทย ลองอัปเดตเบราว์เซอร์หรือใช้ Edge/Chrome บนอุปกรณ์ที่มีแพ็กเสียงไทย</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TTSReader;
