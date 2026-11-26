import { gameMetadata } from '@app/config/gameMetadata';
import { GomokuPage } from '@views/gomoku';

export const metadata = gameMetadata('gomoku');

export default function Gomoku() {
  return <GomokuPage />;
}
