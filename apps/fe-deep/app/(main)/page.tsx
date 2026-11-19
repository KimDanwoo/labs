import type { Metadata } from 'next';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export { HomeView as default } from '@views/home/index.server';
