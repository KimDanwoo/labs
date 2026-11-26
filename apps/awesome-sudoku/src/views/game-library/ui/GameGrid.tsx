import { GAMES, GAME_LIST } from '@entities/game-catalog';
import { GameCard } from '@views/game-library/ui/GameCard';
import styles from '@views/game-library/ui/GameLibrary.module.css';

export function GameGrid() {
  return (
    <section className={styles.collection} aria-labelledby="game-list-title">
      <h2 id="game-list-title">게임 목록</h2>
      <ul className={styles.grid}>
        <li key={GAMES.guess.href}>
          <GameCard id="guess" />
        </li>
        {GAME_LIST.filter(([id]) => id !== 'guess').map(([id, game]) => (
          <li key={game.href}>
            <GameCard id={id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
