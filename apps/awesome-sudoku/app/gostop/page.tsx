import { gameMetadata } from '@app/config/gameMetadata';
import { GostopPage } from '@views/gostop';

export const metadata = gameMetadata('gostop');

export default function Gostop() {
  return <GostopPage />;
}
