import { TOUCH_BUTTONS } from '../config/menu';

export function TouchButtons() {
  return (
    <div className="js-touch-buttons touch-buttons">
      <div className="js-overlay overlay" />
      <div className="list">
        {TOUCH_BUTTONS.map(({ name, label }) => (
          <button key={name} data-name={name} className={`js-button ${name}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
