interface ControlTabProps {
  name: string;
  label: string;
}

export function ControlTab({ name, label }: ControlTabProps) {
  return (
    <button className="js-tabs-navigation-item tab" data-tabs-name={name}>
      <div className="active-background" />
      <span className="icon-container">
        <span className={`icon icon-${name}`} />
      </span>
      <span className="label">{label}</span>
    </button>
  );
}
