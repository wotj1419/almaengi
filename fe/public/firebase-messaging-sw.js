/* eslint-disable no-undef */
// firebase-messaging-sw.js
// - 백그라운드 푸시 수신 전용 Service Worker
// - Vite 번들 대상이 아니므로 import.meta.env를 직접 사용할 수 없습니다.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
);
firebase.initializeApp({
  apiKey: 'AIzaSyDFVPkZ_n2hOVMeWHpLG3ROicBSPtD0tYk',
  authDomain: 'almaengi-c2bba.firebaseapp.com',
  projectId: 'almaengi-c2bba',
  storageBucket: 'almaengi-c2bba.firebasestorage.app',
  messagingSenderId: '719081221848',
  appId: '1:719081221848:web:9c9f13530d810efe80b1ad',
});

const messaging = firebase.messaging();
function resolveRoute(type, targetId) {
  switch (type) {
    case 'AUCTION':
      return targetId ? `/auction/${targetId}` : '/notification';
    case 'LATE':
      return '/attendance';
    case 'SCHEDULE':
      return '/schedule';
    case 'SALARY':
      return '/payroll';
    default:
      return '/notification';
  }
}

// 앱이 백그라운드일 때 푸시 수신
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '새 알림';
  const body = payload.notification?.body || '알림이 도착했습니다.';
  const type = payload.data?.type || '';
  const targetId = payload.data?.targetId || '';
  self.registration.showNotification(title, {
    body,
    icon: '/almaengi.png',
    data: { type, targetId },
  });
});

// 시스템 알림 클릭 시 앱 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const type = event.notification?.data?.type || '';
  const rawTargetId = event.notification?.data?.targetId || '';
  const parsedTargetId = Number(rawTargetId);
  const targetId = Number.isNaN(parsedTargetId) ? null : parsedTargetId;
  const route = resolveRoute(type, targetId);
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // 열려있는 탭이 있으면 포커스 + 이동
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(route);
          }
          return;
        }
      }
      // 없으면 새 창
      if (clients.openWindow) {
        await clients.openWindow(route);
      }
    })()
  );
});