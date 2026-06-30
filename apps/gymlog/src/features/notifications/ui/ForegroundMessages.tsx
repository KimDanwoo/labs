'use client';

import { onForegroundMessage } from '@shared/firebase';
import { useEffect } from 'react';

import { NOTIFICATION_ICON_SRC } from '@features/notifications/model/constants';

// 앱이 떠 있을 때(포그라운드) 도착한 FCM 메시지를 OS 알림으로 표시하는 비표시 컴포넌트.
export function ForegroundMessages() {
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    void onForegroundMessage((payload) => {
      if (Notification.permission !== 'granted') {
        return;
      }
      new Notification(payload.notification?.title ?? 'gymlog', {
        body: payload.notification?.body ?? '',
        icon: NOTIFICATION_ICON_SRC,
      });
    }).then((fn) => {
      unsubscribe = fn;
    });
    return () => unsubscribe();
  }, []);

  return null;
}
