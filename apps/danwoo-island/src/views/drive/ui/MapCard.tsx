export function MapCard() {
  return (
    <section className="js-map-card map-card is-hidden" aria-live="polite">
      <img className="js-map-card-icon map-card-icon" alt="" />
      <div className="map-card-body">
        <strong className="js-map-card-title map-card-title" />
        <p className="js-map-card-text map-card-text" />
      </div>
      <button type="button" className="js-map-card-go map-card-go">
        여기로 이동
      </button>
    </section>
  );
}
