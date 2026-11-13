const ORIGINAL_WORLD_URL = 'https://github.com/brunosimon/folio-2025';

const TOOLS = [
  { role: '3D 렌더링', name: 'Three.js', url: 'https://threejs.org' },
  { role: '물리', name: 'Rapier', url: 'https://rapier.rs' },
  { role: '오디오', name: 'Howler.js', url: 'https://howlerjs.com' },
  { role: '애니메이션', name: 'GSAP', url: 'https://gsap.com' },
] as const;

export function BehindTheSceneContent() {
  return (
    <div className="content-inner">
      <div className="title">크레딧</div>
      <p className="text">
        이 섬은 Bruno Simon이 공개한 포트폴리오 월드{' '}
        <a href={ORIGINAL_WORLD_URL} target="_blank" rel="noopener noreferrer">
          folio-2025
        </a>
        를 바탕으로 만들었어요. 원본은{' '}
        <a href="https://choosealicense.com/licenses/mit/" target="_blank" rel="noopener noreferrer">
          MIT 라이선스
        </a>
        로 공개돼 있어요.
      </p>
      <h2 className="title">바꾼 것</h2>
      <p className="text">
        석등·청사초롱·평상·옹기 같은 소품과 누각·초가 공방·서낭당 같은 건물을 한국 섬마을 모습으로 새로 만들었어요.
        나뭇잎은 벚꽃잎 모양이에요.
      </p>
      <h2 className="title">사용한 도구</h2>
      <ul className="text">
        {TOOLS.map(({ role, name, url }) => (
          <li key={name}>
            {role} ⇒{' '}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          </li>
        ))}
      </ul>
      <h2 className="title">음악</h2>
      <p className="text">
        배경 음악은 Kounine(
        <a href="https://linktr.ee/Kounine" target="_blank" rel="noopener noreferrer">
          Linktree
        </a>
        )이 원본 월드를 위해 만들었고,{' '}
        <a href="https://choosealicense.com/licenses/cc0-1.0/" target="_blank" rel="noopener noreferrer">
          CC0 라이선스
        </a>
        로 공개했어요.
      </p>
      <h2 className="title">글꼴</h2>
      <p className="text">메뉴와 안내 글꼴은 네이버 마루부리예요.</p>
    </div>
  );
}
