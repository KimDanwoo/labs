import { gameMetadata } from '@app/config/gameMetadata';
import { SlitherlinkPage } from '@views/slitherlink';

export const metadata = gameMetadata('slitherlink');

export default function Slitherlink() {
  return <SlitherlinkPage />;
}
