/* ═══════════════════════════════════════════════════
   CURSOR.JS  —  Season-Aware Canvas Trail
   Reads window.CURRENT_SEASON to decide what to draw.
   Seasons: 'default' | 'spring' | 'summer' | 'monsoon'
           | 'autumn' | 'winter' | 'golden'
═══════════════════════════════════════════════════ */

(function () {

  /* Skip on touch devices */
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouch) return;

  /* ── Canvas setup ── */
  const canvas = document.getElementById('cursorCanvas');
  const ctx    = canvas.getContext('2d');
  const dot    = document.getElementById('cdot');
  const ring   = document.getElementById('cring');

  function resize () {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Mouse tracking ── */
  let mx = -200, my = -200;
  let ringX = -200, ringY = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  /* ── Hover state ── */
  document.querySelectorAll('a, button, .seacard, .scard, .ecard, .stcard, .chip, .nbtn, .btnP, .btnO').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
  });

  /* ── Trail particle pool ── */
  const POOL_SIZE = 280;
  const trail = [];   // active particles
  let   frame = 0;

  /* ════════════════════════════════════════
     PARTICLE FACTORIES — one per season
  ════════════════════════════════════════ */

  const factories = {

    /* ── DEFAULT  pastel dots ── */
    default (x, y) {
      const cols = ['#CDBADB','#FFC6DD','#FFAECC','#BDE0FE','#A2D2FF'];
      return { x, y, vx:(Math.random()-.5)*1.2, vy:-1-Math.random()*1.5,
        size: 4+Math.random()*7, color: cols[Math.floor(Math.random()*cols.length)],
        life:0, maxLife:38+Math.random()*20, type:'dot', rot:0, rotSpeed:0 };
    },

    /* ── SPRING  cherry-blossom petals ── */
    spring (x, y) {
      const cols = ['#FFAECC','#FFC6DD','#CDBADB','#ff9eb5','#ffd6e8','#e8b4ff'];
      return { x, y, vx:(Math.random()-.5)*2, vy:-0.8-Math.random()*1.5,
        size: 7+Math.random()*11, color: cols[Math.floor(Math.random()*cols.length)],
        life:0, maxLife:55+Math.random()*30, type:'petal',
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.12,
        wobble:Math.random()*Math.PI*2, wobbleSpeed:0.05+Math.random()*0.05 };
    },

    /* ── SUMMER  mini suns / sparkle rays ── */
    summer (x, y) {
      const cols = ['#ffe082','#ffb300','#fff176','#ff8f00','#ffecb3','#fffde7'];
      return { x, y, vx:(Math.random()-.5)*1.5, vy:-1.2-Math.random()*1.8,
        size: 6+Math.random()*9, color: cols[Math.floor(Math.random()*cols.length)],
        life:0, maxLife:45+Math.random()*25, type: Math.random()>.4?'sun':'star',
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.1, rays:5+Math.floor(Math.random()*3) };
    },

    /* ── MONSOON  raindrops + tiny rainbow arcs ── */
    monsoon (x, y) {
      const isRainbow = Math.random() > 0.6;
      return { x, y, vx:(Math.random()-.5)*1.2, vy: isRainbow ? -1.5-Math.random() : 2+Math.random()*3,
        size: isRainbow ? 18+Math.random()*14 : 3+Math.random()*5,
        life:0, maxLife: isRainbow ? 60+Math.random()*25 : 25+Math.random()*15,
        type: isRainbow ? 'rainbow' : 'drop',
        rot:Math.random()*Math.PI*2, angle: -0.2+Math.random()*0.1 };
    },

    /* ── AUTUMN  falling leaves ── */
    autumn (x, y) {
      const cols = ['#e65100','#f57c00','#ff8f00','#d84315','#bf360c','#ffb74d','#a5462a','#c62828'];
      return { x, y, vx:(Math.random()-.5)*1.5, vy:0.5+Math.random()*1.8,
        size:9+Math.random()*13, color: cols[Math.floor(Math.random()*cols.length)],
        life:0, maxLife:70+Math.random()*40, type:'leaf',
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.1,
        wobble:Math.random()*Math.PI*2, wobbleSpeed:0.03+Math.random()*0.03 };
    },

    /* ── WINTER  snowflakes ── */
    winter (x, y) {
      const isCrystal = Math.random() > 0.45;
      return { x, y, vx:(Math.random()-.5)*0.8, vy:0.6+Math.random()*1.6,
        size: isCrystal ? 8+Math.random()*14 : 3+Math.random()*6,
        life:0, maxLife:80+Math.random()*45, type: isCrystal ? 'snowflake' : 'circle',
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.025,
        wobble:Math.random()*Math.PI*2, wobbleSpeed:0.025+Math.random()*0.025 };
    },

    /* ── GOLDEN  sparkle stars + pastel orbs ── */
    golden (x, y) {
      const cols = ['#FFAECC','#CDBADB','#A2D2FF','#fff176','#ce93d8','#80deea','#ffb74d'];
      return { x, y, vx:(Math.random()-.5)*1.8, vy:-0.8-Math.random()*2.2,
        size:5+Math.random()*11, color: cols[Math.floor(Math.random()*cols.length)],
        life:0, maxLife:50+Math.random()*35, type: Math.random()>.5?'star':'orb',
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.12 };
    }
  };

  /* ════════════════════════════════════════
     PARTICLE DRAWERS  — one per type
  ════════════════════════════════════════ */

  function drawPetal (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size*.4, p.size*.75, 0, 0, Math.PI*2);
    ctx.fill();
    // Inner shimmer
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-p.size*.1, -p.size*.2, p.size*.12, p.size*.28, -.4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function drawSun (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha;
    // Core
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(0, 0, p.size*.5, 0, Math.PI*2); ctx.fill();
    // Rays
    ctx.strokeStyle = p.color; ctx.lineWidth = p.size*.12; ctx.lineCap = 'round';
    for (let i=0;i<p.rays;i++) {
      const a = (i/p.rays)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*p.size*.65, Math.sin(a)*p.size*.65);
      ctx.lineTo(Math.cos(a)*p.size*1.15, Math.sin(a)*p.size*1.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStar5 (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    for (let i=0;i<5;i++) {
      const a = i*Math.PI*2/5 - Math.PI/2;
      const ai= (i+.5)*Math.PI*2/5 - Math.PI/2;
      i===0 ? ctx.moveTo(Math.cos(a)*p.size, Math.sin(a)*p.size) : ctx.lineTo(Math.cos(a)*p.size, Math.sin(a)*p.size);
      ctx.lineTo(Math.cos(ai)*p.size*.42, Math.sin(ai)*p.size*.42);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawRainbow (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.globalAlpha = alpha * .9;
    const rbCols = [
      'rgba(255,80,80,1)','rgba(255,165,0,1)','rgba(255,235,0,1)',
      'rgba(0,200,80,1)','rgba(0,150,255,1)','rgba(75,0,180,1)','rgba(180,0,220,1)'
    ];
    rbCols.forEach((c, i) => {
      const r = p.size + i * 3;
      ctx.strokeStyle = c; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.stroke();
    });
    ctx.restore();
  }

  function drawDrop (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.angle || -.18); ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(130,190,255,0.85)';
    ctx.lineWidth = p.size*.28; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -p.size); ctx.lineTo(0, p.size);
    ctx.stroke();
    ctx.restore();
  }

  function drawLeaf (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo( p.size*.6, -p.size*.5,  p.size*.7, p.size*.3, 0, p.size);
    ctx.bezierCurveTo(-p.size*.7,  p.size*.3, -p.size*.6,-p.size*.5, 0,-p.size);
    ctx.fill();
    // Vein
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = .9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0,-p.size*.8); ctx.lineTo(0,p.size*.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-p.size*.2); ctx.lineTo( p.size*.4, p.size*.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p.size*.1); ctx.lineTo(-p.size*.35, p.size*.5); ctx.stroke();
    ctx.restore();
  }

  function drawSnowflake (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(180,225,255,0.95)';
    ctx.lineWidth = Math.max(.8, p.size*.1); ctx.lineCap = 'round';
    for (let i=0;i<6;i++) {
      ctx.save(); ctx.rotate(i*Math.PI/3);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-p.size); ctx.stroke();
      // Branches
      const b1=p.size*.45, b2=p.size*.7;
      ctx.beginPath(); ctx.moveTo(0,-b1); ctx.lineTo(-p.size*.2,-b1-p.size*.18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-b1); ctx.lineTo( p.size*.2,-b1-p.size*.18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-b2); ctx.lineTo(-p.size*.15,-b2-p.size*.14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-b2); ctx.lineTo( p.size*.15,-b2-p.size*.14); ctx.stroke();
      ctx.restore();
    }
    // Centre dot
    ctx.fillStyle = 'rgba(220,240,255,0.9)';
    ctx.beginPath(); ctx.arc(0,0,p.size*.12,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawOrb (ctx, p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(0,0,0,0,0,p.size);
    g.addColorStop(0, p.color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0,0,p.size,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* ════════════════════════════════════════
     MAIN DRAW ROUTER
  ════════════════════════════════════════ */
  function drawParticle (p) {
    const prog  = p.life / p.maxLife;
    const alpha = prog < .15 ? prog/.15 : prog > .75 ? (1-prog)/.25 : 1;
    if (alpha <= 0) return;

    switch (p.type) {
      case 'dot':       drawOrb(ctx, p, alpha * .75);       break;
      case 'petal':     drawPetal(ctx, p, alpha);           break;
      case 'sun':       drawSun(ctx, p, alpha);             break;
      case 'star':      drawStar5(ctx, p, alpha);           break;
      case 'rainbow':   drawRainbow(ctx, p, alpha);         break;
      case 'drop':      drawDrop(ctx, p, alpha);            break;
      case 'leaf':      drawLeaf(ctx, p, alpha);            break;
      case 'snowflake': drawSnowflake(ctx, p, alpha);       break;
      case 'circle':    /* tiny snow dot */
        ctx.save(); ctx.translate(p.x,p.y); ctx.globalAlpha=alpha*.8;
        ctx.fillStyle='rgba(200,235,255,0.9)';
        ctx.beginPath(); ctx.arc(0,0,p.size,0,Math.PI*2); ctx.fill();
        ctx.restore(); break;
      case 'orb':       drawOrb(ctx, p, alpha);             break;
    }
  }

  /* ════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════ */
  function updateParticle (p) {
    p.life++;
    // Season-specific physics
    switch (p.type) {
      case 'petal':
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.9;
        p.y += p.vy + Math.sin(p.wobble*.7) * 0.4;
        p.rot += p.rotSpeed;
        break;
      case 'leaf':
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.1;
        p.y += p.vy;
        p.rot += p.rotSpeed + Math.cos(p.wobble) * .02;
        break;
      case 'snowflake':
      case 'circle':
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * .55;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        break;
      case 'drop':
        p.x += p.vx; p.y += p.vy;
        break;
      case 'rainbow':
        p.x += p.vx; p.y += p.vy;
        p.size += .08; // grows as it fades
        break;
      case 'sun': case 'star':
        p.x += p.vx; p.y += p.vy;
        p.rot += p.rotSpeed;
        break;
      default:
        p.x += p.vx; p.y += p.vy;
        p.vy -= .03; // slight float for orbs
    }
  }

  /* ════════════════════════════════════════
     SPAWN THROTTLING
  ════════════════════════════════════════ */
  let spawnEvery = 2; // frames between spawns

  function currentSeason () {
    return (window.CURRENT_SEASON || 'default');
  }

  /* ════════════════════════════════════════
     MAIN ANIMATION LOOP
  ════════════════════════════════════════ */
  let lastMX = -999, lastMY = -999;

  function loop () {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Smooth ring follow
    ringX += (mx - ringX) * .14;
    ringY += (my - ringY) * .14;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';

    // Spawn when mouse moved enough
    const dist = Math.hypot(mx-lastMX, my-lastMY);
    const season = currentSeason();

    // Spawn rate varies by season
    spawnEvery = { spring:1, summer:2, monsoon:1, autumn:1, winter:1, golden:1, default:3 }[season] || 2;
    const spawnCount = { spring:2, summer:1, monsoon:2, autumn:2, winter:2, golden:2, default:1 }[season] || 1;

    if (frame % spawnEvery === 0 && dist > 2 && trail.length < POOL_SIZE) {
      const factory = factories[season] || factories.default;
      for (let i = 0; i < spawnCount; i++) {
        // Slight jitter around cursor
        const ox = (Math.random()-.5)*8, oy = (Math.random()-.5)*8;
        trail.push(factory(mx+ox, my+oy));
      }
      lastMX = mx; lastMY = my;
    }

    // Update + draw
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      updateParticle(p);
      drawParticle(p);
      if (p.life >= p.maxLife) trail.splice(i, 1);
    }

    requestAnimationFrame(loop);
  }

  loop();

  /* ── Expose season setter for gallery.js ── */
  window.setCursorSeason = function (season) {
    window.CURRENT_SEASON = season;
    // Update body class for ring/dot colour
    document.body.className = document.body.className
      .replace(/season-\w+/g, '').trim();
    if (season && season !== 'default') {
      document.body.classList.add('season-' + season);
    }
  };

})();
