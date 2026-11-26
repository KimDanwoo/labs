import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

import { GAMES, type GameId } from '@entities/game-catalog';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface GameCardProps {
  id: GameId;
}

export function GameCard({ id }: GameCardProps) {
  const game = GAMES[id];
  const name = id === 'guess' ? '오늘의 맞춰봐' : game.name;

  return (
    <Link href={game.href} className={styles.card}>
      <div className={styles.preview}>
        <Image src={`/game-previews/${id}.png`} alt="" fill sizes="(max-width: 640px) 7rem, 9rem" unoptimized />
      </div>
      <div className={styles.cardCopy}>
        <h3>{name}</h3>
        <p>{game.description}</p>
      </div>
      <LuArrowRight className={styles.cardArrow} aria-hidden="true" />
    </Link>
  );
}
