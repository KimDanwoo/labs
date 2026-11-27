import { gameMetadata } from '@app/config/gameMetadata';
import { LottoPage } from '@views/lotto';

export const metadata = gameMetadata('lotto');

export default function Lotto() {
  return <LottoPage />;
}
