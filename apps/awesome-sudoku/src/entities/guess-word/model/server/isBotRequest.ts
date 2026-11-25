import { checkBotId } from 'botid/server';

export async function isBotRequest(): Promise<boolean> {
  const verification = await checkBotId().catch(() => null);
  return verification?.isBot ?? false;
}
