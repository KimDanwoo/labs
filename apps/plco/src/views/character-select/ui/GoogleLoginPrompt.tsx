'use client';

import { useAuth, useGoogleConsent } from '@entities/auth/model/hooks';
import { GoogleIcon } from '@shared/ui';

export default function GoogleLoginPrompt() {
	const { isAnonymous } = useAuth();
	const { requestLogin } = useGoogleConsent();

	if (!isAnonymous) return null;

	const handleLogin = () => requestLogin();

	return (
		<div className="w-full p-3 rounded-2xl bg-white/85 border border-blue-100 space-y-2 shadow-sm">
			<div className="space-y-0.5">
				<div className="text-xs font-bold text-gray-700">
					다른 기기 데이터 불러오기
				</div>
				<div className="text-[11px] text-gray-400">
					구글로 로그인하면 다른 브라우저에서 키우던 친구를 가져와요
				</div>
			</div>
			<button
				onClick={handleLogin}
				className="w-full py-2 rounded-lg font-bold text-xs btn-press bg-white border border-gray-200 text-gray-700 flex items-center justify-center gap-1.5 shadow-game-sm"
			>
				<GoogleIcon size={14} />
				구글로 로그인
			</button>
		</div>
	);
}
