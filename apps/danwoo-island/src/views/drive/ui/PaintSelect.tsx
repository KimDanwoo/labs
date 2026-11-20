import { PAINT_OPTIONS } from '@views/drive/config/menu';

export function PaintSelect() {
  return (
    <select id="vehicle-paint" className="js-paint-select button">
      {PAINT_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
