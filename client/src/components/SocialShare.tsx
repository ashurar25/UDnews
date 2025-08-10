import { Button } from "@/components/ui/button";
import { Share2, Copy, Facebook, Twitter, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  url: string;
  description?: string;
}

const SocialShare = ({ title, url, description }: SocialShareProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareData = {
    title,
    text: description || title,
    url: url,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "คัดลอกลิงก์แล้ว",
        description: "ลิงก์ถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareToFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const tweetText = `${title} ${url}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(lineUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`ข่าว: ${title}`);
    const body = encodeURIComponent(`ฉันคิดว่าคุณอาจสนใจข่าวนี้:\n\n${title}\n\n${description || ''}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        แชร์
      </Button>

      {isOpen && !navigator.share && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 z-50 min-w-48">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={shareToFacebook}
              className="justify-start gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              Facebook
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={shareToLine}
              className="justify-start gap-2 text-green-500 hover:text-green-600 hover:bg-green-50"
            >
              <MessageCircle className="h-4 w-4" />
              LINE
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={shareToTwitter}
              className="justify-start gap-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={shareByEmail}
              className="justify-start gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" />
              อีเมล
            </Button>

            <hr className="my-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="justify-start gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              คัดลอกลิงก์
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop to close the menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SocialShare;