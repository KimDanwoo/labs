import { supabase } from '@shared/lib';
import {
  RPC_ACCEPT_INVITE,
  RPC_CREATE_ROOM,
  ROOM_INVITES_TABLE,
  ROOM_TABLE,
} from '../constants';
import { INVITE_STATUS } from '../types';
import type {
  ChatRoomRow,
  Invite,
  Room,
  RoomInviteRow,
} from '../types';

// ── Mappers ──────────────────────────────────────────────────────
function toRoom(row: ChatRoomRow): Room {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

function toInvite(row: RoomInviteRow): Invite {
  return {
    id: row.id,
    roomId: row.room_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ── Room CRUD ────────────────────────────────────────────────────
/** 방 생성 + 소유자 멤버 등록 (RPC). 비익명 유저만 호출 가능. */
export async function createRoom(
  name: string,
  nickname: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(RPC_CREATE_ROOM, {
    p_name: name,
    p_nickname: nickname,
  });
  if (error) throw error;
  return data as string;
}

/** 내가 멤버인 방 목록 (chat_rooms RLS가 is_room_member로 이미 제한) */
export async function fetchMyRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from(ROOM_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ChatRoomRow[] | null)?.map(toRoom) ?? [];
}

// ── Invite CRUD ──────────────────────────────────────────────────
/** 초대 발송 */
export async function sendInvite(
  roomId: string,
  inviteeId: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase.from(ROOM_INVITES_TABLE).insert({
    room_id: roomId,
    inviter_id: user.id,
    invitee_id: inviteeId,
  });
  if (error) throw error;
}

/** 나에게 온 pending 초대 목록 */
export async function fetchMyInvites(): Promise<Invite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(ROOM_INVITES_TABLE)
    .select('*')
    .eq('invitee_id', user.id)
    .eq('status', INVITE_STATUS.PENDING)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as RoomInviteRow[] | null)?.map(toInvite) ?? [];
}

/** 초대 수락 (RPC — 멤버십까지 원자적 처리). 반환값은 room uuid. */
export async function acceptInvite(
  inviteId: string,
  nickname: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(RPC_ACCEPT_INVITE, {
    p_invite_id: inviteId,
    p_nickname: nickname,
  });
  if (error) throw error;
  return data as string;
}

/** 초대 거절 (pending 상태인 것만, status → declined) */
export async function declineInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from(ROOM_INVITES_TABLE)
    .update({ status: INVITE_STATUS.DECLINED })
    .eq('id', inviteId)
    .eq('status', INVITE_STATUS.PENDING);
  if (error) throw error;
}

// ── Realtime join helpers ────────────────────────────────────────
type JoinInvitesOptions = {
  userId: string;
  onInvite: (invite: Invite) => void;
};

/** 내 초대 수신 채널 구독. 정리 함수 반환. */
export function joinInvitesChannel({
  userId,
  onInvite,
}: JoinInvitesOptions): () => void {
  const channel = supabase.channel(`invites:${userId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: ROOM_INVITES_TABLE,
        filter: `invitee_id=eq.${userId}`,
      },
      (payload) => onInvite(toInvite(payload.new as RoomInviteRow)),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
