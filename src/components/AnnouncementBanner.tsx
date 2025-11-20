import { X } from "lucide-react";
import { useState } from "react";

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-brand-blue to-primary text-white py-2 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
        <span>🎉</span>
        <p>Yeni kullanıcılara özel %10 indirim! İlk ilanınızda geçerli.</p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
