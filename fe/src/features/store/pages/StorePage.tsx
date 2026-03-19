import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import DetailHeader from '@/components/layout/DetailHeader';
import BottomNav from '@/components/layout/BottomNav';
import ChatRoomCard from '../components/ChatRoomCard';
import { useChatStore } from '@/stores/useChatStore';

type Tab = '게시판' | '채팅방';
const TABS: Tab[] = ['게시판', '채팅방'];

export default function StorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('채팅방');
  const rooms = useChatStore((s) => s.rooms);

  // 알맹이 챗봇 최상단 고정, 나머지는 최신 메시지 순 (내림차순)
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.roomType === 'CHATBOT') return -1;
    if (b.roomType === 'CHATBOT') return 1;
    return (
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-base)]">
      <DetailHeader
        title="매장 게시판"
        onBack={() => navigate(ROUTES.HOME)}
        rightIcon={
          activeTab === '채팅방' ? (
            <MessageSquarePlus
              size={20}
              color="var(--color-text-primary)"
              strokeWidth={2}
            />
          ) : undefined
        }
        onRightClick={
          activeTab === '채팅방'
            ? () => navigate(ROUTES.STORE_CHAT_NEW)
            : undefined
        }
      />

      {/* 탭 */}
      <div className="bg-[var(--color-bg-white)] flex border-b border-[var(--color-border-light)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-[var(--space-3)] cursor-pointer border-b-4 ${activeTab === tab ? 'border-[var(--color-primary)]' : 'border-transparent'}`}
            onClick={() => setActiveTab(tab)}
          >
            <span
              className={`text-[length:var(--text-lg)] leading-5 ${activeTab === tab ? 'font-bold text-[color:var(--color-text-primary)]' : 'font-medium text-[color:var(--color-text-sub)]'}`}
            >
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <main className="flex-1 flex flex-col pb-[var(--bottom-safe)]">
        {activeTab === '게시판' ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[length:var(--text-md)] text-[color:var(--color-text-muted)]">
              게시판 기능 준비 중
            </p>
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
                    )
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
