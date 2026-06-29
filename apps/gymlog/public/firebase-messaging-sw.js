/* FCM 백그라운드 메시지 처리용 서비스 워커.
 * 서비스 워커는 ES module import가 안 되므로 compat 빌드를 importScripts로 로드한다.
 * firebaseConfig는 공개 식별자라 하드코딩해도 안전(보안은 규칙·Auth가 담당). */
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBSG3o0o2NYF4pAk1G0H0UxkQ2c3rCjfaI',
  authDomain: 'gymlog-a4f6d.firebaseapp.com',
  projectId: 'gymlog-a4f6d',
  storageBucket: 'gymlog-a4f6d.firebasestorage.app',
  messagingSenderId: '62403188471',
  appId: '1:62403188471:web:a8268798d0318e9febe5f2',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'gymlog';
  self.registration.showNotification(title, {
    body: payload.notification?.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
});
