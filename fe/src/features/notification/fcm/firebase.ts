import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

// Vite 환경변수에서 Firebase 설정값을 읽습니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 앱 인스턴스를 1회만 초기화해서 반환합니다.
// - 이미 초기화된 앱이 있으면 재사용
// - 없으면 initializeApp 호출
export function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      'Firebase 환경변수가 비어 있습니다. .env.local 값을 확인해 주세요.'
    );
  }
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  return initializeApp(firebaseConfig);
}

// Firebase Messaging 인스턴스를 반환합니다.
// 이후 getToken / onMessage에서 사용됩니다.
export function getFirebaseMessaging(): Messaging {
  const app = getFirebaseApp();
  return getMessaging(app);
}