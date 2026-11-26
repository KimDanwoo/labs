import { gameMetadata } from '@app/config/gameMetadata';
import { KillerSudokuPage } from '@views/killer-sudoku';

export const metadata = gameMetadata('killer');

export default function KillerPage() {
  return <KillerSudokuPage />;
}
