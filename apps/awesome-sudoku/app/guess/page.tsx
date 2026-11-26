import { gameMetadata } from '@app/config/gameMetadata';
import { GuessWordPage } from '@views/guess-word';

export const metadata = gameMetadata('guess');

export default function Guess() {
  return <GuessWordPage />;
}
