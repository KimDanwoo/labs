'use client';

import { useState, useEffect } from 'react';
import { HEARTS_PER_MEETING, MEDICINE_PRICE, ALL_CHARACTER_IDS, LEVEL_UP_TOAST_DURATION, WAKE_UP_GRACE_MS } from '@shared/constants';
import type { ModalType, RoomType } from '@shared/types';
import { useGameState, useAutoDecay, useCharacterMovement, useSaveSync } from '@entities/game';
import { useAuth } from '@entities/auth';
import { CharacterSelectView } from '@views/character-select';
import { DeathScreen } from '@views/death';
import { StatusBar } from '@widgets/status-bar';
import { Room } from '@widgets/game-room';
import { ActionButtons } from '@widgets/action-bar';
import { FeedModal } from '@features/feed';
import { ShopModal } from '@features/shop';
import { MeetingModal } from '@features/meeting';
import { MiniGameModal } from '@features/minigame';
import { EggModal } from '@features/egg';
import { SettingsModal } from '@features/settings';

export default function GameView() {
	const {
		state,
		isLoaded,
		dispatch,
		feed,
		cleanPoop,
		cleanAllPoop,
		addHearts,
		buyFood,
		exchangeHearts,
		giveMedicine,
		minigameReward,
		collectEgg,
		dismissLevelUp,
		selectCharacter,
		reset,
		wakeUp,
	} = useGameState();

	const { user, isLoading: isAuthLoading, isAnonymous, signInAnonymously, linkWithGoogle } = useAuth();
	const [activeModal, setActiveModal] = useState<ModalType>(null);

	const isPlaying = state.status === 'playing';
	const position = useCharacterMovement(400, 300, isPlaying && !state.isSleeping);

	const isDrowsy =
		!state.isSleeping &&
		state.wokeUpAt !== null &&
		Date.now() - state.wokeUpAt <= WAKE_UP_GRACE_MS;

	useAutoDecay(isPlaying, state.isSick, state.wokeUpAt, dispatch);
	useSaveSync(user?.id ?? null, state, dispatch);

	// 자동 익명 로그인
	useEffect(() => {
		if (!isAuthLoading && !user) {
			signInAnonymously().catch(() => {});
		}
	}, [isAuthLoading, user, signInAnonymously]);

	// 알 준비 시 자동 모달
	useEffect(() => {
		if (state.eggReadyCharacterId && activeModal === null) {
			setTimeout(() => setActiveModal('egg'), 100);
		}
	}, [state.eggReadyCharacterId, activeModal]);

	// 레벨업 토스트 자동 해제
	useEffect(() => {
		if (!state.levelUpMessage) return;
		const timer = setTimeout(() => dismissLevelUp(), LEVEL_UP_TOAST_DURATION);
		return () => clearTimeout(timer);
	}, [state.levelUpMessage, dismissLevelUp]);

	if (!isLoaded) {
		return (
			<div className="flex flex-col items-center justify-center flex-1">
				<div className="text-2xl animate-bounce">🥚</div>
				<p className="text-sm text-gray-400 mt-2">로딩 중...</p>
			</div>
		);
	}

	if (state.status === 'selecting') {
		return <CharacterSelectView onSelect={selectCharacter} />;
	}

	if (state.status === 'dead' && state.characterId) {
		return <DeathScreen characterId={state.characterId} nickname={state.nickname} onReset={reset} />;
	}

	if (!state.characterId) return null;

	const hasFood = Object.values(state.inventory).some((count) => count > 0);

	const roomType: RoomType = (() => {
		if (state.isSleeping) return 'bedroom';
		if (activeModal === 'meeting') return 'outdoor';
		if (state.cleanliness <= 30 && state.poops.length >= 3) return 'bathroom';
		return 'living';
	})();

	const isAllUnlocked = (() => {
		const unlocked = new Set([...(state.unlockedCharacters ?? []), state.characterId]);
		return ALL_CHARACTER_IDS.every((id) => unlocked.has(id));
	})();

	return (
		<div className="flex flex-col flex-1 p-2 sm:p-3 gap-2 sm:gap-3">
			{/* 설정 버튼 */}
			<StatusBar
				hunger={state.hunger}
				cleanliness={state.cleanliness}
				hearts={state.hearts}
				level={state.level}
				coins={state.coins}
				isSick={state.isSick}
				nickname={state.nickname}
				onOpenSettings={() => setActiveModal('settings')}
			/>

			<Room
				characterId={state.characterId}
				position={position}
				poops={state.poops}
				level={state.level}
				isSleeping={state.isSleeping}
				isDrowsy={isDrowsy}
				isSick={state.isSick}
				isDead={false}
				hunger={state.hunger}
				cleanliness={state.cleanliness}
				onCleanPoop={cleanPoop}
				onWakeUp={wakeUp}
				roomType={roomType}
			/>

			<ActionButtons
				onFeed={() => setActiveModal('feed')}
				onClean={cleanAllPoop}
				onMeeting={() => setActiveModal('meeting')}
				onShop={() => setActiveModal('shop')}
				onMedicine={giveMedicine}
				onMinigame={() => setActiveModal('minigame')}
				poopCount={state.poops.length}
				hasFood={hasFood}
				isSick={state.isSick}
				canAffordMedicine={state.coins >= MEDICINE_PRICE}
			/>

			{/* 레벨업 토스트 */}
			{state.levelUpMessage && (
				<div
					className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm text-amber-700 animate-fade-in-up"
					style={{
						background: 'linear-gradient(135deg, #FFF7E6 0%, #FFE8B0 100%)',
						boxShadow: '0 8px 24px rgba(255, 183, 0, 0.2), 0 2px 4px rgba(0,0,0,0.04)',
						border: '1px solid rgba(255, 183, 0, 0.3)',
					}}
				>
					🎉 {state.levelUpMessage}
				</div>
			)}

			{activeModal === 'feed' && (
				<FeedModal inventory={state.inventory} onFeed={feed} onClose={() => setActiveModal(null)} />
			)}

			{activeModal === 'shop' && (
				<ShopModal
					coins={state.coins}
					hearts={state.hearts}
					inventory={state.inventory}
					onBuy={buyFood}
					onExchangeHearts={exchangeHearts}
					onClose={() => setActiveModal(null)}
				/>
			)}

			{activeModal === 'meeting' && (
				<MeetingModal
					myCharacterId={state.characterId}
					onComplete={() => addHearts(HEARTS_PER_MEETING)}
					onClose={() => setActiveModal(null)}
				/>
			)}

			{activeModal === 'minigame' && <MiniGameModal onComplete={minigameReward} onClose={() => setActiveModal(null)} />}

			{activeModal === 'settings' && (
				<SettingsModal
					onReset={reset}
					onClose={() => setActiveModal(null)}
					isAnonymous={isAnonymous}
					onLinkGoogle={linkWithGoogle}
				/>
			)}

			{activeModal === 'egg' && state.eggReadyCharacterId && (
				<EggModal
					characterId={state.eggReadyCharacterId}
					isAllUnlocked={isAllUnlocked}
					onCollect={collectEgg}
					onClose={() => setActiveModal(null)}
				/>
			)}
		</div>
	);
}
