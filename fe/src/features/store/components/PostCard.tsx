import { CircleCheckBig } from 'lucide-react';
import type { Post } from '../types/board';
import { formatRelativeTime } from '../utils/formatRelativeTime';

type Props = {
  post: Post;
  onClick: () => void;
};

export default function PostCard({ post, onClick }: Props) {
  const thumbnail = post.images[0]?.imageUrl;

  return (
    <button
      className="w-full text-left bg-[var(--color-bg-white)] rounded-[var(--radius-lg)] px-[var(--space-7)] py-[var(--space-7)] cursor-pointer"
      onClick={onClick}
    >
      {/* 상단: 카테고리 + 날짜 */}
      <div className="flex items-center justify-between mb-[var(--space-3)]">
        <span
          className={`text-[length:var(--text-xs)] font-bold px-[var(--space-3)] py-[2px] rounded-full ${
            post.boardType === 'NOTICE'
              ? 'bg-red-100 text-red-500'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {post.boardType === 'NOTICE' ? '중요' : '일반'}
        </span>
        <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-light)]">
          {formatRelativeTime(post.createdAt)}
        </span>
      </div>

      {/* 중앙: 썸네일 + 제목/내용 */}
      <div className="flex gap-[var(--space-5)] min-h-[70px]">
        {thumbnail && (
          <div className="shrink-0 w-[80px] h-[75px] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-bg-surface)]">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)] truncate">
            {post.title}
          </h3>
          <p className="text-[length:var(--text-base)] text-[color:var(--color-text-muted)] line-clamp-1 mt-[2px] leading-[1.4]">
            {post.content}
          </p>
        </div>
      </div>

      {/* 하단: 매장 | 작성자 + 확인 수 */}
      <div className="flex items-center justify-between mt-[var(--space-4)]">
        <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-light)]">
          {post.storeName} | {post.writerName}
        </span>
        <div className="flex items-center gap-[var(--space-1-5)]">
          <CircleCheckBig
            size={16}
            color="var(--color-text-primary)"
            fill="var(--color-primary)"
            strokeWidth={2}
          />
          <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-text-primary)]">
            {post.checkCount}
          </span>
        </div>
      </div>
    </button>
  );
}
