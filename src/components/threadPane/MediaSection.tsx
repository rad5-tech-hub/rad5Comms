// components/thread-pane/MediaSection.tsx
import { ImageIcon } from 'lucide-react';

const dummyMedia = [
  'https://images.unsplash.com/photo-1557683316-973673baf926',
  'https://images.unsplash.com/photo-1557683311-973673bafafb',
  'https://images.unsplash.com/photo-1557683304-673a25a3a8e8',
  'https://images.unsplash.com/photo-1557683316-973673baf926',
  'https://images.unsplash.com/photo-1557683311-973673bafafb',
  'https://images.unsplash.com/photo-1557683304-673a25a3a8e8',
];

const MediaSection = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Media
        </h4>
        <button className="text-blue hover:underline text-xs">View All</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {dummyMedia.slice(0, 6).map((url, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
            <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaSection;