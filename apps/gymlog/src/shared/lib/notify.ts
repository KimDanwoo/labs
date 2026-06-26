// 알림 권한을 미리 요청(세션 시작 시 1회). 미지원·거부 시 조용히 무시.
export const requestNotifyPermission = (): void => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
    return;
  }
  void Notification.requestPermission();
};

// 권한이 있을 때만 알림 표시(없으면 무시 — 진동이 1차 신호).
export const notify = (title: string, body: string): void => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  new Notification(title, { body });
};
