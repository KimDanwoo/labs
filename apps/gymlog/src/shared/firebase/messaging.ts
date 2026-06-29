import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import { firebaseApp } from './config';

// 알림 권한 요청 + 서비스 워커 등록 + FCM 토큰 발급.
// 미지원(예: iOS 브라우저 탭)·권한 거부·VAPID 키 없음이면 null.
export const requestFcmToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !(await isSupported())) {
    return null;
  }
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return null;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  return getToken(getMessaging(firebaseApp), { vapidKey, serviceWorkerRegistration: registration });
};

// 앱이 떠 있을 때(포그라운드) 도착하는 메시지 구독.
export const onForegroundMessage = async (handler: (payload: MessagePayload) => void): Promise<() => void> => {
  if (typeof window === 'undefined' || !(await isSupported())) {
    return () => undefined;
  }
  return onMessage(getMessaging(firebaseApp), handler);
};
