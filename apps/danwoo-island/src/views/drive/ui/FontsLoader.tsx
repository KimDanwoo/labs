const PRELOADED_FONTS = [
  { className: 'nunito', font: '400 20px Nunito' },
  { className: 'amatic-sc', font: "700 20px 'Amatic SC'" },
  { className: 'pally', font: '500 20px Pally-Medium' },
] as const;

export function FontsLoader() {
  return (
    <div className="js-fonts-loader fonts-loader" aria-hidden="true">
      {PRELOADED_FONTS.map(({ className, font }) => (
        <div key={className} className={`font ${className}`} data-font={font}>
          {' '}
        </div>
      ))}
    </div>
  );
}
