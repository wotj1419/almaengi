import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
} from '@/api/notification';

// 알림 관련 Query Key를 한 곳에서 관리
export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'] as const,
};

// 내 알림 목록 조회
export function useNotifications() {
  // accessToken이 있을 때만 조회
  const hasToken =
    typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(),
    queryFn: fetchNotifications,
    enabled: hasToken,
  });
}

// 읽지 않은 알림 개수 조회(헤더 점뱃지용)
export function useUnreadNotificationCount() {
  const hasToken =
    typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'));
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(),
    queryFn: fetchNotifications,
    enabled: hasToken,
    select: (items) => items.filter((item) => !item.isRead).length,
  });
}

// 단건 읽음 처리
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

// 다건 읽음 처리
export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: number[]) =>
      markNotificationsAsRead({ notificationIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}