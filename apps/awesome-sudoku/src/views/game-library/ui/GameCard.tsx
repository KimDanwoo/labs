import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

import type { ShelfGame } from '@entities/game-catalog';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface GameCardProps {
  game: ShelfGame;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={game.href} className={styles.card}>
      <div className={styles.preview}>
        <Image src={`/game-previews/${game.id}.png`} alt="" fill sizes="(max-width: 640px) 7rem, 9rem" unoptimized />
      </div>
      <div className={styles.cardCopy}>
        <h3>{game.name}</h3>
        <p>{game.description}</p>
      </div>
      <LuArrowRight className={styles.cardArrow} aria-hidden="true" />
    </Link>
  );
}
