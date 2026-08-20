import { atom } from 'jotai';

/**
 * 목록 접힘. 접힌 상태를 세 곳이 읽는다 —
 * PlayerView(그리드 트랙 크기 + 복귀 버튼), Playlist(표시할 행), PlaylistToggle(버튼 상태).
 * setState를 prop으로 내려보내지 않으려면 atom이어야 한다.
 */
export const isPlaylistCollapsedAtom = atom(false);
