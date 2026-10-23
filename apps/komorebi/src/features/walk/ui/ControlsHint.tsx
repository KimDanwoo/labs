export function ControlsHint() {
  return (
    <div className="keyboard-help">
      <span>
        <kbd>W</kbd>
        <span className="key-row">
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd>
        </span>
      </span>
      <span className="control-copy">방향키 / 길 클릭</span>
      <i />
      <kbd className="wide-key">Shift</kbd>
      <span className="control-copy">전력 질주</span>
      <kbd className="wide-key">Space</kbd>
      <span className="control-copy">점프</span>
    </div>
  );
}
