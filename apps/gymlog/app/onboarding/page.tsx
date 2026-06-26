import { OnboardingView } from '@views/onboarding/OnboardingView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '시작하기' };

export default function OnboardingPage() {
  return <OnboardingView />;
}
