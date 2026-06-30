import { requestFcmToken, userDoc } from '@shared/firebase';
import { setDoc } from 'firebase/firestore';

// FCM 알림 켜기 — 토큰을 발급해 유저 문서에 저장(서버 발송 대상). 성공 여부 반환.
export const enableNotifications = async (uid: string): Promise<boolean> => {
  const token = await requestFcmToken();
  if (!token) {
    return false;
  }
  await setDoc(userDoc(uid), { fcmToken: token }, { merge: true });
  return true;
};
