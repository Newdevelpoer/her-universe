/* ═══════════════════════════════════════════════════
   GALLERY.JS  —  Season expand / nav / upload trigger
   All buttons wired via addEventListener (no onclick)
═══════════════════════════════════════════════════ */
(function () {

  const SEASONS = [
    { id:'spring',  num:'01 / 06', name:'Spring Whispers',   sub:'Soft · Tender · Full of Promise',            count:33, acc:'linear-gradient(90deg,#FFC6DD,#FFAECC)', emoji:'🌸🌷🦋', hero:'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=1600&h=700&fit=crop&q=80' },
    { id:'summer',  num:'02 / 06', name:'Summer Radiance',   sub:'Warm · Luminous · Sun-kissed',               count:34, acc:'linear-gradient(90deg,#ffe066,#ff9640)',   emoji:'☀️🌻🌈', hero:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1600&h=700&fit=crop&q=80' },
    { id:'monsoon', num:'03 / 06', name:'Monsoon Romance',   sub:'Dreamy · Petrichor · Magic in the Rain',     count:33, acc:'linear-gradient(90deg,#BDE0FE,#A2D2FF)',   emoji:'🌧️🌈🍃', hero:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1600&h=700&fit=crop&q=80' },
    { id:'autumn',  num:'04 / 06', name:'Autumn Grace',      sub:'Golden · Transitions · Breathtaking',        count:34, acc:'linear-gradient(90deg,#ffb347,#e8643a)',   emoji:'🍂🍁🌾', hero:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600&h=700&fit=crop&q=80' },
    { id:'winter',  num:'05 / 06', name:'Winter Glow',       sub:'Still · Warmth in Cold · She is the Light',  count:33, acc:'linear-gradient(90deg,#A2D2FF,#e0f4ff)',  emoji:'❄️⛄🌨️', hero:'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=1600&h=700&fit=crop&q=80' },
    { id:'golden',  num:'06 / 06', name:'Golden Hour',       sub:'Perfect Light · Her Magic Hour · Always',    count:33, acc:'linear-gradient(90deg,#FFAECC,#CDBADB,#A2D2FF)', emoji:'✨🌅💛', hero:'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=1600&h=700&fit=crop&q=80' }
  ];

  const IMG_POOLS = [
    ['1522748906645-95d8adfd52c7','1508214751196-bcfd4ca60f91','1544005313-94ddf0286df2','1531746020798-e6953c6e8e04','1504703395950-b89145a5425b','1520813792240-56fc4a3765a7','1479936343636-da5ba14acdc4','1487412947147-5cebf100ffc2','1438761681033-6461ffad8d80','1502823403499-6ccfcf4fb453','1529626455594-4ff0802cfb7e','1484588168347-9d835bb09939','1499750310107-5fef28a66643','1490750967868-88df5691cc5e','1523049673857-eb18f1d7b578','1494790108377-be9c29b29330','1517841905240-472988babdf9','1469785952596-eee8a6aab08f','1488426862026-3ee34a7d66df','1524504388940-b1c1722653e1'],
    ['1508214751196-bcfd4ca60f91','1520813792240-56fc4a3765a7','1531746020798-e6953c6e8e04','1544005313-94ddf0286df2','1490750967868-88df5691cc5e','1522748906645-95d8adfd52c7','1494790108377-be9c29b29330','1517841905240-472988babdf9','1469785952596-eee8a6aab08f','1488426862026-3ee34a7d66df','1524504388940-b1c1722653e1','1523049673857-eb18f1d7b578','1479936343636-da5ba14acdc4','1487412947147-5cebf100ffc2','1438761681033-6461ffad8d80','1502823403499-6ccfcf4fb453','1529626455594-4ff0802cfb7e','1484588168347-9d835bb09939','1499750310107-5fef28a66643','1467003909585-2f8a72700288'],
    ['1544005313-94ddf0286df2','1484588168347-9d835bb09939','1469785952596-eee8a6aab08f','1508214751196-bcfd4ca60f91','1502823403499-6ccfcf4fb453','1529626455594-4ff0802cfb7e','1499750310107-5fef28a66643','1523049673857-eb18f1d7b578','1494790108377-be9c29b29330','1517841905240-472988babdf9','1488426862026-3ee34a7d66df','1524504388940-b1c1722653e1','1520813792240-56fc4a3765a7','1531746020798-e6953c6e8e04','1504703395950-b89145a5425b','1522748906645-95d8adfd52c7','1479936343636-da5ba14acdc4','1487412947147-5cebf100ffc2','1438761681033-6461ffad8d80','1467003909585-2f8a72700288'],
    ['1531746020798-e6953c6e8e04','1479936343636-da5ba14acdc4','1487412947147-5cebf100ffc2','1438761681033-6461ffad8d80','1520813792240-56fc4a3765a7','1544005313-94ddf0286df2','1469785952596-eee8a6aab08f','1508214751196-bcfd4ca60f91','1502823403499-6ccfcf4fb453','1490750967868-88df5691cc5e','1529626455594-4ff0802cfb7e','1499750310107-5fef28a66643','1523049673857-eb18f1d7b578','1494790108377-be9c29b29330','1517841905240-472988babdf9','1488426862026-3ee34a7d66df','1524504388940-b1c1722653e1','1467003909585-2f8a72700288','1484588168347-9d835bb09939','1504703395950-b89145a5425b'],
    ['1504703395950-b89145a5425b','1488426862026-3ee34a7d66df','1524504388940-b1c1722653e1','1467003909585-2f8a72700288','1531746020798-e6953c6e8e04','1479936343636-da5ba14acdc4','1487412947147-5cebf100ffc2','1438761681033-6461ffad8d80','1520813792240-56fc4a3765a7','1544005313-94ddf0286df2','1469785952596-eee8a6aab08f','1508214751196-bcfd4ca60f91','1502823403499-6ccfcf4fb453','1490750967868-88df5691cc5e','1529626455594-4ff0802cfb7e','1499750310107-5fef28a66643','1523049673857-eb18f1d7b578','1494790108377-be9c29b29330','1517841905240-472988babdf9','1484588168347-9d835bb09939'],
    ['1520813792240-56fc4a3765a7','1523049673857-eb18f1d7b578','1494790108377-be9c29b29330','1517841905240-472988babdf9','1504703395950-b89145a5425b','1488426862026-3ee34a7d66df','1524504388940-b1c1722653e1','1467003909585-2f8a72700288','1531746020798-e6953c6e8e04','1479936343636-da5ba14acdc4','1487412947147-5cebf100ffc2','1438761681033-6461ffad8d80','1544005313-94ddf0286df2','1469785952596-eee8a6aab08f','1508214751196-bcfd4ca60f91','1502823403499-6ccfcf4fb453','1490750967868-88df5691cc5e','1529626455594-4ff0802cfb7e','1499750310107-5fef28a66643','1484588168347-9d835bb09939']
  ];

  const HEIGHTS = [320,420,360,280,450,310,390,260,410,340,380,300];

  let curS = -1;
  let overlayEl, seasonCanvas, expView;

  /* ── Build expanded view ── */
  function buildExpanded(idx) {
    const s = SEASONS[idx];

    document.getElementById('enum').textContent      = s.num;
    document.getElementById('ename').textContent     = s.name;
    document.getElementById('emeta').textContent     = s.count + ' photographs';
    document.getElementById('ehimg').src             = s.hero;
    document.getElementById('ebigtitle').textContent = s.name;
    document.getElementById('esub').textContent      = s.sub;
    document.getElementById('ebar').style.background = s.acc;

    // Wire the header upload button for the current season
    const upBtn = document.getElementById('exp-upload-btn');
    if (upBtn) {
      upBtn._season = s.id;
      // remove old listener before adding new one
      const newBtn = upBtn.cloneNode(true);
      upBtn.parentNode.replaceChild(newBtn, upBtn);
      newBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.UploadManager) UploadManager.openForSeason(s.id);
      });
    }

    // Prev/Next thumbnails
    const ps = SEASONS[(idx - 1 + SEASONS.length) % SEASONS.length];
    const ns = SEASONS[(idx + 1) % SEASONS.length];
    const pt = document.getElementById('pthmb');
    const nt = document.getElementById('nthmb');
    if (pt) pt.src = ps.hero.replace('1600','160').replace('700','90');
    if (nt) nt.src = ns.hero.replace('1600','160').replace('700','90');

    // Build stock photo masonry
    const grid = document.getElementById('ephotos');
    grid.innerHTML = '';
    const pool = IMG_POOLS[idx];
    for (let i = 0; i < s.count; i++) {
      const photoId = pool[i % pool.length];
      const h       = HEIGHTS[i % HEIGHTS.length];
      const div     = document.createElement('div');
      div.className = 'pitem';
      div.innerHTML =
        '<img src="https://images.unsplash.com/photo-' + photoId + '?w=420&h=' + h + '&fit=crop&q=72" alt="Photo ' + (i + 1) + '" loading="lazy">'
        + '<div class="pnum"><span class="pnumtxt">' + String(i + 1).padStart(2, '0') + '</span></div>';
      grid.appendChild(div);
    }

    // Show the expanded panel
    expView.classList.add('open');
    expView.scrollTop = 0;
    document.body.style.overflow = 'hidden';

    // Stagger photo reveal via IntersectionObserver
    setTimeout(function() {
      document.body.style.overflow = '';
      expView.style.overflowY = 'auto';
      const items = grid.querySelectorAll('.pitem');
      const pio = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            e.target.classList.add('show');
            pio.unobserve(e.target);
          }
        });
      }, { root: expView, rootMargin: '0px 0px 200px 0px', threshold: 0.01 });
      items.forEach(function(it, i) {
        it.style.transitionDelay = Math.min(i * 0.035, 0.55) + 's';
        pio.observe(it);
      });
    }, 80);

    // Load user-uploaded photos for this season
    if (window.UploadManager) UploadManager.loadUserPhotos(s.id, expView);

    history.pushState(null, '', '#' + s.id);
    if (window.setCursorSeason) window.setCursorSeason(s.id);
  }

  /* ── Open a season (with canvas transition) ── */
  function openS(idx) {
    curS = idx;
    const s = SEASONS[idx];
    overlayEl.querySelector('.ov-num').textContent   = s.num;
    overlayEl.querySelector('.ov-name').textContent  = s.name;
    overlayEl.querySelector('.ov-emoji').textContent = s.emoji;
    SeasonAnimator.cancel();
    SeasonAnimator.play(s.id, overlayEl, function() { buildExpanded(idx); });
  }

  /* ── Close expanded view ── */
  function closeExp() {
    expView.style.opacity = '0';
    expView.style.transform = 'translateY(20px)';
    expView.style.transition = 'opacity .3s, transform .3s';
    setTimeout(function() {
      expView.classList.remove('open');
      expView.style.cssText = '';
      history.pushState(null, '', location.pathname);
    }, 300);
    curS = -1;
    if (window.setCursorSeason) window.setCursorSeason('default');
  }

  /* ── Navigate between seasons ── */
  function navS(d) {
    expView.style.opacity = '0';
    expView.style.transform = 'translateY(25px)';
    expView.style.transition = 'opacity .3s, transform .3s';
    setTimeout(function() {
      expView.classList.remove('open');
      expView.style.cssText = '';
      document.getElementById('ephotos').innerHTML = '';

      curS = (curS + d + SEASONS.length) % SEASONS.length;
      const s = SEASONS[curS];
      overlayEl.querySelector('.ov-num').textContent   = s.num;
      overlayEl.querySelector('.ov-name').textContent  = s.name;
      overlayEl.querySelector('.ov-emoji').textContent = s.emoji;
      SeasonAnimator.cancel();
      SeasonAnimator.play(s.id, overlayEl, function() { buildExpanded(curS); });
    }, 300);
  }

  /* ── Hamburger nav ── */
  function initNav() {
    const ham = document.getElementById('navHam');
    const drawer = document.getElementById('navDrawer');
    if (!ham || !drawer) return;

    ham.addEventListener('click', function() {
      const isOpen = drawer.classList.toggle('open');
      ham.classList.toggle('open', isOpen);
      ham.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close drawer when a link is clicked
    drawer.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        drawer.classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function() {
    overlayEl    = document.getElementById('seasonOverlay');
    seasonCanvas = document.getElementById('seasonCanvas');
    expView      = document.getElementById('expv');

    SeasonAnimator.init(seasonCanvas);
    initNav();

    // ── Wire Explore buttons (IDs: explore0..explore5) ──
    for (let i = 0; i < 6; i++) {
      (function(idx) {
        const btn = document.getElementById('explore' + idx);
        if (btn) btn.addEventListener('click', function(e) { e.stopPropagation(); openS(idx); });

        // Also make cardimg clickable
        const img = document.getElementById('img' + idx);
        if (img) img.addEventListener('click', function() { openS(idx); });

        // Wire upload buttons (IDs: upload0..upload5)
        const upBtn = document.getElementById('upload' + idx);
        if (upBtn) {
          upBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.UploadManager) UploadManager.openForSeason(SEASONS[idx].id);
          });
        }
      })(i);
    }

    // ── Wire expanded view buttons ──
    const closeBtn  = document.getElementById('closeExpBtn');
    const vallBtn   = document.getElementById('vallBtn');
    const prevBtn   = document.getElementById('sprev');
    const nextBtn   = document.getElementById('snext');

    if (closeBtn)  closeBtn.addEventListener('click',  closeExp);
    if (vallBtn)   vallBtn.addEventListener('click',   closeExp);
    if (prevBtn)   prevBtn.addEventListener('click',   function() { navS(-1); });
    if (nextBtn)   nextBtn.addEventListener('click',   function() { navS(1);  });

    // Expose globally (for deep-linking support)
    window._galleryOpenS = openS;

    // ── Deep-link via hash ──
    var h = location.hash.replace('#', '');
    if (h) {
      var i = SEASONS.findIndex(function(s) { return s.id === h; });
      if (i >= 0) openS(i);
    }

    // ── Keyboard navigation ──
    document.addEventListener('keydown', function(e) {
      if (!expView.classList.contains('open')) return;
      if (e.key === 'Escape')     closeExp();
      if (e.key === 'ArrowLeft')  navS(-1);
      if (e.key === 'ArrowRight') navS(1);
    });
  });

})();
