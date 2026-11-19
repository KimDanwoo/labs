import { useWalkContext } from '../model/hooks/useWalkContext';

export function WalkLoading() {
  const { isReady, error } = useWalkContext();
  if (isReady) return null;
  return (
    <div className="loading">
      <p>{error || '여름을 한 장씩 펼치고 있어요…'}</p>
      {error && <button onClick={() => window.location.reload()}>다시 시도</button>}
    </div>
  );
}
