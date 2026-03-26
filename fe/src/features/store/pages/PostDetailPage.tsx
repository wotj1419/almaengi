import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Avatar from 'boring-avatars';
import { EllipsisVertical, CircleCheckBig, Pencil } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import StoreTabs from '../components/StoreTabs';
import { useBoardStore } from '@/stores/useBoardStore';
import useAuthStore from '@/stores/useAuthStore';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id ?? 0);
  const post = useBoardStore((s) =>
    s.posts.find((p) => p.postId === Number(postId))
  );
  const storeComments = useBoardStore((s) => s.comments[Number(postId)]);
  const comments = storeComments ?? [];
  const addComment = useBoardStore((s) => s.addComment);
  const toggleCheck = useBoardStore((s) => s.toggleCheck);
  const [commentInput, setCommentInput] = useState('');
  const isChecked = post?.checkedUserIds.includes(userId) ?? false;

  if (!post) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-bg-base)]">
        <DetailHeader
          title="게시글"
          onBack={() =>
            navigate(`${ROUTES.STORE_COMMUNITY}?tab=board`, {
              state: location.state,
            })
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[color:var(--color-text-muted)]">
            게시글을 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmitComment = () => {
    const trimmed = commentInput.trim();
    if (!trimmed) return;
    addComment(post.postId, {
      postId: post.postId,
      writerId: userId,
      parentCommentId: null,
      content: trimmed,
      writerName: '사장님',
      writerPosition: '사장',
    });
    setCommentInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="매장 커뮤니티"
        onBack={() =>
          navigate(`${ROUTES.STORE_COMMUNITY}?tab=board`, {
            state: location.state,
          })
        }
        rightIcon={
          <Pencil size={20} color="var(--color-text-primary)" strokeWidth={2} />
        }
        onRightClick={() =>
          navigate(ROUTES.STORE_BOARD_NEW, { state: location.state })
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

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[var(--color-bg-white)] mx-[var(--space-5)] mt-[var(--space-4)] rounded-[var(--radius-lg)] p-[var(--space-7)] mb-[var(--space-5)]">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-[var(--space-4)]">
            <div className="shrink-0 w-[44px] h-[44px] rounded-full overflow-hidden">
              <Avatar size={44} name={post.writerName} variant="beam" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[var(--space-2)]">
                <span className="text-[length:var(--text-ml)] font-bold text-[color:var(--color-text-primary)]">
                  {post.writerName}
                </span>
                <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">
                  {post.writerPosition}
                </span>
              </div>
              <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-light)] mt-[1px]">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
            <button className="shrink-0 cursor-pointer">
              <EllipsisVertical size={20} color="var(--color-text-muted)" />
            </button>
          </div>

          {/* 제목 */}
          <h2 className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-text-primary)] mt-[var(--space-7)]">
            {post.title}
          </h2>

          {/* 내용 */}
          <p className="text-[length:var(--text-base)] text-[color:var(--color-text-muted)] mt-[var(--space-4)] leading-[1.6] whitespace-pre-wrap">
            {post.content}
          </p>

          {/* 이미지 */}
          {post.images.length > 0 && (
            <div className="mt-[var(--space-5)] flex flex-col gap-[var(--space-3)]">
              {post.images.map((img) => (
                <img
                  key={img.imageId}
                  src={img.imageUrl}
                  alt=""
                  className="w-full rounded-[var(--radius-md)] object-cover"
                />
              ))}
            </div>
          )}

          {/* 확인 버튼 */}
          <div className="flex items-center justify-end gap-[var(--space-1-5)] mt-[var(--space-5)]">
            <button
              onClick={() => toggleCheck(post.postId, userId)}
              className="flex items-center gap-[var(--space-1-5)] cursor-pointer"
            >
              <CircleCheckBig
                size={16}
                color="var(--color-text-primary)"
                fill="var(--color-primary)"
                strokeWidth={2}
              />
              <span
                className={`text-[length:var(--text-sm)] font-bold ${isChecked ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-light)]'}`}
              >
                {post.checkCount}
              </span>
            </button>
          </div>
        </div>

        {/* 댓글 목록 */}
        {comments.length > 0 && (
          <div className="bg-[var(--color-bg-white)] mx-[var(--space-5)] mt-[var(--space-3)] mb-[var(--space-5)] rounded-[var(--radius-lg)] px-[var(--space-7)] pt-[var(--space-5)] pb-[var(--space-7)]">
            {comments.map((c, i) => (
              <div key={c.commentId}>
                {i > 0 && (
                  <div className="border-t border-[var(--color-border-light)] my-[var(--space-5)]" />
                )}
                <div className="flex items-center gap-[var(--space-3)]">
                  <div className="shrink-0 w-[32px] h-[32px] rounded-full overflow-hidden">
                    <Avatar size={32} name={c.writerName} variant="beam" />
                  </div>
                  <span className="text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)]">
                    {c.writerName}
                  </span>
                  <span className="text-[length:var(--text-xs)] text-[color:var(--color-text-light)]">
                    {c.writerPosition}
                  </span>
                  <span className="ml-auto text-[length:var(--text-xs)] text-[color:var(--color-text-light)]">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-[length:var(--text-base)] text-[color:var(--color-text-primary)] mt-[var(--space-2)] ml-[44px]">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 댓글 입력 */}
      <div
        className="bg-[var(--color-bg-white)] border-t border-[var(--color-border-light)] flex items-center gap-[var(--space-3)] px-[var(--space-5)]"
        style={{
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          paddingTop: '12px',
        }}
      >
        <div className="flex-1 flex items-center bg-[var(--color-bg-surface)] rounded-[var(--radius-xl)] pl-[var(--space-5)] pr-[4px] py-[4px]">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            placeholder="댓글을 입력하세요"
            className="flex-1 bg-transparent text-[length:var(--text-base)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-placeholder)] outline-none"
          />
          <button
            onClick={handleSubmitComment}
            className="shrink-0 px-[var(--space-7)] py-[var(--space-2)] rounded-full bg-[var(--color-primary)] text-[length:var(--text-base)] font-bold text-[color:var(--color-text-primary)] cursor-pointer"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
