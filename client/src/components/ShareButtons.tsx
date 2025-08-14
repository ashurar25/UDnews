import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Link as LinkIcon, Facebook, Twitter, MessageSquare } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  summary?: string;
  url?: string; // defaults to current URL
}

export default function ShareButtons({ title, summary, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const tw = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  const line = `https://line.me/R/msg/text/?${encodeURIComponent(`${title} ${shareUrl}`)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
      alert('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: summary, url: shareUrl });
      } catch (e) {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleWebShare} className="gap-2">
        <Share2 className="h-4 w-4" /> แชร์
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="แชร์ Facebook">
          <Facebook className="h-4 w-4" />
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={tw} target="_blank" rel="noopener noreferrer" aria-label="แชร์ Twitter/X">
          <Twitter className="h-4 w-4" />
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={line} target="_blank" rel="noopener noreferrer" aria-label="แชร์ LINE">
          <MessageSquare className="h-4 w-4" />
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
        <LinkIcon className="h-4 w-4" /> {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
      </Button>
    </div>
  );
}
