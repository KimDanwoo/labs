'use client';

import { useSetAtom } from 'jotai';
import { useAuth, useGoogleConsent } from '@entities/auth/model/hooks';
import { Disclaimer, GoogleIcon } from '@shared/ui';
import { CHARACTER_SELECT_STEP } from '../model/constants';
import { stepAtom } from '../model/store';

export default function IntroScreen() {
	const setStep = useSetAtom(stepAtom);
	const { isAnonymous } = useAuth();
	const { requestLogin } = useGoogleConsent();

	const handleStartNew = () => setStep(CHARACTER_SELECT_STEP.CAROUSEL);
	const handleGoogleLogin = () => requestLogin();

	return (
		<div className="flex flex-col items-center justify-center flex-1 px-6 relative overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-pink-50/50 via-white to-blue-50/50" />

			<div className="relative flex flex-col items-center gap-8 w-full max-w-xs">
				<div className="text-center space-y-2">
					<div className="text-5xl">🥚</div>
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-linear-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
						PLCO GOTCHI
					</h1>
					<p className="text-xs text-gray-400">
						플레이브 멤버를 함께 키워보세요
					</p>
				</div>

				<div className="flex flex-col gap-2.5 w-full">
					<button
						onClick={handleStartNew}
						className="w-full py-3.5 rounded-2xl text-white font-bold text-base btn-press shadow-xl bg-linear-to-r from-pink-400 to-purple-400"
						style={{ boxShadow: '0 6px 24px rgba(236, 72, 153, 0.3)' }}
					>
						새롭게 시작하기
					</button>

					{isAnonymous && (
						<button
							onClick={handleGoogleLogin}
							className="w-full py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm btn-press shadow-sm flex items-center justify-center gap-2"
						>
							<GoogleIcon size={16} />
							구글로 로그인
						</button>
					)}

					<p className="text-[10px] text-center text-gray-400 pt-1">
						구글로 로그인하면 다른 기기 데이터를 가져올 수 있어요
					</p>
				</div>
			</div>

			<Disclaimer className="absolute bottom-3 inset-x-0 px-6" />
		</div>
	);
}
