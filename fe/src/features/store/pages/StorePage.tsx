import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import { MessageSquarePlus, Pencil } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import useAuthStore from '@/stores/useAuthStore';
import ChatRoomCard from '../components/ChatRoomCard';
import PostCard from '../components/PostCard';
import StoreTabs, { type Tab } from '../components/StoreTabs';
import { useChatStore } from '@/stores/useChatStore';
import { useBoardStore } from '@/stores/useBoardStore';

export default function StorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeTab: Tab =
    searchParams.get('tab') === 'chat' ? '채팅방' : '게시판';
  const setActiveTab = (tab: Tab) =>
    navigate(
      `${ROUTES.STORE_COMMUNITY}?tab=${tab === '채팅방' ? 'chat' : 'board'}`,
      { replace: true, state: location.state }
    );
  const storeId = useAuthStore((s) => s.activeStoreId);
  const rooms = useChatStore((s) => s.rooms);
  const fetchRooms = useChatStore((s) => s.fetchRooms);
  const posts = useBoardStore((s) => s.posts);

  // 채팅방 목록 불러오기
  useEffect(() => {
    if (storeId) fetchRooms(storeId);
  }, [storeId, fetchRooms]);

  // NOTICE(공지) 게시글 상단 고정, 나머지는 최신순
  const sortedPosts = [...posts]
    .filter((p) => !p.isDeleted)
    .sort((a, b) => {
      if (a.boardType === 'NOTICE' && b.boardType !== 'NOTICE') return -1;
      if (a.boardType !== 'NOTICE' && b.boardType === 'NOTICE') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 알맹이 챗봇 최상단 고정, 나머지는 최신 메시지 순 (내림차순)
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.roomType === 'BOT') return -1;
    if (b.roomType === 'BOT') return 1;
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="매장 커뮤니티"
        onBack={() =>
          location.state?.from === 'home'
            ? navigate(ROUTES.HOME)
            : navigate(ROUTES.STORE)
        }
        rightIcon={
          activeTab === '채팅방' ? (
            <MessageSquarePlus
              size={20}
              color="var(--color-text-primary)"
              strokeWidth={2}
            />
          ) : (
            <Pencil
              size={20}
              color="var(--color-text-primary)"
              strokeWidth={2}
            />
          )
        }
        onRightClick={
          activeTab === '채팅방'
            ? () => navigate(ROUTES.STORE_CHAT_NEW, { state: location.state })
            : () => navigate(ROUTES.STORE_BOARD_NEW, { state: location.state })
        }
      />

      <StoreTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 콘텐츠 */}
      <main className="flex-1 overflow-y-auto flex flex-col pb-[80px]">
        {activeTab === '게시판' ? (
          <div className="flex flex-col gap-[var(--space-4)] px-[var(--space-5)] pt-[var(--space-4)] pb-[var(--space-7)]">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onClick={() =>
                  navigate(
                    ROUTES.STORE_BOARD_DETAIL.replace(
                      ':postId',
                      String(post.postId)
                    ),
                    { state: location.state }
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {sortedRooms.map((room) => (
              <ChatRoomCard
                key={room.roomId}
                room={room}
                onClick={() =>
                  navigate(
                    ROUTES.STORE_CHAT_ROOM.replace(
                      ':chatRoomId',
                      String(room.roomId)
                    ),
                    { state: location.state }
                  )
                }
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
