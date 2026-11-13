import { NICKNAME_MAX_LENGTH, ROOM_CAPACITY, nicknameIsValid } from '@komorebi/realtime';
import { useActionState, useId, useState } from 'react';
import { useModal } from '../model/hooks/useModal';
import type { useTogether } from '../model/hooks/useTogether';
import { CONNECTION } from '../model/together';
import { WORLDS } from '../model/world/world';
import { Icon } from './Icon';

type Props = { isOpen: boolean; isReady: boolean; together: ReturnType<typeof useTogether>; onClose: () => void };
const CONNECTION_LABEL = {
  [CONNECTION.offline]: '',
  [CONNECTION.connecting]: '친구를 만날 준비를 하고 있어요…',
  [CONNECTION.online]: '같은 여름 안에 있어요.',
  [CONNECTION.retrying]: '연결이 잠깐 끊겼어요. 다시 만나고 있어요…',
  [CONNECTION.error]: '',
};

export function TogetherDialog({ isOpen, isReady, together, onClose }: Props) {
  const ref = useModal(isOpen);
  const titleId = useId();
  const nicknameId = useId();
  const [copyMessage, setCopyMessage] = useState('');
  const [formError, submit] = useActionState((_previous: string, data: FormData) => {
    const raw = data.get('nickname');
    const nickname = typeof raw === 'string' ? raw.trim() : '';
    if (!nicknameIsValid(nickname)) return `이름을 1~${NICKNAME_MAX_LENGTH}글자로 적어 주세요.`;
    together.join(nickname);
    return '';
  }, '');
  const isOnline = together.status === CONNECTION.online;
  const hasSession = together.session !== null;
  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage('초대 링크를 복사했어요. 친구에게 보내 주세요.');
    } catch {
      setCopyMessage('복사하지 못했어요. 아래 초대 주소를 복사해 주세요.');
    }
  }
  return (
    <dialog
      className="map-dialog together-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">A LITTLE SUMMER TOGETHER</span>
          <h2 id={titleId}>친구와 같이 걷기</h2>
        </div>
        <button className="tool" aria-label="같이 걷기 닫기" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {!together.isAvailable ? (
        <p>함께 걷을 마을을 준비하고 있어요. 지금은 혼자 산책을 즐겨 주세요.</p>
      ) : (
        <>
          {!hasSession && (
            <>
              <p>
                {together.invitedRoom ? '친구가 초대한 여름에 놀러 가요.' : '우리끼리 머물 작은 여름을 열어 보세요.'}{' '}
                최대 {ROOM_CAPACITY}명까지 함께할 수 있어요.
              </p>
              <form action={submit} className="together-form">
                <label htmlFor={nicknameId}>친구에게 보여줄 이름</label>
                <input
                  id={nicknameId}
                  name="nickname"
                  autoComplete="off"
                  placeholder="산책하는 나의 이름"
                  required
                  maxLength={24}
                />
                {formError && <p role="alert">{formError}</p>}
                <button className="wardrobe-done" type="submit" disabled={!isReady}>
                  {together.invitedRoom ? '친구의 산책에 들어가기' : '우리 산책 만들기'}
                </button>
              </form>
            </>
          )}
          {hasSession && (
            <>
              <p role="status">{together.error || CONNECTION_LABEL[together.status]}</p>
              {isOnline && (
                <>
                  <ul className="together-peers" aria-label="함께 걷는 사람들">
                    {together.peers.map((peer) => (
                      <li key={peer.id}>
                        <strong>{peer.nickname}</strong>
                        <span>{WORLDS[peer.walker.region].name}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="wardrobe-done" onClick={copyLink}>
                    초대 링크 복사
                  </button>
                  <label className="invitation-label">
                    초대 주소
                    <input
                      aria-label="초대 주소"
                      readOnly
                      value={typeof window === 'undefined' ? '' : window.location.href}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </label>
                  <p className="together-note">링크를 받은 사람만 들어올 수 있어요. 모두 나가면 산책은 끝나요.</p>
                  <button className="wardrobe-done" onClick={onClose}>
                    함께 산책하기
                  </button>
                </>
              )}
              <p role="status">{copyMessage}</p>
              <button
                className="together-leave"
                onClick={() => {
                  together.leave();
                  setCopyMessage('');
                }}
              >
                같이 걷기 나가기
              </button>
            </>
          )}
        </>
      )}
    </dialog>
  );
}
