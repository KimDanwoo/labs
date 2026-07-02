'use client';

import { useState, type FormEvent } from 'react';
import {
  ROOM_NAME_MAX,
  ROOM_NICKNAME_MAX,
  ROOM_PASSWORD_MAX,
} from '@entities/chat-room/model/constants';
import { useCreateRoom } from '@entities/chat-room/model/hooks';

type CreateRoomDialogProps = {
  defaultNickname: string;
  onCreated: (roomId: string) => void;
  onCancel: () => void;
};

export default function CreateRoomDialog({
  defaultNickname,
  onCreated,
  onCancel,
}: CreateRoomDialogProps) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState(defaultNickname);
  const [isPublic, setIsPublic] = useState(false);
  const [password, setPassword] = useState('');
  const { mutate, isPending, error } = useCreateRoom();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedNick = nickname.trim() || defaultNickname;
    if (!trimmedName || isPending) return;

    const trimmedPassword = password.trim();
    mutate(
      {
        name: trimmedName.slice(0, ROOM_NAME_MAX),
        nickname: trimmedNick.slice(0, ROOM_NICKNAME_MAX),
        isPublic,
        password: isPublic && trimmedPassword ? trimmedPassword : undefined,
      },
      { onSuccess: (roomId) => onCreated(roomId) },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-game-sm"
    >
      <h4 className="text-sm font-bold text-gray-700">새 채팅방 만들기</h4>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">방 이름</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={ROOM_NAME_MAX}
          placeholder="방 이름을 입력하세요"
          className="rounded-xl bg-input-bg px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">내 닉네임</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={ROOM_NICKNAME_MAX}
          placeholder={defaultNickname}
          className="rounded-xl bg-input-bg px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </label>

      <label className="flex items-center justify-between gap-2 rounded-xl bg-input-bg px-3 py-2">
        <div>
          <p className="text-xs font-semibold text-gray-700">공개 방</p>
          <p className="text-[10px] text-gray-400">누구나 자유롭게 입장할 수 있어요</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((prev) => !prev)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isPublic ? 'bg-gold' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              isPublic ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </label>

      {isPublic && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">비밀번호 (선택)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={ROOM_PASSWORD_MAX}
            placeholder="입장 시 물어볼 비밀번호"
            autoComplete="new-password"
            className="rounded-xl bg-input-bg px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <span className="text-[10px] text-gray-400">
            비워두면 누구나 자유롭게 입장할 수 있어요
          </span>
        </label>
      )}

      {error && (
        <p className="text-xs text-red">{(error as Error).message}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-card-border bg-white py-2 text-sm font-bold text-gray-500 btn-press"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isPending}
          className="flex-1 rounded-full bg-gold py-2 text-sm font-bold text-white btn-press shadow-game-sm disabled:opacity-40"
        >
          {isPending ? '생성 중…' : '만들기'}
        </button>
      </div>
    </form>
  );
}
