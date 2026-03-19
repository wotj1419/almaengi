import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import StoreTabs from '../components/StoreTabs';
import { useBoardStore } from '@/stores/useBoardStore';
import { CURRENT_USER_ID } from '@/stores/useChatStore';

const MAX_CONTENT_LENGTH = 1000;
const MAX_FILES = 10;

export default function NewPostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addPost = useBoardStore((s) => s.addPost);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [imageFiles, setImageFiles] = useState<{ url: string; name: string }[]>(
    []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  // 등록하지 않고 페이지를 떠날 때만 blob URL 해제
  useEffect(() => {
    return () => {
      if (!submittedRef.current) {
        imageFiles.forEach((f) => URL.revokeObjectURL(f.url));
      }
    };
  }, [imageFiles]);

  const handleAddImage = () => {
    if (imageFiles.length >= MAX_FILES) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_FILES - imageFiles.length;
    const selected = Array.from(files).slice(0, remaining);
    const items = selected.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImageFiles((prev) => [...prev, ...items]);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    const now = new Date().toISOString();
    addPost({
      boardId: isPinned ? 1 : 2,
      writerId: CURRENT_USER_ID,
      title: title.trim(),
      content: content.trim(),
      writerName: '사장님',
      writerPosition: '사장',
      storeName: '부산갈맹이 싸피점',
      boardType: isPinned ? 'NOTICE' : 'NORMAL',
      images: imageFiles.map((file, i) => ({
        imageId: Date.now() + i,
        postId: 0,
        imageUrl: file.url,
        originName: file.name,
        name: file.name,
        createdAt: now,
        updatedAt: now,
      })),
    });

    submittedRef.current = true;
    navigate(ROUTES.STORE_COMMUNITY, { state: location.state });
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="새 글 등록"
        onBack={() =>
          navigate(`${ROUTES.STORE_COMMUNITY}?tab=board`, {
            state: location.state,
          })
        }
      />

      <StoreTabs
        activeTab="게시판"
        onTabChange={() =>
          navigate(`${ROUTES.STORE_COMMUNITY}?tab=chat`, {
            state: location.state,
          })
        }
      />

      {/* 폼 */}
      <main className="flex-1 overflow-y-auto flex flex-col px-[var(--space-5)] pt-[var(--space-4)] pb-[var(--space-6)]">
        <div className="flex-1 flex flex-col bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] p-[var(--space-7)]">
          {/* 제목 */}
          <label className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력해 주세요."
            className="w-full mt-[var(--space-3)] px-[var(--space-5)] py-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] text-[length:var(--text-base)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-placeholder)] outline-none"
          />

          {/* 내용 */}
          <div className="flex items-center justify-between mt-[var(--space-7)]">
            <label className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
              내용
            </label>
            <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-light)]">
              {content.length}/{MAX_CONTENT_LENGTH}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CONTENT_LENGTH) {
                setContent(e.target.value);
              }
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="전달사항을 기재해 주세요"
            rows={6}
            className="w-full mt-[var(--space-3)] px-[var(--space-5)] py-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-bg-white)] text-[length:var(--text-base)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-placeholder)] outline-none resize-none leading-[1.5] overflow-hidden"
          />

          {/* 파일 첨부 */}
          <div className="flex items-center justify-between mt-[var(--space-7)]">
            <label className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
              파일 첨부
            </label>
            <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-light)]">
              {imageFiles.length}/{MAX_FILES}
            </span>
          </div>
          <div className="flex flex-wrap gap-[var(--space-3)] mt-[var(--space-3)]">
            {imageFiles.map((file, i) => (
              <div
                key={i}
                className="relative w-[72px] h-[72px] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-surface)]"
              >
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-[2px] right-[2px] w-[18px] h-[18px] rounded-full bg-black/50 text-white text-[length:11px] flex items-center justify-center cursor-pointer"
                >
                  x
                </button>
              </div>
            ))}
            {imageFiles.length < MAX_FILES && (
              <button
                onClick={handleAddImage}
                className="w-[72px] h-[72px] rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border-light)] flex items-center justify-center cursor-pointer bg-transparent"
              >
                <Plus
                  size={24}
                  color="var(--color-text-light)"
                  strokeWidth={1.5}
                />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 구분선 + 고정 토글을 하단에 고정 */}
          <div className="mt-auto pt-[20px]">
            <div className="border-t border-[var(--color-border-light)]" />
            <div className="flex items-center justify-between mt-[var(--space-5)]">
              <span className="text-[length:var(--text-base)] text-[color:var(--color-text-primary)]">
                공지로 상단 고정하기
              </span>
              <button
                onClick={() => setIsPinned((v) => !v)}
                className={`w-[48px] h-[26px] rounded-full relative transition-colors cursor-pointer ${
                  isPinned ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow transition-transform ${
                    isPinned ? 'translate-x-[0px]' : 'translate-x-[-21px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 등록 버튼 */}
      <div className="px-[var(--space-5)] pb-[var(--space-6)]">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim()}
          className="w-full py-[var(--space-5)] rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[length:var(--text-lg)] font-bold text-[color:var(--color-text-primary)] cursor-pointer flex items-center justify-center gap-[var(--space-2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} strokeWidth={2.5} />글 등록
        </button>
      </div>
    </div>
  );
}
