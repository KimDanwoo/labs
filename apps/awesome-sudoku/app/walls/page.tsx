import { gameMetadata } from '@app/config/gameMetadata';
import { WallsPage } from '@views/walls';

export const metadata = gameMetadata('walls');

export default function Walls() {
  return <WallsPage />;
}
