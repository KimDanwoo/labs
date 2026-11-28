import { STORAGE_KEY } from '@views/gostop/config/storage';
import { parseWallet } from '@views/gostop/lib/money';
import { readStored } from '@views/gostop/lib/storage';
import type { Wallet } from '@views/gostop/model/types/money';

export const readWallet = (): Wallet => parseWallet(readStored(STORAGE_KEY.WALLET));
