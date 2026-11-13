const ORIGINAL_WORLD_URL = 'https://github.com/brunosimon/folio-2025';

export function IslandIdentity() {
  return (
    <>
      <header className="island-identity" aria-label="Danwoo Island">
        <span className="island-symbol" aria-hidden="true">
          ✳
        </span>
        <span>
          DANWOO
          <br />
          ISLAND
          <span className="island-dot">.</span>
        </span>
      </header>
      <p className="island-credit">
        Based on{' '}
        <a href={ORIGINAL_WORLD_URL} target="_blank" rel="noopener noreferrer">
          Bruno Simon’s world
        </a>
      </p>
    </>
  );
}
