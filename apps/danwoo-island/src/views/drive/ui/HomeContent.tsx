import { ORIGIN_URL } from '@views/drive/config/menu';

export function HomeContent() {
  return (
    <div className="content-inner">
      <div className="title">Danwoo Island</div>
      <p className="text">차를 몰고 섬을 돌아다녀요.</p>
      <p className="text">프로젝트, 블로그 글, 음악이 섬 곳곳에 있어요.</p>
      <p className="text">가까이 가서 Enter를 누르면 열려요.</p>
      <p className="text">방향키나 WASD로 달리고, B나 Ctrl로 멈춰요.</p>
      <p className="text">
        원작은 Bruno Simon의{' '}
        <a href={ORIGIN_URL} target="_blank" rel="noopener noreferrer">
          folio-2025
        </a>
        (MIT)예요.
      </p>
    </div>
  );
}
