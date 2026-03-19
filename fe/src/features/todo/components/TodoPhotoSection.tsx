import { useRef } from 'react';
import { Plus, X } from 'lucide-react';

const MAX_PHOTOS = 3;

type Props = {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
};

export default function TodoPhotoSection({ photos, onPhotosChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = () => {
    if (photos.length >= MAX_PHOTOS) return;
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onPhotosChange(
          [...photos, ev.target?.result as string].slice(0, MAX_PHOTOS)
        );
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-[var(--space-3)] w-full">
      <div className="flex justify-between items-center w-full">
        <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
          참고 사진 첨부
        </span>
        <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-light)] font-medium">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-[var(--space-3)] w-full">
        <button
          type="button"
          onClick={handleAddClick}
          disabled={photos.length >= MAX_PHOTOS}
          className="cursor-pointer flex flex-col justify-center items-center h-[var(--size-photo-slot)] w-[var(--size-photo-slot)] rounded-[var(--radius-xs)] border-2 border-dashed border-[var(--color-photo-add-border)] disabled:opacity-40"
        >
          <Plus size={24} color="var(--color-text-light)" strokeWidth={1.7} />
        </button>

        {photos.map((src, i) => (
          <div
            key={i}
            className="relative flex flex-1 h-[var(--size-photo-slot)] rounded-[var(--radius-sm)] justify-center items-center bg-[var(--color-photo-slot-bg)] overflow-hidden"
          >
            <img
              src={src}
              alt={`첨부 사진 ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 bg-[var(--color-overlay)] rounded-full p-[var(--space-0-5)] cursor-pointer"
            >
              <X size={12} color="white" strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
