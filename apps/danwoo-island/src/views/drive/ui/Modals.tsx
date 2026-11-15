import { worldAsset } from '../config/worldAsset';
import { CloseButton } from './CloseButton';

export function Modals() {
  return (
    <div className="js-modals modals">
      <div className="js-modal modal circuit-end" data-name="circuit-end">
        <div className="content">
          <div className="title">완주했어요</div>
          <p className="text">이번 주행 시간</p>
          <div className="js-time time" />
          <div className="horizontal-group">
            <button className="js-button-restart button">다시 달리기</button>
            <button className="js-close button">돌아가기</button>
          </div>
        </div>
      </div>
      <div className="js-modal modal jukebox" data-name="jukebox">
        <div className="panel-card">
          <header className="panel-header">
            <img className="panel-logo" src={worldAsset('ui/islandMark.png')} alt="" aria-hidden="true" />
            <h2 className="panel-title">쥬크박스</h2>
            <span className="panel-badge">MUSIC</span>
            <CloseButton />
          </header>
          <section className="js-jukebox-now jukebox-now" aria-live="polite" />
          <ul className="js-jukebox-tracks jukebox-tracks" />
        </div>
      </div>
      <div className="js-modal modal blog" data-name="blog">
        <div className="panel-card">
          <header className="panel-header">
            <img className="panel-logo" src={worldAsset('ui/islandMark.png')} alt="" aria-hidden="true" />
            <h2 className="panel-title">최신 글 게시판</h2>
            <span className="panel-badge">BLOG</span>
            <CloseButton />
          </header>
          <ul className="js-blog-posts blog-posts" />
          <a className="blog-all" href="https://danwoo.dev/" target="_blank" rel="noopener noreferrer">
            블로그 전체 보기
          </a>
        </div>
      </div>
      <div className="js-modal modal map" data-name="map">
        <div className="map-hud">
          <header className="map-chip">
            <img className="map-chip-logo" src={worldAsset('ui/islandMark.png')} alt="" aria-hidden="true" />
            <h2 className="map-chip-title">MAP</h2>
          </header>
          <div className="js-map-pins map-pins" />
          <div className="js-map-car map-car" aria-hidden="true" />
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
          <nav className="map-places" aria-label="장소 목록">
            <h3 className="map-places-title">장소</h3>
            <ul className="js-map-places map-places-list" />
          </nav>
          <p className="map-hint">핀을 눌러 고르고 이동 · 드래그로 둘러보기 · M 닫기</p>
          <CloseButton />
        </div>
      </div>
    </div>
  );
}
