export function MenuTrigger() {
  return (
    <button className="js-menu-trigger menu-trigger" aria-label="메뉴 열기">
      <div className="button-inner">
        <div className="icon-container">
          <div className="icon">
            <div className="line" />
            <div className="line" />
            <div className="line" />
          </div>
        </div>
      </div>
    </button>
  );
}
