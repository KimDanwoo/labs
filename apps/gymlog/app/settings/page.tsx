import { SettingsView } from '@views/settings/SettingsView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '설정' };

export default function SettingsPage() {
  return <SettingsView />;
}
