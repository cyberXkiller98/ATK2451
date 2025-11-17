<!--
  Amazing Spider-Man — Fan Site (single-file)
  - Одностраничный HTML/CSS/JS
  - Фан-страница (не официальная)
  - Скопируйте и сохраните как .html, откройте в браузере
-->

<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Amazing Spider‑Man — Fan Page</title>
  <meta name="description" content="Фан‑страница в стиле Amazing Spider‑Man — герой, галерея, трейлер и стильный дизайн." />

  <!-- Google Font -->
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;700;900&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg:#071029; /* ночной синий */
      --card:#0b1220;
      --accent:#d21f26; /* паучий красный */
      --muted:#9fb0c8;
      --glass: rgba(255,255,255,0.04);
      --radius:14px;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;font-family:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto, 'Helvetica Neue',Arial;
      background: radial-gradient(1200px 600px at 10% 10%, rgba(210,31,38,0.06), transparent),
                  radial-gradient(800px 400px at 90% 90%, rgba(7,16,41,0.6), transparent),
                  var(--bg);
      color:#e7f0f8; -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
      padding:24px;
    }

    /* animated subtle web mesh */
    .web-bg{
      position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.12;
      background-image:
        radial-gradient(circle at 10% 10%, rgba(255,255,255,0.02) 0, transparent 30%),
        linear-gradient(transparent 30%, rgba(0,0,0,0.05));
      mask-image: repeating-linear-gradient(45deg, rgba(0,0,0,1) 0 1px, transparent 1px 18px);
      transform: rotate(0deg);
      animation: spin 60s linear infinite;
    }
    @keyframes spin{from{transform:rotate(0deg)} to{transform:rotate(360deg)}}

    .container{position:relative;z-index:2;max-width:1100px;margin:0 auto}

    header{display:flex;align-items:center;gap:18px}
    .logo{display:flex;gap:14px;align-items:center}
    .logo .badge{width:72px;height:72px;display:grid;place-items:center;background:linear-gradient(180deg,#2b3a5b,#081129);border-radius:16px;box-shadow:0 6px 30px rgba(0,0,0,0.6);}

    /* Spider SVG inside badge */
    .site-title{font-weight:900;letter-spacing:1px}
    .site-sub{font-size:13px;color:var(--muted);margin-top:2px}

    .hero{display:grid;grid-template-columns:1fr 420px;margin-top:28px;gap:28px;align-items:center}
    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), transparent);border-radius:var(--radius);padding:20px;box-shadow:0 8px 30px rgba(0,0,0,0.6);}

    .intro h1{font-size:40px;margin:0 0 8px 0}
    .intro p{color:var(--muted);margin:0 0 18px 0;line-height:1.45}

    .cta{display:flex;gap:12px}
    .btn{padding:10px 16px;border-radius:10px;border:0;background:var(--accent);color:white;font-weight:700;cursor:pointer}
    .btn.secondary{background:transparent;border:1px solid rgba(255,255,255,0.06);color:var(--muted);font-weight:600}

    /* film-card on right */
    .info{display:flex;flex-direction:column;gap:12px}
    .poster{height:260px;border-radius:12px;background:linear-gradient(180deg,#081028,#121826);display:grid;place-items:center;overflow:hidden;position:relative}
    .poster .fake-shot{font-size:12px;color:var(--muted)}

    /* gallery */
    .section{margin-top:28px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    .thumb{height:160px;border-radius:12px;background:var(--card);display:flex;align-items:flex-end;padding:12px}
    .meta{font-size:13px;color:var(--muted)}

    footer{margin-top:40px;color:var(--muted);font-size:13px;text-align:center}

    /* responsive */
    @media (max-width:980px){
      .hero{grid-template-columns:1fr}
      .grid{grid-template-columns:repeat(2,1fr)}
    }
    @media (max-width:560px){
      .grid{grid-template-columns:1fr}
      .logo .badge{width:56px;height:56px}
      .intro h1{font-size:28px}
    }

    /* subtle hover effects */
    .thumb:hover{transform:translateY(-6px);transition:transform .28s}

    /* spider animation */
    .spider{width:64px;height:64px}
    .spider svg{width:100%;height:100%}
    .spin-leg{transform-origin:50% 50%;animation:leg 2.2s ease-in-out infinite}
    @keyframes leg{0%{transform:rotate(0deg)}50%{transform:rotate(6deg)}100%{transform:rotate(0deg)}}

    /* translucent glass overlay on poster */
    .glass{position:absolute;inset:10px;border-radius:10px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));backdrop-filter: blur(6px)}
  </style>
</head>
<body>
  <div class="web-bg" aria-hidden="true"></div>

  <div class="container">
    <header>
      <div class="logo">
        <div class="badge card">
          <!-- simple spider SVG (fan-made) -->
          <div class="spider" aria-hidden="true">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="spider logo">
              <g fill="none" stroke="white" stroke-width="3" stroke-linecap="round">
                <path d="M50 40 L50 70" />
                <path d="M50 45 C40 55 30 60 20 58" class="spin-leg"/>
                <path d="M50 45 C60 55 70 60 80 58" class="spin-leg"/>
                <path d="M50 52 C38 68 28 78 20 80"/>
                <path d="M50 52 C62 68 72 78 80 80"/>
                <circle cx="50" cy="33" r="6" fill="white" />
              </g>
            </svg>
          </div>
        </div>
        <div>
          <div class="site-title">AMAZING SPIDER‑MAN — Fan</div>
          <div class="site-sub">Фан‑сайт. Дизайн вдохновлён атмосферой комиксов и фильмов.</div>
        </div>
      </div>

      <nav style="margin-left:auto;color:var(--muted);font-weight:600">
        <span style="margin-right:14px">Home</span>
        <span style="margin-right:14px">Gallery</span>
        <span>About</span>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="intro card">
          <h1>Защитник с паутиной и чувством справедливости</h1>
          <p>Это фан‑страница, сочетающая элементы комиксов и кино: смелые цвета, паучьи мотивы и динамичная типографика. Скопируйте эту страницу, добавьте свои изображения и тексты.</p>

          <div class="cta">
            <button class="btn" onclick="scrollToSection('gallery')">Посмотреть галерею</button>
            <button class="btn secondary" onclick="openTrailer()">Смотреть трейлер</button>
          </div>

          <div style="margin-top:18px;color:var(--muted);font-size:13px">Fan‑made — не официальный сайт.</div>
        </div>

        <aside class="card info">
          <div class="poster">
            <div class="glass"></div>
            <div style="z-index:2;position:relative;text-align:center;padding:18px">
              <h3 style="margin:0 0 6px 0">The Amazing Look</h3>
              <div class="fake-shot">Промо‑постер (замените на своё изображение)</div>
            </div>
          </div>

          <div style="display:flex;gap:10px;align-items:center">
            <div style="flex:1">
              <div style="font-weight:700">Питер Паркер</div>
              <div style="color:var(--muted);font-size:13px">Ученик, фотограф и ночной защитник города</div>
            </div>
            <div style="text-align:right;color:var(--muted)">⭐ 8.3</div>
          </div>
        </aside>
      </section>

      <section id="gallery" class="section">
        <h2 style="margin:0 0 12px 0">Галерея</h2>
        <div class="grid">
          <div class="thumb card"><div style="width:100%"><div style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:8px"><div class="meta">Динамический кадр #1</div></div></div></div>
          <div class="thumb card"><div style="width:100%"><div style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:8px"><div class="meta">Динамический кадр #2</div></div></div></div>
          <div class="thumb card"><div style="width:100%"><div style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:8px"><div class="meta">Динамический кадр #3</div></div></div></div>
        </div>
      </section>

      <section class="section card">
        <h3 style="margin-top:0">О персонаже</h3>
        <p style="color:var(--muted);margin:0">Коротко: смелый, остроумный и ответственный. Эта секция — пример: замените текст, добавьте биографию, фильмографию и ссылки.</p>
      </section>

      <section class="section card">
        <h3 style="margin-top:0">Трейлер</h3>
        <div style="position:relative;padding-top:56.25%">
          <!-- placeholder embed: замените src на реальный трейлер если хотите -->
          <iframe id="trailer" style="position:absolute;inset:0;border:0;border-radius:10px" src="about:blank" allowfullscreen title="trailer"></iframe>
        </div>
      </section>

    </main>

    <footer>
      Сделано любителем — используйте эту страницу как основу и настраивайте под себя.
    </footer>
  </div>

  <script>
    function scrollToSection(id){
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
    }
    function openTrailer(){
      // здесь можно подставить ссылку на YouTube или локальный файл
      const iframe = document.getElementById('trailer');
      iframe.src = 'https://www.youtube.com/embed/ScMzIvxBSi4?rel=0'; // примерный видео id, замените при желании
      iframe.focus();
      iframe.scrollIntoView({behavior:'smooth'});
    }
  </script>

</body>
</html>
