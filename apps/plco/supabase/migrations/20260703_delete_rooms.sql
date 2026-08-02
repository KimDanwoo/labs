-- ============================================================
-- 채팅방 삭제 (소유자 전용)
--   - 방 소유자(owner_id)만 자기 방을 삭제할 수 있다.
--   - room_members / chat_messages / room_invites / room_passwords 는 모두
--     chat_rooms(id) 를 on delete cascade 로 참조하므로, 방 한 줄 삭제로 전부 정리된다.
--     (cascade 는 시스템 권한으로 실행되어 자식 테이블 RLS 를 우회하므로
--      정책이 전혀 없는 room_passwords 도 함께 삭제된다.)
-- ============================================================

drop policy if exists "room delete" on chat_rooms;
create policy "room delete" on chat_rooms for delete to authenticated
  using (owner_id = auth.uid());
