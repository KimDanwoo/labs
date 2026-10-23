type Props = { error: string };

export function LoadingOverlay({ error }: Props) {
  return (
    <div className="loading">
      <span className="loading-mark">木</span>
      <p>{error || '여름을 한 장씩 펼치고 있어요…'}</p>
      {error && <button onClick={() => window.location.reload()}>다시 시도</button>}
    </div>
  );
}
