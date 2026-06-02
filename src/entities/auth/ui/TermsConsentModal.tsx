'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { GoogleIcon, ModalShell } from '@shared/ui';
import { useGoogleConsent } from '../model/hooks';
import { googleAuthIntentAtom } from '../model/store';
import TermsDocument from './TermsDocument';
import PrivacyDocument from './PrivacyDocument';

const CONSENT_ITEMS = [
  { key: 'terms', label: '이용약관 (필수)', Doc: TermsDocument },
  {
    key: 'privacy',
    label: '개인정보 수집·이용 (필수)',
    Doc: PrivacyDocument,
  },
] as const;

type ConsentKey = (typeof CONSENT_ITEMS)[number]['key'];

const INITIAL_CHECKED: Record<ConsentKey, boolean> = {
  terms: false,
  privacy: false,
};

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex items-center justify-center w-5 h-5 rounded-md border text-white text-xs transition-colors ${
        checked ? 'bg-gray-700 border-gray-700' : 'bg-white border-gray-300'
      }`}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

export default function TermsConsentModal() {
  const intent = useAtomValue(googleAuthIntentAtom);
  const { agree, cancel } = useGoogleConsent();
  const [checked, setChecked] = useState(INITIAL_CHECKED);
  const [viewing, setViewing] = useState<ConsentKey | null>(null);

  const allChecked = checked.terms && checked.privacy;
  const ViewingDoc = CONSENT_ITEMS.find((i) => i.key === viewing)?.Doc ?? null;

  if (!intent) return null;

  const toggle = (key: ConsentKey) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ terms: next, privacy: next });
  };

  const handleCancel = () => {
    setChecked(INITIAL_CHECKED);
    setViewing(null);
    cancel();
  };

  const handleAgree = () => {
    if (!allChecked) return;
    setChecked(INITIAL_CHECKED);
    agree().catch(() => {});
  };

  return (
    <>
      <ModalShell
        onClose={handleCancel}
        maxWidth="max-w-xs"
        className="p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-gray-700">약관 동의</h3>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            구글로 로그인하면 계정 식별을 위해 이메일이 수집돼요. 아래 약관에
            모두 동의해야 진행할 수 있어요.
          </p>
        </div>

        <div className="surface rounded-xl p-4 space-y-3">
          <button
            onClick={toggleAll}
            className="w-full flex items-center gap-2.5 btn-press text-left"
          >
            <CheckBox checked={allChecked} />
            <span className="text-sm font-bold text-gray-700">전체 동의</span>
          </button>

          <div className="border-t border-gray-100" />

          <div className="space-y-2.5">
            {CONSENT_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggle(item.key)}
                  className="flex items-center gap-2.5 btn-press flex-1 text-left"
                >
                  <CheckBox checked={checked[item.key]} />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </button>
                <button
                  onClick={() => setViewing(item.key)}
                  className="text-[11px] text-gray-300 underline btn-press shrink-0"
                >
                  보기
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleAgree}
            disabled={!allChecked}
            className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
              allChecked
                ? 'btn-press bg-white border border-gray-200 text-gray-700 shadow-game-sm'
                : 'bg-gray-100 border border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <GoogleIcon size={14} />
            동의하고 구글로 계속
          </button>
          <button
            onClick={handleCancel}
            className="w-full py-1.5 rounded-lg text-[11px] btn-press text-gray-400 hover:text-gray-500"
          >
            취소
          </button>
        </div>
      </ModalShell>

      {ViewingDoc && (
        <ModalShell
          variant="sheet"
          onClose={() => setViewing(null)}
          maxWidth="max-w-md"
          className="p-0 flex flex-col max-h-[85dvh]"
        >
          <div className="flex-1 overflow-y-auto p-6">
            <ViewingDoc />
          </div>
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setViewing(null)}
              className="w-full py-2.5 rounded-lg font-bold text-xs btn-press bg-gray-700 text-white"
            >
              닫기
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
}
