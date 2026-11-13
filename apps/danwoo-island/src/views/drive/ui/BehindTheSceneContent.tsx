export function BehindTheSceneContent() {
  return (
    <div className="content-inner">
      <div className="title">Behind the scene</div>
      <p className="text">
        Thank you for visiting my portfolio! <br />
        If you are curious about the stack and how I built this project, here’s everything you need to know.
      </p>
      <h2 className="title">Three.js</h2>
      <p className="text">
        <a href="https://threejs.org" target="_blank" rel="noopener noreferrer">
          Three.js
        </a>{' '}
        is the library I’m using to render this 3D world. <br />
        It was created by <strong>mr.doob</strong> (
        <a href="https://x.com/mrdoob" target="_blank" rel="noopener noreferrer">
          X
        </a>
        ,{' '}
        <a href="https://github.com/mrdoob" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        ), followed by hundreds of awesome developers, one of which being Sunag (
        <a href="https://x.com/sea3dformat" target="_blank" rel="noopener noreferrer">
          X
        </a>
        ,{' '}
        <a href="https://github.com/sunag" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        ) who added{' '}
        <a
          href="https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language"
          target="_blank"
          rel="noopener noreferrer"
        >
          TSL
        </a>
        , enabling the use of both WebGL and WebGPU, making this portfolio possible.
      </p>
      <h2 className="title">Three.js Journey</h2>
      <p className="text">
        If you want to learn Three.js, I got you covered with this{' '}
        <a href="https://threejs-journey.com" target="_blank" rel="noopener noreferrer">
          huge course
        </a>
        . <br />
        It contains everything you need to start building awesome stuff with Three.js (and much more).
      </p>
      <h2 className="title">Devlogs</h2>
      <p className="text">
        I’ve been making devlogs since the very start of this portfolio and you can find them all on my{' '}
        <a
          href="https://www.youtube.com/playlist?list=PL5nApUt6Z8sTZxEsEMd8x89OCKCAAfNL0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Youtube channel
        </a>
        .
      </p>
      <h2 className="title">Source code</h2>
      <p className="text">
        The code is available on{' '}
        <a href="https://github.com/brunosimon/folio-2025" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>{' '}
        under{' '}
        <a href="https://choosealicense.com/licenses/mit/" target="_blank" rel="noopener noreferrer">
          MIT license
        </a>
        . Even the Blender files are there, so have fun! <br />
        For security reasons, I’m not sharing the server code, but the portfolio works without it.
      </p>
      <h2 className="title">Musics</h2>
      <p className="text">
        The music you hear was made especially for this portfolio by the awesome Kounine (
        <a href="https://linktr.ee/Kounine" target="_blank" rel="noopener noreferrer">
          Linktree
        </a>
        ). <br />
        They are now under{' '}
        <a href="https://choosealicense.com/licenses/cc0-1.0/" target="_blank" rel="noopener noreferrer">
          CC0 license
        </a>
        , meaning you can do whatever you want with them! <br />
        Download them{' '}
        <a
          href="https://github.com/brunosimon/folio-2025/tree/main/static/sounds/musics"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </p>
      <h2 className="title">Some more links</h2>
      <ul className="text">
        <li>
          Physics library ⇒{' '}
          <a href="https://rapier.rs" target="_blank" rel="noopener noreferrer">
            Rapier
          </a>
        </li>
        <li>
          Audio library ⇒{' '}
          <a href="https://howlerjs.com" target="_blank" rel="noopener noreferrer">
            Howler.js
          </a>
        </li>
        <li>
          Fonts ⇒{' '}
          <a href="https://fonts.google.com/specimen/Amatic+SC" target="_blank" rel="noopener noreferrer">
            Amatic SC
          </a>{' '}
          &{' '}
          <a href="https://fonts.google.com/specimen/Nunito?query=Nunito" target="_blank" rel="noopener noreferrer">
            Nunito
          </a>
        </li>
      </ul>
      <p className="text text-faded text-align-right">— Bruno</p>
    </div>
  );
}
