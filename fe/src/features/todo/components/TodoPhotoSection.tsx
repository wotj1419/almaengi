import { useRef } from 'react';
import { Plus, X } from 'lucide-react';
import type { TaskImage } from '@/features/todo/types';

const MAX_PHOTOS = 3;

type Props = {
  images: TaskImage[];
  onImagesChange: (images: TaskImage[]) => void;
};

export default function TodoPhotoSection({ images, onImagesChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = () => {
    if (images.length >= MAX_PHOTOS) return;
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - images.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newImage: TaskImage = {
          image_id: Date.now(),
          task_id: 0,
          image_url: ev.target?.result as string,
          origin_name: file.name,
          name: file.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onImagesChange([...images, newImage].slice(0, MAX_PHOTOS));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemove = (image_id: number) => {
    onImagesChange(images.filter((img) => img.image_id !== image_id));
  };

  return (
    <div className="flex flex-col gap-[var(--space-3)] w-full">
      <div className="flex justify-between items-center w-full">
        <span className="text-[length:var(--text-md)] text-[color:var(--color-text-primary)] font-bold leading-5">
          참고 사진 첨부
        </span>
        <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-light)] font-medium">
          {images.length}/{MAX_PHOTOS}
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
          disabled={images.length >= MAX_PHOTOS}
          className="cursor-pointer flex flex-col justify-center items-center h-[var(--size-photo-slot)] w-[var(--size-photo-slot)] rounded-[var(--radius-xs)] border-2 border-dashed border-[var(--color-photo-add-border)] disabled:opacity-40"
        >
          <Plus size={24} color="var(--color-text-light)" strokeWidth={1.7} />
        </button>

        {images.map((img) => (
          <div
            key={img.image_id}
            className="relative flex flex-1 h-[var(--size-photo-slot)] rounded-[var(--radius-sm)] justify-center items-center bg-[var(--color-photo-slot-bg)] overflow-hidden"
          >
            <img
              src={img.image_url}
              alt={img.origin_name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(img.image_id)}
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
