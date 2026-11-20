/* findheure · transitions plein écran vers la page « Thèmes »
   Une transition par famille de thèmes (feuille géante en automne, chauves-souris à Halloween, givre qui se brise en hiver…).
   Tout est en DOM direct, au-dessus de tout (même de l'heure). Les mouvements n'animent que transform / opacity
   (la carte graphique s'en charge) ; seules les « ouvertures en forme » (cœur, chauve-souris, cercle) redessinent un masque.
   FHTrans.play(id du thème, couleurs, onCover) : onCover() est appelé quand l'écran est entièrement couvert
   (c'est là qu'on affiche la page derrière), puis le décor de la transition s'en va en mouvement et la découvre. */
(function () {
  const T = 1400;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const ein = (x) => x * x * x, eout = (x) => 1 - Math.pow(1 - x, 3), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const cl = (x) => Math.max(0, Math.min(1, x));
  const mk = (css, parent, html) => { const e = document.createElement('div'); e.style.cssText = 'position:absolute;' + css; if (html) e.innerHTML = html; parent.appendChild(e); return e; };
  // élément carré de côté S centré dans l'écran
  const centered = (S, parent, html, extra) => mk(`left:50%;top:50%;width:${S}px;height:${S}px;margin:${-S / 2}px 0 0 ${-S / 2}px;will-change:transform${extra ? ';' + extra : ''}`, parent, html);
  // les images clés portent leur propre courbe : pas de courbe globale (elle fausserait les instants clés)
  const A = (el, frames, o) => el.animate(frames, { duration: T, fill: 'both', easing: 'linear', ...o });
  const svgBox = (vb, inner, par) => `<svg viewBox="${vb}" width="100%" height="100%" preserveAspectRatio="${par || 'xMidYMid meet'}" style="display:block;overflow:visible">${inner}</svg>`;
  let uid = 0; const gid = (p) => p + (++uid);
  // fond plein qui garantit que tout est couvert au bon moment (a = apparition, b = disparition, en fraction de T)
  const backdrop = (L, bg, a0, a1, b0, b1) => {
    const e = mk(`inset:0;background:${bg};opacity:0;will-change:opacity`, L);
    A(e, [{ offset: 0, opacity: 0 }, { offset: a0, opacity: 0, easing: 'ease-in-out' }, { offset: a1, opacity: 1 }, { offset: b0, opacity: 1, easing: 'ease-in-out' }, { offset: b1, opacity: 0 }, { offset: 1, opacity: 0 }]);
    return e;
  };
  // horloge de la transition : une animation invisible donne l'instant (marche aussi en pause, pour les tests image par image)
  const ticker = (L, fn) => {
    const drv = A(mk('left:0;top:0;width:1px;height:1px;opacity:0', L), [{ opacity: 0 }, { opacity: 0.01 }]);
    const step = () => { if (!L.isConnected) return; const f = cl((Number(drv.currentTime) || 0) / T); fn(f); if (f < 1 || drv.playState === 'paused') requestAnimationFrame(step); };
    fn(0); requestAnimationFrame(step);
  };
  // un voile plein percé d'une forme (cercle, cœur, chauve-souris…) qui grandit : la page apparaît par le trou
  // shape : chemin dans un carré −100…100 ; k(f) : demi-taille de la forme en pixels selon l'instant
  const hole = (L, W, H, o) => {
    const id = gid('fhm'), shape = o.path ? `<path d="${o.path}"/>` : '<circle r="100"/>';
    const ring = o.ring ? `<g class="hr" fill="none" stroke-linejoin="round">${o.path ? `<path d="${o.path}" stroke="${o.ring}" stroke-opacity=".35" stroke-width="${(o.ringW || 6) * 4}" vector-effect="non-scaling-stroke"/><path d="${o.path}" stroke="${o.ring}" stroke-width="${o.ringW || 6}" vector-effect="non-scaling-stroke"/>` : `<circle r="100" stroke="${o.ring}" stroke-opacity=".35" stroke-width="${(o.ringW || 6) * 4}" vector-effect="non-scaling-stroke"/><circle r="100" stroke="${o.ring}" stroke-width="${o.ringW || 6}" vector-effect="non-scaling-stroke"/>`}</g>` : '';
    const e = mk(`inset:0;opacity:0`, L, `<svg width="${W}" height="${H}" style="display:block"><defs>${o.defs || ''}<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><g class="hg" fill="#000">${shape}</g></mask></defs><rect width="${W}" height="${H}" fill="${o.fill}" mask="url(#${id})"/>${ring}</svg>`);
    const g = e.querySelector('.hg'), r = e.querySelector('.hr'), cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
    ticker(L, (f) => {
      const on = f >= o.from && f < o.to, half = on ? o.k(f) : 0;
      e.style.opacity = on ? '1' : '0';
      const tr = `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${o.rot ? o.rot(f).toFixed(2) : 0}) scale(${Math.max(0.0001, half / 100).toFixed(5)})`;
      g.setAttribute('transform', tr); if (r) { r.setAttribute('transform', tr); r.style.opacity = half < 2 ? '0' : '1'; }
    });
    return e;
  };

  // ---------- les transitions ----------
  const K = {};

  // ===== automne : une feuille arrive de loin en virevoltant, fonce vers l'écran, le couvre, puis s'envole =====
  const leafPath = (() => {
    const top = [], bot = [], N = 34;
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = -90 + 187 * u;
      let w = 60 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.9);
      if (i > 1 && i < N - 1) w += i % 2 ? 3.2 : -1.5; // petites dents
      top.push([x, -w]); bot.unshift([x, w]);
    }
    const pts = top.concat(bot);
    return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';
  })();
  const leafSvg = (c, vein, id) => {
    let veins = '';
    for (let i = 0; i < 7; i++) { const x = -62 + i * 22, len = 44 - Math.abs(i - 2.5) * 5; veins += `M${x} 0 Q${x + 14} ${-len * 0.55} ${x + 26} ${-len} M${x} 0 Q${x + 14} ${len * 0.55} ${x + 26} ${len} `; }
    return svgBox('-110 -100 210 200', `<defs><radialGradient id="${id}" cx=".46" cy=".5" r=".62"><stop offset="0" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset=".85" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3] || c[2]}"/></radialGradient></defs>
      <path d="M-88 0 Q-98 2 -106 10" stroke="${c[3] || c[2]}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="${leafPath}" fill="url(#${id})"/>
      <path d="${veins}" stroke="${vein}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>
      <path d="M-90 -1.8 L92 -.4 L92 .4 L-90 1.8 Z" fill="${vein}" opacity=".7"/>
      <g fill="${c[3] || c[2]}" opacity=".22"><circle cx="30" cy="-22" r="4"/><circle cx="36" cy="-16" r="2.4"/><circle cx="-30" cy="26" r="3.2"/><circle cx="58" cy="14" r="2.6"/><circle cx="-4" cy="-38" r="2"/></g>`);
  };
  K.leaf = (L, W, H, p) => {
    const D = Math.hypot(W, H), S = D * 2.5, P = S * 1.4;
    const cols = p.leaves || [['#ffd25a', '#f39a2b', '#d4561d', '#9e2f16'], ['#ffc04a', '#e8742a', '#b8361c', '#7d2412'], ['#fff07a', '#f6cf55', '#d98c1f', '#9a5a12']];
    const vein = p.vein || '#ffe6a8';
    const small = (i, delay, dur, from, to) => {
      const s = rnd(60, 150), e = mk(`left:0;top:0;width:${s}px;height:${s}px;will-change:transform`, L, leafSvg(pick(cols), vein, gid('lf')));
      A(e, [{ transform: `translate(${from[0]}px,${from[1]}px) rotate(${rnd(-90, 0)}deg) rotateX(0deg)` }, { offset: 0.5, transform: `translate(${(from[0] + to[0]) / 2}px,${(from[1] + to[1]) / 2 + rnd(-80, 80)}px) rotate(${rnd(90, 240)}deg) rotateX(${rnd(40, 70)}deg)` }, { transform: `translate(${to[0]}px,${to[1]}px) rotate(${rnd(300, 560)}deg) rotateX(0deg)` }], { delay: delay * T, duration: dur * T, easing: 'ease-in-out' });
    };
    // un coup de vent : des petites feuilles devant et derrière la grande
    for (let i = 0; i < 10; i++) small(i, rnd(0, 0.28), rnd(0.5, 0.7), [-160, rnd(0.1, 1) * H], [W + 60, rnd(-0.3, 0.6) * H]);
    const big = centered(S, L, leafSvg(cols[0], vein, gid('lfb')));
    const tf = (x, y, z, rx, k) => `translate(${x}px,${y}px) scale(${k}) perspective(${P}px) rotate(${z}deg) rotateX(${rx}deg)`;
    A(big, [
      { offset: 0, transform: tf(-W * 0.62, -H * 0.44, -40, 55, 0.11), easing: 'cubic-bezier(.4,0,.6,1)' },
      { offset: 0.12, transform: tf(-W * 0.38, -H * 0.16, 25, -40, 0.14), easing: 'cubic-bezier(.4,0,.6,1)' },
      { offset: 0.23, transform: tf(-W * 0.16, -H * 0.1, -30, 38, 0.2), easing: 'cubic-bezier(.4,0,.6,1)' },
      { offset: 0.33, transform: tf(-W * 0.04, -H * 0.02, -8, 12, 0.45), easing: 'cubic-bezier(.5,0,.7,.6)' },
      { offset: 0.42, transform: tf(0, 0, -20, 0, 1), easing: 'linear' },
      { offset: 0.52, transform: tf(W * 0.012, -H * 0.01, -16, 0, 1.04), easing: 'cubic-bezier(.55,0,.75,.35)' },
      { offset: 1, transform: tf(W / 2 + S * 0.72, -H * 0.6, 34, 25, 1.12) },
    ]);
    for (let i = 0; i < 6; i++) small(i, 0.5 + i * 0.04, 0.45, [-120, rnd(0.3, 1.1) * H], [W + 60, rnd(-0.2, 0.5) * H]);
    return 0.43;
  };

  // ===== Halloween : la nuée de chauves-souris envahit l'écran puis explose dans tous les sens =====
  const BAT = 'M50 20 C48 14 46 12 45 15 C41 11 33 9 22 11 C28 15 30 19 28 23 C20 19 10 21 0 27 C12 29 18 35 18 41 C26 35 36 35 42 41 C44 35 47 31 50 31 C53 31 56 35 58 41 C64 35 74 35 82 41 C82 35 88 29 100 27 C90 21 80 19 72 23 C70 19 72 15 78 11 C67 9 59 11 55 15 C54 12 52 14 50 20 Z';
  const batEl = (L, s, col, eyes) => {
    const w = mk(`left:0;top:0;width:${s}px;height:${s / 2}px;margin:${-s / 4}px 0 0 ${-s / 2}px;will-change:transform`, L);
    const inner = mk('inset:0;transform-origin:50% 45%', w, svgBox('0 0 100 50', `<path d="${BAT}" fill="${col}"/>${eyes ? `<circle cx="47.6" cy="23" r="1.2" fill="${eyes}"/><circle cx="52.4" cy="23" r="1.2" fill="${eyes}"/>` : ''}`));
    inner.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.3) translateY(4%)' }], { duration: rnd(100, 150), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    return w;
  };
  K.bats = (L, W, H, p) => {
    backdrop(L, p.night || 'radial-gradient(90% 80% at 50% 55%, #3a1263, #0b0414 75%)', 0.26, 0.42, 0.5, 0.6);
    const cx = W / 2, cy = H / 2, eye = p.eye || '#ff8a1e';
    // la nuée : de partout vers le milieu, puis dispersion
    for (let i = 0; i < 70; i++) {
      const s = rnd(40, 170), e = batEl(L, s, i % 4 ? '#0a0510' : '#1e0d2b', s > 110 ? eye : null);
      const a = rnd(0, Math.PI * 2), R = Math.hypot(W, H) * 0.65, sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R * 0.8;
      const mx = rnd(0.05, 0.95) * W, my = rnd(0.05, 0.95) * H, b = rnd(0, Math.PI * 2);
      const d = rnd(0.02, 0.3);
      A(e, [{ offset: 0, transform: `translate(${sx}px,${sy}px) scale(.4)` }, { offset: d, transform: `translate(${sx}px,${sy}px) scale(.4)`, easing: 'cubic-bezier(.3,.4,.4,1)' },
        { offset: 0.44, transform: `translate(${mx}px,${my}px) scale(1)` }, { offset: 0.5, transform: `translate(${mx + rnd(-20, 20)}px,${my + rnd(-20, 20)}px) scale(1)`, easing: 'cubic-bezier(.5,0,.9,.5)' },
        { offset: rnd(0.78, 0.92), transform: `translate(${mx + Math.cos(b) * W}px,${my + Math.sin(b) * H - H * 0.3}px) scale(1.5)` }, { offset: 1, transform: `translate(${mx + Math.cos(b) * W * 1.5}px,${my + Math.sin(b) * H - H * 0.5}px) scale(1.5)` }]);
    }
    // les géantes : elles se posent en mosaïque sur l'écran, puis s'envolent depuis le centre
    const nc = 4, nr = 3;
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      const s = W * 0.62, x = (c + 0.5) / nc * W, y = (r + 0.5) / nr * H, dx = x - cx, dy = y - cy, n = Math.hypot(dx, dy) || 1;
      const e = batEl(L, s, (r + c) % 2 ? '#07030b' : '#120720', eye);
      const out = (k) => `translate(${x + dx / n * W * k}px,${y + dy / n * H * k}px)`;
      A(e, [{ offset: 0, transform: `${out(1.2)} scale(.5)` }, { offset: 0.22 + (r * nc + c) * 0.012, transform: `${out(1.2)} scale(.5)`, easing: 'cubic-bezier(.2,.6,.3,1)' }, { offset: 0.42, transform: `translate(${x}px,${y}px) scale(1)` },
        { offset: 0.5, transform: `translate(${x}px,${y - 6}px) scale(1.02)`, easing: 'cubic-bezier(.5,0,.85,.4)' }, { offset: 0.84, transform: `${out(1.3)} scale(1.8)` }, { offset: 1, transform: `${out(1.6)} scale(1.8)` }]);
    }
    return 0.44;
  };

  // ===== Gotham : le Bat-Signal grandit, on plonge dans la chauve-souris, et la page s'ouvre par une chauve-souris =====
  const BAT_C = (() => { // la chauve-souris recentrée dans le carré −100…100 (pour le trou)
    return BAT.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${((+x - 50) * 2).toFixed(1)} ${((+y - 24) * 2).toFixed(1)}`);
  })();
  K.batsignal = (L, W, H) => {
    backdrop(L, 'radial-gradient(100% 80% at 50% 40%, #1b2436, #05070d 75%)', 0, 0.16, 0.44, 0.45);
    // projecteur : un faisceau monte du bas vers le signal
    const beam = mk(`left:${W / 2 - W * 0.3}px;top:${H * 0.5}px;width:${W * 0.6}px;height:${H * 0.7}px;background:linear-gradient(0deg, rgba(255,216,74,.0), rgba(255,216,74,.22));clip-path:polygon(46% 100%, 54% 100%, 100% 0, 0 0);transform-origin:50% 100%;will-change:transform,opacity`, L);
    A(beam, [{ offset: 0, transform: 'scaleY(0)', opacity: 0 }, { offset: 0.05, opacity: 1 }, { offset: 0.16, transform: 'scaleY(1)', opacity: 1 }, { offset: 0.3, opacity: 1 }, { offset: 0.36, opacity: 0 }, { offset: 1, opacity: 0 }]);
    const S = Math.min(W, H) * 0.7;
    const sig = centered(S, L, svgBox('-60 -40 120 80', `<defs><radialGradient id="bsg"><stop offset="0" stop-color="#fff6c2"/><stop offset=".72" stop-color="#ffd84a"/><stop offset="1" stop-color="#e0a800"/></radialGradient></defs>
      <ellipse cx="0" cy="0" rx="58" ry="38" fill="url(#bsg)"/><g transform="translate(-40 -19.2) scale(.8)"><path d="${BAT}" fill="#05070d"/></g>`), 'filter:drop-shadow(0 0 40px rgba(255,216,74,.6))');
    const k = (H / S) * 12;
    A(sig, [{ offset: 0, transform: 'scale(.05) rotate(-8deg)', opacity: 0 }, { offset: 0.1, opacity: 1, easing: 'cubic-bezier(.2,.8,.3,1)' }, { offset: 0.26, transform: 'scale(1) rotate(0deg)', easing: 'cubic-bezier(.7,0,.95,.5)' }, { offset: 0.44, transform: `scale(${k})`, opacity: 1 }, { offset: 0.45, opacity: 0, transform: `scale(${k})` }, { offset: 1, opacity: 0, transform: `scale(${k})` }]);
    // tout noir (on est dans la chauve-souris), puis une chauve-souris cerclée de jaune s'ouvre et grandit
    const D = Math.hypot(W, H);
    hole(L, W, H, { fill: '#05070d', path: BAT_C, ring: '#ffd84a', ringW: 4, from: 0.4, to: 0.985, k: (f) => (f < 0.54 ? 0 : 3 + ein(cl((f - 0.54) / 0.42)) * D * 14), rot: (f) => (f < 0.54 ? -8 : -8 + (f - 0.54) * 30) });
    return 0.45;
  };

  // ===== hiver : le givre gagne l'écran, un flocon tourne… puis la glace se fissure et tombe en éclats =====
  const jag = (n, r0, r1) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 + Math.random() * (r1 - r0) * 0.4 : r1; d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); } return d + 'Z'; };
  const FLAKE = (() => { let d = ''; for (let i = 0; i < 6; i++) { const a = (i * 60) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = (x, y) => `${(x * c - y * s).toFixed(1)} ${(x * s + y * c).toFixed(1)}`; d += `M0 0 L${P(94, 0)} M${P(28, 0)} L${P(46, -18)} M${P(28, 0)} L${P(46, 18)} M${P(52, 0)} L${P(72, -22)} M${P(52, 0)} L${P(72, 22)} M${P(74, 0)} L${P(86, -11)} M${P(74, 0)} L${P(86, 11)} M${P(20, 0)} L${P(20 * Math.cos(Math.PI / 3), 20 * Math.sin(Math.PI / 3))} `; } return d; })();
  K.frost = (L, W, H, p) => {
    const D = Math.hypot(W, H), S = D * 2.4, ice = p.ice || ['#ffffff', '#e4f3ff', '#a9d4ff'];
    const ICE = `linear-gradient(135deg, rgba(255,255,255,.6), rgba(255,255,255,0) 38%, rgba(255,255,255,.4) 58%, rgba(255,255,255,0) 80%), repeating-linear-gradient(115deg, rgba(255,255,255,.22) 0 2px, transparent 2px 46px), repeating-linear-gradient(28deg, rgba(255,255,255,.14) 0 1px, transparent 1px 74px), radial-gradient(${W}px ${H}px at 50% 50%, ${ice[0]}, ${ice[1]} 50%, ${ice[2]})`;
    // 1) le givre part des quatre coins
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(([x, y], i) => {
      const e = mk(`left:${x - S / 2}px;top:${y - S / 2}px;width:${S}px;height:${S}px;will-change:transform`, L, svgBox('-100 -100 200 200', `<defs><radialGradient id="fr${i}${uid}"><stop offset="0" stop-color="${ice[0]}"/><stop offset=".55" stop-color="${ice[1]}"/><stop offset=".9" stop-color="${ice[2]}"/><stop offset="1" stop-color="#ffffff"/></radialGradient></defs><path d="${jag(46, 86, 100)}" fill="url(#fr${i}${uid})" stroke="#ffffff" stroke-width=".6"/>`));
      A(e, [{ offset: 0, transform: 'scale(0) rotate(0deg)' }, { offset: 0.03 + i * 0.03, transform: 'scale(0) rotate(0deg)', easing: 'cubic-bezier(.25,.6,.35,1)' }, { offset: 0.42, transform: 'scale(1) rotate(22deg)' }, { offset: 1, transform: 'scale(1) rotate(22deg)' }]);
    });
    // des aiguilles de glace qui poussent des coins
    for (let i = 0; i < 4; i++) {
      const x = i % 2 ? W : 0, y = i < 2 ? 0 : H, s = Math.min(W, H) * 0.9;
      const e = mk(`left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;will-change:transform,opacity`, L, svgBox('-100 -100 200 200', `<path d="${FLAKE}" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`));
      A(e, [{ offset: 0, transform: 'scale(0) rotate(0deg)', opacity: 1 }, { offset: 0.06 + i * 0.03, transform: 'scale(0) rotate(0deg)', easing: 'ease-out' }, { offset: 0.38, transform: 'scale(1) rotate(30deg)', opacity: 1 }, { offset: 0.44, opacity: 0 }, { offset: 1, opacity: 0 }]);
    }
    const sheet = mk(`inset:0;background:${ICE};opacity:0;will-change:opacity`, L);
    A(sheet, [{ offset: 0, opacity: 0 }, { offset: 0.32, opacity: 0, easing: 'ease-in-out' }, { offset: 0.42, opacity: 1 }, { offset: 0.505, opacity: 1 }, { offset: 0.506, opacity: 0 }, { offset: 1, opacity: 0 }]);
    // 2) les éclats (même texture, découpée en triangles) : invisibles jusqu'à la fissure
    const nc = 7, nr = 5, P = [];
    for (let r = 0; r <= nr; r++) { P.push([]); for (let c = 0; c <= nc; c++) { const edge = r === 0 || c === 0 || r === nr || c === nc; P[r].push([c / nc * W + (edge && (c === 0 || c === nc) ? 0 : rnd(-0.32, 0.32) * W / nc), r / nr * H + (edge && (r === 0 || r === nr) ? 0 : rnd(-0.32, 0.32) * H / nr)]); } }
    const tris = [];
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) { const a = P[r][c], b = P[r][c + 1], d = P[r + 1][c], e = P[r + 1][c + 1]; if ((r + c) % 2) tris.push([a, b, e], [a, e, d]); else tris.push([a, b, d], [b, e, d]); }
    let cracks = '';
    tris.forEach(t => {
      const x0 = Math.min(...t.map(q => q[0])) - 1, y0 = Math.min(...t.map(q => q[1])) - 1, x1 = Math.max(...t.map(q => q[0])) + 1, y1 = Math.max(...t.map(q => q[1])) + 1, w = x1 - x0, h = y1 - y0;
      const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3;
      // un tout petit débord pour que les éclats se touchent sans laisser passer la page
      const g = t.map(q => [q[0] + (q[0] - mx) * 0.012, q[1] + (q[1] - my) * 0.012]);
      const e = mk(`left:${x0}px;top:${y0}px;width:${w}px;height:${h}px;background:${ICE};background-size:${W}px ${H}px;background-position:${-x0}px ${-y0}px;clip-path:polygon(${g.map(q => `${(q[0] - x0).toFixed(1)}px ${(q[1] - y0).toFixed(1)}px`).join(',')});opacity:0;will-change:transform,opacity`, L);
      const dist = Math.hypot(mx - W / 2, my - H / 2) / (D / 2), st = 0.53 + dist * 0.12, dx = (mx - W / 2) * rnd(0.15, 0.4), rot = rnd(-50, 50);
      A(e, [{ offset: 0, opacity: 0 }, { offset: 0.5, opacity: 0 }, { offset: 0.501, opacity: 1, transform: 'none' }, { offset: st, opacity: 1, transform: 'translate(0,0) rotate(0deg)', easing: 'cubic-bezier(.45,0,.9,.6)' }, { offset: Math.min(0.99, st + 0.3), opacity: 0.9, transform: `translate(${dx}px,${H * rnd(0.9, 1.3)}px) rotate(${rot}deg) scale(.85)` }, { offset: 1, opacity: 0, transform: `translate(${dx}px,${H * 1.4}px) rotate(${rot}deg) scale(.85)` }]);
      cracks += `M${t[0][0].toFixed(0)} ${t[0][1].toFixed(0)} L${t[1][0].toFixed(0)} ${t[1][1].toFixed(0)} L${t[2][0].toFixed(0)} ${t[2][1].toFixed(0)} Z `;
    });
    const ck = mk('inset:0;opacity:0;will-change:opacity', L, `<svg width="${W}" height="${H}" style="display:block"><path d="${cracks}" stroke="#ffffff" stroke-width="2.5" fill="none"/><path d="${cracks}" stroke="#7fb8e8" stroke-width="1" fill="none"/></svg>`);
    A(ck, [{ offset: 0, opacity: 0 }, { offset: 0.46, opacity: 0 }, { offset: 0.5, opacity: 1 }, { offset: 0.54, opacity: 1 }, { offset: 0.6, opacity: 0 }, { offset: 1, opacity: 0 }]);
    // le grand flocon au milieu : il grandit en tournant, brille, et éclate avec la glace
    const f = centered(Math.min(W, H) * 0.66, L, svgBox('-100 -100 200 200', `<path d="${FLAKE}" stroke="${p.flake || '#5aaef0'}" stroke-opacity=".35" stroke-width="13" stroke-linecap="round" fill="none"/><path d="${FLAKE}" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" fill="none"/><circle r="9" fill="#ffffff"/>`));
    A(f, [{ offset: 0, transform: 'scale(.1) rotate(-150deg)', opacity: 0 }, { offset: 0.1, opacity: 1, easing: 'cubic-bezier(.3,.6,.4,1)' }, { offset: 0.42, transform: 'scale(1) rotate(0deg)', easing: 'ease-in-out' }, { offset: 0.48, transform: 'scale(1.12) rotate(6deg)', opacity: 1, easing: 'cubic-bezier(.6,0,.9,.5)' }, { offset: 0.6, transform: 'scale(1.6) rotate(20deg)', opacity: 0 }, { offset: 1, opacity: 0 }]);
    return 0.44;
  };

  // ===== Noël : le papier cadeau tombe, les rubans filent, un nœud… puis le papier se déchire au milieu =====
  K.gift = (L, W, H, p) => {
    const paper = `radial-gradient(circle at 22px 22px, #ffe9a8 3.5px, transparent 4.5px) 0 0/44px 44px, repeating-linear-gradient(45deg, rgba(255,255,255,.1) 0 16px, transparent 16px 32px), radial-gradient(${W}px ${H}px at 50% 45%, ${p.wrap ? p.wrap[1] : '#d63434'}, ${p.wrap ? p.wrap[0] : '#9c1414'})`;
    const rb = Math.max(30, Math.min(W, H) * 0.08), gold = 'linear-gradient(90deg,#c48a12,#ffe08a 45%,#f2c14e 55%,#c48a12)', goldH = 'linear-gradient(180deg,#c48a12,#ffe08a 45%,#f2c14e 55%,#c48a12)';
    // la déchirure : une ligne en dents de scie verticale
    const N = 16, xs = Array.from({ length: N + 1 }, (_, i) => W / 2 + (i % 2 ? 1 : -1) * rnd(0.008, 0.03) * W);
    const tear = xs.map((x, i) => `${x.toFixed(1)}px ${(i / N * H).toFixed(1)}px`);
    const halfL = `polygon(0 0, ${tear.join(', ')}, 0 ${H}px)`, halfR = `polygon(${tear.join(', ')}, ${W}px ${H}px, ${W}px 0)`;
    const box = mk('inset:0;will-change:transform', L);
    A(box, [{ offset: 0, transform: `translateY(${-H * 1.05}px)`, easing: 'cubic-bezier(.5,0,.75,0)' }, { offset: 0.2, transform: 'translateY(0)', easing: 'cubic-bezier(.3,0,.5,1)' }, { offset: 0.25, transform: `translateY(${-H * 0.04}px)`, easing: 'cubic-bezier(.5,0,.7,1)' }, { offset: 0.3, transform: 'translateY(0)' }, { offset: 1, transform: 'translateY(0)' }]);
    const half = (clip, left) => {
      const h = mk(`inset:0;background:${paper};clip-path:${clip};will-change:transform;transform-origin:${left ? '0 100%' : '100% 100%'}`, box);
      const hz = mk(`left:0;top:${H / 2 - rb / 2}px;width:100%;height:${rb}px;background:${goldH};box-shadow:0 4px 10px rgba(0,0,0,.25);transform-origin:${left ? '0' : '100%'} 50%;will-change:transform`, h);
      const vt = mk(`left:${W / 2 - rb / 2}px;top:0;width:${rb}px;height:100%;background:${gold};box-shadow:4px 0 10px rgba(0,0,0,.25);transform-origin:50% 0;will-change:transform`, h);
      A(hz, [{ offset: 0, transform: 'scaleX(0)' }, { offset: 0.26, transform: 'scaleX(0)', easing: 'cubic-bezier(.2,.7,.3,1)' }, { offset: 0.36, transform: 'scaleX(1)' }, { offset: 1, transform: 'scaleX(1)' }]);
      A(vt, [{ offset: 0, transform: 'scaleY(0)' }, { offset: 0.3, transform: 'scaleY(0)', easing: 'cubic-bezier(.2,.7,.3,1)' }, { offset: 0.4, transform: 'scaleY(1)' }, { offset: 1, transform: 'scaleY(1)' }]);
      const s = left ? -1 : 1;
      A(h, [{ offset: 0, transform: 'none' }, { offset: 0.5, transform: 'none', easing: 'ease-in-out' }, { offset: 0.53, transform: `translateX(${s * 8}px) rotate(${s * 0.4}deg)`, easing: 'cubic-bezier(.5,0,.7,.6)' }, { offset: 0.92, transform: `translate(${s * W * 0.62}px,${H * 0.22}px) rotate(${s * 14}deg)` }, { offset: 1, transform: `translate(${s * W * 0.7}px,${H * 0.26}px) rotate(${s * 16}deg)` }]);
    };
    half(halfL, true); half(halfR, false);
    const S = Math.min(W, H) * 0.42;
    const bow = centered(S, L, svgBox('-100 -100 200 200', `<defs><linearGradient id="bw${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#d9a227"/></linearGradient></defs><g fill="url(#bw${uid})" stroke="#a87410" stroke-width="4" stroke-linejoin="round"><path d="M-6 6 L-44 86 L-24 76 L-14 96 Z"/><path d="M6 6 L44 86 L24 76 L14 96 Z"/><path d="M0 0 C-30 -74 -100 -62 -84 -10 C-74 22 -30 12 0 0 Z"/><path d="M0 0 C30 -74 100 -62 84 -10 C74 22 30 12 0 0 Z"/><path d="M-14 -4 C-40 -40 -66 -36 -62 -14" fill="none" stroke-opacity=".5"/><path d="M14 -4 C40 -40 66 -36 62 -14" fill="none" stroke-opacity=".5"/><rect x="-18" y="-16" width="36" height="32" rx="10"/></g>`), 'filter:drop-shadow(0 10px 16px rgba(0,0,0,.35))');
    A(bow, [{ offset: 0, transform: 'scale(0)' }, { offset: 0.36, transform: 'scale(0) rotate(-30deg)', easing: 'cubic-bezier(.3,1.7,.5,1)' }, { offset: 0.46, transform: 'scale(1) rotate(0deg)' }, { offset: 0.5, transform: 'scale(1)', easing: 'cubic-bezier(.4,0,.7,.4)' }, { offset: 0.78, transform: `translateY(${-H * 0.85}px) scale(.7) rotate(200deg)` }, { offset: 1, transform: `translateY(${-H * 0.85}px) scale(.7) rotate(200deg)` }]);
    // quelques flocons pendant que ça s'ouvre
    for (let i = 0; i < 18; i++) { const s = rnd(4, 10), e = mk(`left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:#fff;will-change:transform`, L), x = rnd(0, W); A(e, [{ transform: `translate(${x}px,${-20}px)` }, { transform: `translate(${x + rnd(-60, 60)}px,${H + 20}px)` }], { delay: T * rnd(0.45, 0.6), duration: T * rnd(0.4, 0.55) }); }
    return 0.42;
  };

  // ===== printemps : une fleur s'ouvre, une tempête de pétales couvre l'écran, puis le vent l'emporte =====
  const PETAL = 'M0 0 C-34 -22 -46 -72 -18 -94 L0 -82 L18 -94 C46 -72 34 -22 0 0 Z';
  K.petals = (L, W, H, p) => {
    const cols = p.petals || ['#ffc9dc', '#ff9ec0', '#ffe3ee'], bg = p.bloomBg || '#ffd6e6';
    // la rafale : un grand pan rose aux bords flous qui traverse de gauche à droite
    const gw = W * 2;
    const gust = mk(`left:0;top:0;width:${gw}px;height:100%;background:radial-gradient(30% 50% at 60% 40%, rgba(255,255,255,.55), transparent), radial-gradient(25% 40% at 30% 70%, rgba(255,255,255,.35), transparent), linear-gradient(90deg, ${bg}, ${cols[0]} 50%, ${bg});-webkit-mask-image:linear-gradient(90deg, transparent 0, #000 18%, #000 88%, transparent);mask-image:linear-gradient(90deg, transparent 0, #000 18%, #000 88%, transparent);will-change:transform`, L);
    A(gust, [{ offset: 0, transform: `translateX(${-gw}px)` }, { offset: 0.16, transform: `translateX(${-gw}px)`, easing: 'cubic-bezier(.3,.3,.4,1)' }, { offset: 0.42, transform: `translateX(${-gw * 0.24}px)`, easing: 'linear' }, { offset: 0.52, transform: `translateX(${-gw * 0.2}px)`, easing: 'cubic-bezier(.5,0,.7,.7)' }, { offset: 0.95, transform: `translateX(${W * 1.05}px)` }, { offset: 1, transform: `translateX(${W * 1.05}px)` }]);
    // la fleur : elle éclot au milieu puis ses pétales s'envolent
    const fs = Math.min(W, H) * 0.7, flower = centered(fs, L);
    A(flower, [{ offset: 0, transform: 'scale(.05) rotate(-160deg)' }, { offset: 0.22, transform: 'scale(1) rotate(0deg)', easing: 'cubic-bezier(.3,1.4,.5,1)' }, { offset: 1, transform: 'scale(1) rotate(10deg)' }]);
    for (let i = 0; i < 5; i++) {
      const a = i * 72, pt = mk('inset:0;will-change:transform', flower, svgBox('-100 -100 200 200', `<g transform="rotate(${a})"><path d="${PETAL}" fill="${cols[i % 2]}" stroke="${cols[1]}" stroke-width="1.5"/><path d="M0 -8 L0 -60" stroke="${cols[1]}" stroke-width="1.5" opacity=".6"/></g>`));
      const rad = (a - 90) * Math.PI / 180, dx = Math.cos(rad) * W * 0.9, dy = Math.sin(rad) * H * 0.9;
      A(pt, [{ offset: 0, transform: 'none' }, { offset: 0.24 + i * 0.015, transform: 'none', easing: 'cubic-bezier(.4,0,.6,1)' }, { offset: 0.5, transform: `translate(${dx}px,${dy}px) rotate(${i % 2 ? 140 : -140}deg) scale(2.4)` }, { offset: 1, transform: `translate(${dx * 1.5}px,${dy * 1.5}px) scale(2.4)` }]);
    }
    const heart = mk('inset:0;will-change:transform,opacity', flower, svgBox('-100 -100 200 200', `<circle r="13" fill="#ffd34d"/><g fill="#e88a1a">${Array.from({ length: 10 }, (_, i) => { const a = i * 36 * Math.PI / 180; return `<circle cx="${(Math.cos(a) * 19).toFixed(1)}" cy="${(Math.sin(a) * 19).toFixed(1)}" r="3"/>`; }).join('')}</g>`));
    A(heart, [{ offset: 0, opacity: 1, transform: 'none' }, { offset: 0.26, opacity: 1, transform: 'none', easing: 'ease-in' }, { offset: 0.36, opacity: 0, transform: 'scale(.2)' }, { offset: 1, opacity: 0 }]);
    // la tempête de pétales, de gauche à droite avec la rafale
    for (let i = 0; i < 90; i++) {
      const s = rnd(30, i < 30 ? 220 : 110), e = mk(`left:0;top:0;width:${s}px;height:${s}px;will-change:transform`, L, svgBox('-100 -100 200 200', `<path d="${PETAL}" fill="${pick(cols)}"/>`));
      const y = rnd(-0.1, 1.05) * H, xm = rnd(-0.05, 1.05) * W, st = rnd(0.05, 0.3), r0 = rnd(0, 360);
      A(e, [{ offset: 0, transform: `translate(${-s - 40}px,${y - rnd(0, 120)}px) rotate(${r0}deg)` }, { offset: st, transform: `translate(${-s - 40}px,${y - rnd(0, 120)}px) rotate(${r0}deg)`, easing: 'cubic-bezier(.3,.4,.5,1)' },
        { offset: 0.44, transform: `translate(${xm}px,${y}px) rotate(${r0 + rnd(120, 300)}deg)` }, { offset: 0.52, transform: `translate(${xm + 30}px,${y + 10}px) rotate(${r0 + 340}deg)`, easing: 'cubic-bezier(.5,0,.75,.6)' },
        { offset: rnd(0.82, 0.95), transform: `translate(${W + s + rnd(40, 300)}px,${y + rnd(-200, 120)}px) rotate(${r0 + rnd(600, 900)}deg)` }, { offset: 1, transform: `translate(${W + s + 400}px,${y}px) rotate(${r0 + 900}deg)` }]);
    }
    return 0.44;
  };

  // ===== été : deux vagues montent, passent au-dessus de tout, puis partent par le haut =====
  const CREST = 'M0 200 L0 110 C80 60 140 40 220 70 C300 100 330 30 420 20 C520 10 560 90 640 80 C720 70 760 10 860 30 C930 44 970 80 1000 90 L1000 200 Z';
  const crestSvg = (body, foam) => svgBox('0 0 1000 200', `<path d="${CREST}" fill="${body}"/><path d="${CREST.replace('M0 200 L0 110', 'M0 110').replace(' L1000 200 Z', '')}" stroke="${foam}" stroke-width="18" fill="none" stroke-linecap="round"/><path d="${CREST.replace('M0 200 L0 110', 'M0 130').replace(' L1000 200 Z', '')}" stroke="${foam}" stroke-opacity=".35" stroke-width="6" fill="none" transform="translate(0 22)"/>`, 'none');
  const waveEl = (L, W, H, body, foam, deep, hgt) => {
    const ch = H * 0.24, w = mk(`left:${-W * 0.1}px;top:0;width:${W * 1.2}px;height:${hgt + ch * 2}px;will-change:transform`, L);
    mk(`left:0;top:0;width:100%;height:${ch + 2}px`, w, crestSvg(body[0], foam));
    mk(`left:0;top:${ch}px;width:100%;height:${hgt}px;background:repeating-linear-gradient(170deg, rgba(255,255,255,.07) 0 3px, transparent 3px 60px), repeating-linear-gradient(10deg, rgba(255,255,255,.05) 0 2px, transparent 2px 90px), linear-gradient(180deg, ${body[0]}, ${body[1]} 35%, ${deep})`, w);
    const bottom = mk(`left:0;top:${ch + hgt - 2}px;width:100%;height:${ch}px;transform:scaleY(-1)`, w, crestSvg(deep, foam));
    for (let i = 0; i < 22; i++) { const s = rnd(5, 18); mk(`left:${rnd(0, 100)}%;top:${ch + rnd(0.02, 0.98) * hgt}px;width:${s}px;height:${s}px;border-radius:50%;background:rgba(255,255,255,${rnd(0.2, 0.5).toFixed(2)})`, w); }
    return { w, ch, tot: hgt + ch * 2, bottom };
  };
  K.wave = (L, W, H, p) => {
    const sea = p.sea || ['#5fd0f0', '#1890d8', '#0b5a9e'];
    // vague de fond, plus claire, un peu en avance
    const b = waveEl(L, W, H, ['#a6ecff', '#5fc6ec'], '#ffffff', '#3aa0dc', H * 0.6);
    A(b.w, [{ offset: 0, transform: `translate(0,${H}px)` }, { offset: 0.06, transform: `translate(0,${H}px)`, easing: 'cubic-bezier(.3,.3,.4,1)' }, { offset: 0.4, transform: `translate(${W * 0.05}px,${-b.ch * 0.6}px)`, easing: 'cubic-bezier(.4,0,.6,1)' }, { offset: 0.8, transform: `translate(${W * 0.06}px,${-b.tot - 20}px)` }, { offset: 1, transform: `translate(${W * 0.06}px,${-b.tot - 20}px)` }]);
    const f = waveEl(L, W, H, sea, '#f4fdff', sea[2], H * 1.25);
    A(f.w, [{ offset: 0, transform: `translate(0,${H * 1.05}px)` }, { offset: 0.1, transform: `translate(0,${H * 1.05}px)`, easing: 'cubic-bezier(.3,.35,.4,1)' }, { offset: 0.42, transform: `translate(${-W * 0.04}px,${-f.ch * 1.06}px)`, easing: 'linear' }, { offset: 0.52, transform: `translate(${-W * 0.05}px,${-f.ch * 1.06 - H * 0.07}px)`, easing: 'cubic-bezier(.45,0,.6,1)' }, { offset: 0.94, transform: `translate(${-W * 0.08}px,${-f.tot - 30}px)` }, { offset: 1, transform: `translate(${-W * 0.08}px,${-f.tot - 30}px)` }]);
    // les embruns qui sautent de la crête
    for (let i = 0; i < 26; i++) {
      const s = rnd(5, 14), e = mk(`left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:#ffffff;will-change:transform,opacity`, L), x = rnd(0, W);
      A(e, [{ transform: `translate(${x}px,${H * 0.6}px)`, opacity: 0 }, { offset: 0.15, opacity: 1 }, { transform: `translate(${x + rnd(-80, 80)}px,${-rnd(0, 0.3) * H}px)`, opacity: 0 }], { delay: T * rnd(0.18, 0.36), duration: T * 0.3, easing: 'cubic-bezier(.2,.7,.4,1)' });
    }
    return 0.43;
  };

  // ===== poisson d'avril : l'eau monte avec des bulles, un gros poisson orange passe =====
  K.bubbles = (L, W, H, p) => {
    K.wave(L, W, H, { sea: p.sea || ['#3cb4e6', '#0a6aae', '#032746'] });
    for (let i = 0; i < 42; i++) {
      const s = rnd(14, 64), e = mk(`left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;border:2px solid rgba(255,255,255,.75);background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.75), rgba(255,255,255,.08) 45%, transparent 60%);will-change:transform`, L);
      const x = rnd(0, 1) * W;
      A(e, [{ transform: `translate(${x}px,${H + s}px)` }, { transform: `translate(${x + rnd(-80, 80)}px,${-s - 40}px)` }], { delay: rnd(0.15, 0.62) * T, duration: T * rnd(0.32, 0.55), easing: 'ease-in' });
    }
    const fs = Math.min(W, H) * 0.42;
    const fish = (y, s, d, flip) => {
      const e = mk(`left:0;top:0;width:${s}px;height:${s * 0.6}px;will-change:transform`, L, svgBox('0 0 100 60', `<path d="M8 30 C20 6 60 2 78 30 C60 58 20 54 8 30 Z" fill="#ffb703"/><path d="M76 30 L98 12 L92 30 L98 48 Z" fill="#fb8500"/><path d="M40 14 C46 4 56 4 60 12" fill="#fb8500"/><circle cx="22" cy="26" r="4" fill="#fff"/><circle cx="21" cy="26" r="2.2" fill="#14213d"/><path d="M34 22 C40 30 40 34 34 40" stroke="#fb8500" stroke-width="2.5" fill="none"/>`));
      const from = flip ? W + s : -s * 1.2, to = flip ? -s * 1.2 : W + s;
      A(e, [{ transform: `translate(${from}px,${y}px) scaleX(${flip ? 1 : -1})` }, { offset: 0.5, transform: `translate(${(from + to) / 2}px,${y - 30}px) scaleX(${flip ? 1 : -1})` }, { transform: `translate(${to}px,${y}px) scaleX(${flip ? 1 : -1})` }], { delay: d * T, duration: T * 0.5, easing: 'ease-in-out' });
    };
    fish(H * 0.42, fs, 0.2, true); fish(H * 0.7, fs * 0.5, 0.28, false); fish(H * 0.18, fs * 0.4, 0.34, true);
    return 0.43;
  };

  // ===== Saint-Valentin : un cœur bat deux fois, grossit jusqu'à tout couvrir, puis la page s'ouvre en forme de cœur =====
  const HEART = 'M0 92 C-60 50 -100 14 -100 -30 C-100 -70 -66 -92 -40 -92 C-18 -92 -4 -78 0 -62 C4 -78 18 -92 40 -92 C66 -92 100 -70 100 -30 C100 14 60 50 0 92 Z';
  K.hearts = (L, W, H, p) => {
    backdrop(L, 'radial-gradient(circle, #ff7aa8, #c2185b 75%)', 0.32, 0.44, 0.5, 0.505);
    const S = Math.min(W, H) * 0.5, h = centered(S, L, svgBox('-100 -100 200 200', `<defs><radialGradient id="hg${uid}" cx=".38" cy=".32"><stop offset="0" stop-color="#ffb3cc"/><stop offset=".45" stop-color="#ff4d8d"/><stop offset="1" stop-color="#c2185b"/></radialGradient></defs><path d="${HEART}" fill="url(#hg${uid})"/><path d="M-62 -52 C-56 -72 -36 -78 -24 -70" stroke="#fff" stroke-opacity=".6" stroke-width="8" fill="none" stroke-linecap="round"/>`), 'filter:drop-shadow(0 10px 30px rgba(120,0,40,.45))');
    const k = Math.hypot(W, H) / S * 3.2;
    A(h, [{ offset: 0, transform: 'scale(0)' }, { offset: 0.1, transform: 'scale(1)', easing: 'ease-in-out' }, { offset: 0.16, transform: 'scale(.82)', easing: 'ease-in-out' }, { offset: 0.22, transform: 'scale(1.22)', easing: 'ease-in-out' }, { offset: 0.27, transform: 'scale(.95)', easing: 'ease-in-out' }, { offset: 0.31, transform: 'scale(1.15)', easing: 'cubic-bezier(.6,0,.9,.5)' }, { offset: 0.45, transform: `scale(${k})`, opacity: 1 }, { offset: 0.5, transform: `scale(${k})`, opacity: 1 }, { offset: 0.501, opacity: 0 }, { offset: 1, opacity: 0 }]);
    // la page s'ouvre par un cœur qui grandit, bordé de blanc
    const D = Math.hypot(W, H);
    hole(L, W, H, { fill: '#e0115f', defs: '', path: HEART, ring: '#ffffff', ringW: 5, cy: H * 0.52, from: 0.495, to: 0.99, k: (f) => (f < 0.52 ? 0 : 2 + eio(cl((f - 0.52) / 0.42)) * D * 1.6) });
    // une gerbe de petits cœurs qui jaillit du centre à l'ouverture
    for (let i = 0; i < 30; i++) {
      const s = rnd(22, 64), e = mk(`left:${W / 2 - s / 2}px;top:${H / 2 - s / 2}px;width:${s}px;height:${s}px;will-change:transform,opacity`, L, svgBox('-100 -100 200 200', `<path d="${HEART}" fill="${pick(['#ff4d8d', '#ff9fb8', '#ffffff', '#e0115f'])}"/>`));
      const a = rnd(0, Math.PI * 2), r = rnd(0.25, 0.7) * D;
      A(e, [{ offset: 0, opacity: 0, transform: 'scale(.2)' }, { offset: 0.5, opacity: 0, transform: 'scale(.2)' }, { offset: 0.52, opacity: 1, easing: 'cubic-bezier(.1,.7,.3,1)' }, { offset: 0.95, opacity: 0, transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) rotate(${rnd(-60, 60)}deg) scale(1)` }, { offset: 1, opacity: 0 }]);
    }
    return 0.46;
  };

  // ===== Nouvel An : des fusées, une gerbe d'étincelles, un grand flash doré, puis la page s'ouvre en cercle étincelant =====
  const burst = (L, x, y, n, len, cols, t0) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.05, 0.05), l = len * rnd(0.6, 1), c = pick(cols), e = mk(`left:${x}px;top:${y}px;width:${rnd(14, 34)}px;height:3px;margin-top:-1.5px;border-radius:2px;background:linear-gradient(90deg, transparent, ${c});transform-origin:0 50%;will-change:transform,opacity`, L);
      A(e, [{ offset: 0, opacity: 0, transform: `rotate(${a}rad) translateX(0)` }, { offset: t0, opacity: 0, transform: `rotate(${a}rad) translateX(0)` }, { offset: t0 + 0.01, opacity: 1, easing: 'cubic-bezier(.1,.7,.3,1)' }, { offset: Math.min(0.99, t0 + 0.28), opacity: 0, transform: `rotate(${a}rad) translateX(${l}px) translateY(${rnd(10, 40)}px)` }, { offset: 1, opacity: 0 }]);
    }
  };
  const rocket = (L, x, y0, y1, t1, col) => {
    const rk = mk(`left:${x - 3}px;top:0;width:6px;height:46px;border-radius:3px;background:linear-gradient(#fff, ${col} 30%, transparent);will-change:transform,opacity`, L);
    A(rk, [{ offset: 0, transform: `translateY(${y0}px)`, opacity: 1, easing: 'cubic-bezier(.2,.6,.4,1)' }, { offset: t1, transform: `translateY(${y1}px)`, opacity: 1 }, { offset: t1 + 0.01, opacity: 0 }, { offset: 1, opacity: 0 }]);
  };
  K.fireworks = (L, W, H, p) => {
    backdrop(L, 'radial-gradient(100% 80% at 50% 100%, #1b1446, #05040f 70%)', 0, 0.14, 0.495, 0.5);
    const gold = p.spark || '#ffd166', cols = p.sparks || ['#ffd166', '#fff4c2', '#ff6b9a', '#7cc4ff', '#ffffff'];
    rocket(L, W * 0.22, H, H * 0.3, 0.12, '#ff6b9a'); burst(L, W * 0.22, H * 0.3, 36, Math.min(W, H) * 0.25, ['#ff6b9a', '#ffd1e0', '#ffffff'], 0.12);
    rocket(L, W * 0.8, H, H * 0.26, 0.17, '#7cc4ff'); burst(L, W * 0.8, H * 0.26, 36, Math.min(W, H) * 0.25, ['#7cc4ff', '#e0f2ff', '#ffffff'], 0.17);
    rocket(L, W / 2, H, H * 0.45, 0.24, gold); burst(L, W / 2, H * 0.45, 60, Math.min(W, H) * 0.5, cols, 0.24);
    const S = Math.hypot(W, H) * 2.2, fl = mk(`left:${W / 2 - S / 2}px;top:${H * 0.45 - S / 2}px;width:${S}px;height:${S}px;border-radius:50%;background:radial-gradient(circle, #ffffff 0, #fff4c2 30%, ${gold} 62%, ${gold} 70%);will-change:transform,opacity`, L);
    A(fl, [{ offset: 0, transform: 'scale(0)', opacity: 1 }, { offset: 0.3, transform: 'scale(0)', easing: 'cubic-bezier(.5,0,.8,.4)' }, { offset: 0.44, transform: 'scale(1)', opacity: 1 }, { offset: 0.5, opacity: 1 }, { offset: 0.501, opacity: 0 }, { offset: 1, opacity: 0 }]);
    const D = Math.hypot(W, H);
    hole(L, W, H, { fill: gold === '#ffd166' ? '#ffe7a3' : gold, ring: '#ffffff', ringW: 4, cy: H * 0.45, from: 0.495, to: 0.99, k: (f) => (f < 0.52 ? 0 : 2 + eout(cl((f - 0.52) / 0.4)) * D * 0.62) });
    burst(L, W / 2, H * 0.45, 50, D * 0.6, cols, 0.52);
    for (let i = 0; i < 34; i++) {
      const c = pick(cols), e = mk(`left:0;top:0;width:6px;height:6px;border-radius:50%;background:${c};box-shadow:0 0 10px ${c};will-change:transform,opacity`, L), x = rnd(0, W);
      A(e, [{ transform: `translate(${x}px,${rnd(-0.1, 0.4) * H}px)`, opacity: 1 }, { transform: `translate(${x + rnd(-40, 40)}px,${rnd(0.6, 1.1) * H}px)`, opacity: 0 }], { delay: T * rnd(0.55, 0.72), duration: T * 0.38, easing: 'ease-in' });
    }
    return 0.46;
  };

  // ===== 14 Juillet : trois bandes bleu, blanc, rouge tombent en rebondissant, des confettis, puis elles repartent =====
  K.tricolor = (L, W, H) => {
    ['#0055a4', '#ffffff', '#ef4135'].forEach((c, i) => {
      const e = mk(`left:${i * 33.33}%;top:0;width:33.5%;height:100%;background:linear-gradient(90deg, rgba(0,0,0,.08), transparent 30%, rgba(255,255,255,.08) 60%, rgba(0,0,0,.06)), ${c};will-change:transform`, L);
      A(e, [{ offset: 0, transform: 'translateY(-102%)' }, { offset: 0.06 + i * 0.07, transform: 'translateY(-102%)', easing: 'cubic-bezier(.55,0,.9,.5)' }, { offset: 0.24 + i * 0.07, transform: 'translateY(0)', easing: 'cubic-bezier(.3,0,.5,1)' }, { offset: 0.28 + i * 0.07, transform: 'translateY(-3%)', easing: 'cubic-bezier(.5,0,.7,1)' }, { offset: 0.32 + i * 0.07, transform: 'translateY(0)' }, { offset: 0.54 + i * 0.06, transform: 'translateY(0)', easing: 'cubic-bezier(.6,-.15,.7,1)' }, { offset: 0.82 + i * 0.06, transform: 'translateY(102%)' }, { offset: 1, transform: 'translateY(102%)' }]);
    });
    for (let i = 0; i < 60; i++) {
      const w = rnd(8, 14), e = mk(`left:0;top:0;width:${w}px;height:${w * 0.5}px;border-radius:2px;background:${pick(['#0055a4', '#ffffff', '#ef4135', '#ffd166'])};box-shadow:0 0 0 1px rgba(0,0,0,.08);will-change:transform`, L), x = rnd(0, W);
      A(e, [{ transform: `translate(${x}px,-20px) rotate(0deg) rotateX(0deg)` }, { transform: `translate(${x + rnd(-120, 120)}px,${H + 20}px) rotate(${rnd(200, 720)}deg) rotateX(${rnd(300, 900)}deg)` }], { delay: T * rnd(0.3, 0.62), duration: T * rnd(0.35, 0.55), easing: 'cubic-bezier(.3,0,.7,1)' });
    }
    return 0.46;
  };

  // ===== rideaux de théâtre (Fête de la musique, Gothique, Luxe, Fête foraine) =====
  K.curtain = (L, W, H, p) => {
    const c = p.drape || ['#6a0a17', '#c21a33'];
    const pat = p.stripes ? `repeating-linear-gradient(90deg, ${c[0]} 0 5vw, ${c[1]} 5vw 10vw)` : `repeating-linear-gradient(90deg, ${c[0]} 0, ${c[1]} 2.2vw, ${c[0]} 4.4vw)`;
    const shade = 'linear-gradient(180deg, rgba(0,0,0,.3), transparent 22%, transparent 78%, rgba(0,0,0,.4))';
    const fringe = p.fringe ? `linear-gradient(0deg, ${p.fringe} 0 1.4vmin, rgba(0,0,0,.25) 1.4vmin 1.8vmin, transparent 1.8vmin), ` : '';
    const side = (left) => {
      const e = mk(`${left ? 'left' : 'right'}:0;top:0;width:51%;height:100%;background:${fringe}${shade}, ${pat};transform-origin:${left ? '0' : '100%'} 0;will-change:transform;box-shadow:${left ? '' : '-'}14px 0 40px rgba(0,0,0,.45)`, L);
      const out = left ? -101 : 101, s = left ? 1 : -1;
      A(e, [{ offset: 0, transform: `translateX(${out}%) scaleX(.5) skewX(0deg)` }, { offset: 0.06, transform: `translateX(${out}%) scaleX(.5) skewX(0deg)`, easing: 'cubic-bezier(.35,0,.25,1)' }, { offset: 0.36, transform: `translateX(0) scaleX(1) skewX(${s * -2}deg)`, easing: 'ease-out' }, { offset: 0.42, transform: 'translateX(0) scaleX(1) skewX(0deg)' },
        { offset: 0.54, transform: 'translateX(0) scaleX(1) skewX(0deg)', easing: 'cubic-bezier(.55,0,.3,1)' }, { offset: 0.92, transform: `translateX(${out * 0.93}%) scaleX(.42) skewX(${s * 4}deg)` }, { offset: 1, transform: `translateX(${out * 0.93}%) scaleX(.42) skewX(${s * 4}deg)` }]);
    };
    side(true); side(false);
    // un rond de lumière sur le rideau fermé
    const spot = mk(`left:${W / 2 - H * 0.45}px;top:${H * 0.05}px;width:${H * 0.9}px;height:${H * 0.9}px;border-radius:50%;background:radial-gradient(circle, rgba(255,240,200,.38), rgba(255,240,200,.12) 45%, transparent 70%);opacity:0;will-change:opacity`, L);
    A(spot, [{ offset: 0, opacity: 0 }, { offset: 0.38, opacity: 0 }, { offset: 0.44, opacity: 1 }, { offset: 0.54, opacity: 1 }, { offset: 0.62, opacity: 0 }, { offset: 1, opacity: 0 }]);
    const top = mk(`left:0;top:0;width:100%;height:14vh;background:${shade}, ${pat};border-bottom:${p.fringe ? '1.2vmin solid ' + p.fringe : '0'};border-radius:0 0 50% 50% / 0 0 34% 34%;will-change:transform;box-shadow:0 10px 30px rgba(0,0,0,.45)`, L);
    A(top, [{ offset: 0, transform: 'translateY(-110%)', easing: 'cubic-bezier(.3,0,.3,1)' }, { offset: 0.2, transform: 'translateY(0)' }, { offset: 0.62, transform: 'translateY(0)', easing: 'cubic-bezier(.6,0,.4,1)' }, { offset: 0.95, transform: 'translateY(-110%)' }, { offset: 1, transform: 'translateY(-110%)' }]);
    if (p.notes) for (let i = 0; i < 16; i++) {
      const e = mk(`left:0;top:0;font:700 ${rnd(28, 60)}px/1 serif;color:${pick(['#ffd166', '#ffffff', '#f72585'])};will-change:transform,opacity`, L); e.textContent = pick(['♪', '♫', '♬', '♩']);
      const x = rnd(0.1, 0.9) * W;
      A(e, [{ transform: `translate(${x}px,${H * 0.75}px) rotate(0deg)`, opacity: 0 }, { offset: 0.2, opacity: 1 }, { transform: `translate(${x + rnd(-100, 100)}px,${H * 0.05}px) rotate(${rnd(-40, 40)}deg)`, opacity: 0 }], { delay: T * rnd(0.52, 0.66), duration: T * 0.4 });
    }
    return 0.43;
  };

  // ===== Terminal : l'écran s'éteint comme un vieux tube cathodique, « > thèmes_ » s'écrit, puis il se rallume =====
  K.crt = (L, W, H, p) => {
    const g = p.phos || '#41ff8a';
    const top = mk('left:0;top:0;width:100%;height:50.5%;background:#000;transform-origin:50% 0;will-change:transform', L);
    const bot = mk('left:0;bottom:0;width:100%;height:50.5%;background:#000;transform-origin:50% 100%;will-change:transform', L);
    const fr = [{ offset: 0, transform: 'scaleY(0)' }, { offset: 0.14, transform: 'scaleY(0)', easing: 'cubic-bezier(.7,0,.9,.5)' }, { offset: 0.28, transform: 'scaleY(1)' }, { offset: 0.66, transform: 'scaleY(1)', easing: 'cubic-bezier(.15,.8,.3,1)' }, { offset: 0.88, transform: 'scaleY(0)' }, { offset: 1, transform: 'scaleY(0)' }];
    A(top, fr); A(bot, fr);
    // l'image s'écrase d'abord en une ligne blanche, puis en un point
    const line = mk(`left:0;top:50%;width:100%;height:4px;margin-top:-2px;background:#fff;box-shadow:0 0 12px 4px ${g}, 0 0 40px 10px ${g};will-change:transform,opacity`, L);
    A(line, [{ offset: 0, transform: 'scaleX(1)', opacity: 0 }, { offset: 0.2, opacity: 0 }, { offset: 0.27, transform: 'scaleX(1)', opacity: 1, easing: 'cubic-bezier(.7,0,.9,.6)' }, { offset: 0.35, transform: 'scaleX(.004)', opacity: 1 }, { offset: 0.38, transform: 'scaleX(.004)', opacity: 0 }, { offset: 0.58, transform: 'scaleX(.004)', opacity: 0 }, { offset: 0.59, transform: 'scaleX(.004)', opacity: 1, easing: 'cubic-bezier(.2,.8,.3,1)' }, { offset: 0.66, transform: 'scaleX(1)', opacity: 1 }, { offset: 0.72, opacity: 0 }, { offset: 1, opacity: 0 }]);
    const dot = mk(`left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;box-shadow:0 0 18px 6px ${g};will-change:transform,opacity`, L);
    A(dot, [{ offset: 0, opacity: 0 }, { offset: 0.34, opacity: 0, transform: 'scale(1)' }, { offset: 0.35, opacity: 1 }, { offset: 0.42, opacity: 0, transform: 'scale(.1)' }, { offset: 1, opacity: 0 }]);
    // dans le noir, une invite de commande tape « thèmes »
    const fs = Math.max(22, Math.min(W, H) * 0.06), txt = p.cmd || '> thèmes', tw = mk(`left:50%;top:50%;transform:translate(-50%,-50%);font:400 ${fs}px/1 'VT323','JetBrains Mono',ui-monospace,monospace;color:${g};text-shadow:0 0 10px ${g};white-space:pre;opacity:0`, L);
    const chars = []; for (const ch of txt) { const s = document.createElement('span'); s.textContent = ch; s.style.opacity = '0'; tw.appendChild(s); chars.push(s); }
    const cur = document.createElement('span'); cur.textContent = '_'; tw.appendChild(cur);
    A(tw, [{ offset: 0, opacity: 0 }, { offset: 0.4, opacity: 0 }, { offset: 0.41, opacity: 1 }, { offset: 0.56, opacity: 1 }, { offset: 0.58, opacity: 0 }, { offset: 1, opacity: 0 }]);
    chars.forEach((s, i) => A(s, [{ offset: 0, opacity: 0 }, { offset: 0.41 + i * 0.012, opacity: 0 }, { offset: 0.411 + i * 0.012, opacity: 1 }, { offset: 1, opacity: 1 }]));
    A(cur, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, iterations: 12, direction: 'alternate', easing: 'steps(1, end)', fill: 'none' });
    const scan = mk('inset:0;background:repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 3px);opacity:0;will-change:opacity', L);
    A(scan, [{ offset: 0, opacity: 0 }, { offset: 0.1, opacity: 1 }, { offset: 0.9, opacity: 1 }, { offset: 1, opacity: 0 }]);
    return 0.42;
  };

  // ===== Néon, Hologramme, Psyché, Grille : l'image se découpe en bandes qui glissent en grésillant =====
  K.glitch = (L, W, H, p) => {
    const cols = p.glitch || ['#0a0610', '#ff2fd0', '#5af2ff', '#1c0a33'];
    let y = 0, i = 0;
    while (y < H) {
      const h = Math.min(H - y, rnd(0.03, 0.12) * H), c = i % 5 === 2 ? cols[1] : i % 7 === 3 ? cols[2] : i % 2 ? cols[0] : cols[3], dir = i % 2 ? 1 : -1, d = rnd(0.04, 0.22), d2 = rnd(0.52, 0.68);
      const e = mk(`left:0;top:${Math.floor(y)}px;width:100%;height:${Math.ceil(h) + 1}px;background:linear-gradient(90deg, transparent, rgba(255,255,255,.06) 50%, transparent), ${c};will-change:transform;box-shadow:${dir * 7}px 0 0 ${cols[1]}, ${-dir * 7}px 0 0 ${cols[2]}`, L);
      A(e, [{ offset: 0, transform: `translateX(${dir * 110}%)` }, { offset: d, transform: `translateX(${dir * 110}%)`, easing: 'steps(6, end)' }, { offset: d + 0.15, transform: 'translateX(0)' }, { offset: 0.45, transform: `translateX(${rnd(-14, 14)}px)`, easing: 'steps(2, end)' }, { offset: 0.48, transform: 'translateX(0)' },
        { offset: d2, transform: 'translateX(0)', easing: 'steps(6, end)' }, { offset: Math.min(0.96, d2 + 0.2), transform: `translateX(${-dir * 110}%)` }, { offset: 1, transform: `translateX(${-dir * 110}%)` }]);
      y += h; i++;
    }
    const fl = mk(`inset:0;background:${cols[2]};mix-blend-mode:screen;opacity:0;will-change:opacity`, L);
    A(fl, [{ offset: 0, opacity: 0 }, { offset: 0.38, opacity: 0 }, { offset: 0.4, opacity: 0.5 }, { offset: 0.42, opacity: 0 }, { offset: 0.5, opacity: 0.35 }, { offset: 0.52, opacity: 0 }, { offset: 1, opacity: 0 }]);
    return 0.42;
  };

  // ===== Arcade, Iso 3D, Brutal : l'écran se remplit de gros pixels en diagonale (un envahisseur apparaît sur Arcade) =====
  const INVADER = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'];
  K.pixels = (L, W, H, p) => {
    const cols = p.px || ['#2b1a66', '#1a0f3d', '#231452', '#120a2e'], nc = p.cols || 17, cw = W / nc, nr = Math.ceil(H / cw), ease = p.pxEase || 'steps(3, end)';
    const inv = p.invader ? INVADER : null, ir0 = Math.floor((nr - 8) / 2), ic0 = Math.floor((nc - 11) / 2);
    let h = 7;
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const on = inv && r >= ir0 && r < ir0 + 8 && c >= ic0 && c < ic0 + 11 && inv[r - ir0][c - ic0] === 'X';
      const col = on ? (p.invC || '#ffd23f') : cols[h % cols.length], diag = (r + c) / (nr + nc - 2);
      const e = mk(`left:${Math.floor(c * cw)}px;top:${Math.floor(r * cw)}px;width:${Math.ceil(cw) + 1}px;height:${Math.ceil(cw) + 1}px;background:${p.cube ? `linear-gradient(135deg, rgba(255,255,255,.28), transparent 45%, rgba(0,0,0,.25)), ${col}` : col};will-change:transform${p.border ? ';box-shadow:inset 0 0 0 ' + p.border : ''}`, L);
      const a = 0.03 + diag * 0.25 + (on ? 0.06 : 0), b = 0.54 + diag * 0.26;
      A(e, [{ offset: 0, transform: 'scale(0)' }, { offset: a, transform: 'scale(0)', easing: ease }, { offset: a + 0.09, transform: 'scale(1)' }, { offset: b, transform: 'scale(1)', easing: ease }, { offset: b + 0.09, transform: 'scale(0)' }, { offset: 1, transform: 'scale(0)' }]);
    }
    return 0.42;
  };

  // ===== Coucher de soleil : un énorme soleil rayé se lève et remplit l'écran, puis le tout se couche vers le bas =====
  K.sun = (L, W, H) => {
    const panel = mk(`left:0;top:0;width:100%;height:${H * 1.02}px;background:linear-gradient(180deg, #1a0b3d, #6a1f6b 45%, #d63a6b 70%, #ff9a4c);will-change:transform,opacity`, L);
    const grid = mk(`left:-50%;top:${H * 0.62}px;width:200%;height:${H * 0.5}px;background:repeating-linear-gradient(90deg, rgba(255,90,216,.55) 0 2px, transparent 2px 80px), repeating-linear-gradient(0deg, rgba(255,90,216,.55) 0 2px, transparent 2px 40px);transform:perspective(${H * 0.6}px) rotateX(62deg);transform-origin:50% 0`, panel);
    A(panel, [{ offset: 0, opacity: 0, transform: 'translateY(0)' }, { offset: 0.16, opacity: 0, easing: 'ease-in-out' }, { offset: 0.38, opacity: 1, transform: 'translateY(0)' }, { offset: 0.54, opacity: 1, transform: 'translateY(0)', easing: 'cubic-bezier(.5,0,.6,1)' }, { offset: 0.92, opacity: 1, transform: `translateY(${H * 1.05}px)` }, { offset: 1, opacity: 1, transform: `translateY(${H * 1.05}px)` }]);
    void grid;
    const S = Math.hypot(W, H) * 1.22, s = mk(`left:${W / 2 - S / 2}px;top:${H / 2 - S / 2}px;width:${S}px;height:${S}px;border-radius:50%;background:linear-gradient(180deg, transparent 52%, #2a0f4a 52% 54%, transparent 54% 62%, #2a0f4a 62% 65.5%, transparent 65.5% 74%, #2a0f4a 74% 78.5%, transparent 78.5% 86%, #2a0f4a 86% 92%, transparent 92%), linear-gradient(180deg, #fff1a8, #ffd166 30%, #ff9a4c 55%, #ff4f9a);box-shadow:0 0 140px 40px rgba(255,154,76,.45);will-change:transform`, L);
    A(s, [{ offset: 0, transform: `translateY(${H * 0.95}px) scale(.3)`, easing: 'cubic-bezier(.3,.4,.4,1)' }, { offset: 0.43, transform: 'translateY(0) scale(1)' }, { offset: 0.54, transform: 'translateY(0) scale(1.02)', easing: 'cubic-bezier(.5,0,.6,1)' }, { offset: 0.92, transform: `translateY(${H * 1.1 + S / 2}px) scale(1.02)` }, { offset: 1, transform: `translateY(${H * 1.1 + S / 2}px) scale(1.02)` }]);
    return 0.44;
  };

  // ===== Cosmos : saut dans l'hyperespace, flash blanc, puis la page s'ouvre par un cercle lumineux =====
  K.warp = (L, W, H) => {
    backdrop(L, 'radial-gradient(circle, #10183a, #02030a 70%)', 0, 0.14, 0.495, 0.5);
    const Dg = Math.hypot(W, H) / 2;
    for (let i = 0; i < 110; i++) {
      const a = rnd(0, 360), e = mk(`left:${W / 2}px;top:${H / 2}px;width:${rnd(40, 180)}px;height:2px;margin-top:-1px;border-radius:1px;background:linear-gradient(90deg, transparent, ${pick(['#ffffff', '#c8f3ff', '#7c5cff', '#3ab8ff'])});transform-origin:0 50%;will-change:transform,opacity`, L);
      const d = rnd(0.02, 0.3), r0 = rnd(10, 60);
      A(e, [{ offset: 0, opacity: 0, transform: `rotate(${a}deg) translateX(${r0}px) scaleX(.2)` }, { offset: d, opacity: 0, transform: `rotate(${a}deg) translateX(${r0}px) scaleX(.2)`, easing: 'cubic-bezier(.6,0,1,.6)' }, { offset: d + 0.02, opacity: 1 }, { offset: Math.min(0.48, d + 0.16), opacity: 1, transform: `rotate(${a}deg) translateX(${Dg}px) scaleX(2.6)` }, { offset: Math.min(0.49, d + 0.17), opacity: 0 }, { offset: 1, opacity: 0 }]);
    }
    const S = Math.hypot(W, H) * 1.1, fl = centered(S, L, '', 'border-radius:50%;background:radial-gradient(circle, #ffffff 0, #e6f6ff 45%, #b9d7ff 70%)');
    A(fl, [{ offset: 0, transform: 'scale(0)', opacity: 1 }, { offset: 0.32, transform: 'scale(0)', easing: 'cubic-bezier(.7,0,1,.5)' }, { offset: 0.44, transform: 'scale(1)', opacity: 1 }, { offset: 0.5, opacity: 1 }, { offset: 0.501, opacity: 0 }, { offset: 1, opacity: 0 }]);
    const D = Math.hypot(W, H);
    hole(L, W, H, { fill: '#e8f4ff', ring: '#7cc4ff', ringW: 5, from: 0.495, to: 0.99, k: (f) => (f < 0.52 ? 0 : 2 + ein(cl((f - 0.52) / 0.4)) * D * 0.62) });
    // en sortant de l'hyperespace, les étoiles filent encore par-dessus la page
    for (let i = 0; i < 40; i++) {
      const a = rnd(0, 360), e = mk(`left:${W / 2}px;top:${H / 2}px;width:${rnd(60, 200)}px;height:2px;margin-top:-1px;background:linear-gradient(90deg, transparent, #ffffff);transform-origin:0 50%;will-change:transform,opacity`, L);
      A(e, [{ offset: 0, opacity: 0 }, { offset: 0.54, opacity: 0, transform: `rotate(${a}deg) translateX(${rnd(20, 120)}px) scaleX(.5)` }, { offset: 0.56, opacity: 1, easing: 'cubic-bezier(.2,.6,.4,1)' }, { offset: 0.86, opacity: 0, transform: `rotate(${a}deg) translateX(${Dg * 1.2}px) scaleX(2)` }, { offset: 1, opacity: 0 }]);
    }
    return 0.45;
  };

  // ===== Rentrée : le tableau noir glisse, « Thèmes » s'écrit à la craie, puis la brosse efface tout =====
  K.chalk = (L, W, H) => {
    const p = mk('left:0;top:0;width:100%;height:100%;will-change:transform', L);
    mk('inset:0;background:radial-gradient(40% 30% at 30% 40%, rgba(255,255,255,.08), transparent), radial-gradient(30% 40% at 70% 70%, rgba(255,255,255,.06), transparent), radial-gradient(60% 50% at 50% 50%, rgba(255,255,255,.04), transparent), linear-gradient(160deg, #2c5238, #1c3a29)', p);
    mk('left:0;top:0;width:100%;height:100%;box-shadow:inset 0 0 0 1.6vmin #8a5a2b, inset 0 0 0 2.2vmin #5e3a19, inset 0 0 60px rgba(0,0,0,.5)', p);
    mk('left:4vmin;bottom:2.4vmin;width:14vmin;height:1.6vmin;border-radius:.8vmin;background:#f4f1e6;box-shadow:0 2px 4px rgba(0,0,0,.4)', p);
    const fs = Math.min(W * 0.16, H * 0.3), tx = mk(`left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font:700 ${fs}px/1 'Caveat',cursive;color:rgba(245,245,235,.92);text-shadow:0 0 2px rgba(255,255,255,.5);will-change:clip-path`, p);
    tx.textContent = 'Thèmes';
    A(tx, [{ offset: 0, clipPath: 'inset(0 100% 0 0)' }, { offset: 0.3, clipPath: 'inset(0 100% 0 0)', easing: 'cubic-bezier(.4,0,.6,1)' }, { offset: 0.48, clipPath: 'inset(0 0% 0 0)' }, { offset: 1, clipPath: 'inset(0 0% 0 0)' }]);
    // la brosse au bord droit du tableau : elle mène quand il repart et efface
    mk('right:-5vmin;top:30%;width:10vmin;height:40%;border-radius:2vmin;background:linear-gradient(90deg, #d8c39b 0 34%, #5b4433 34%);box-shadow:4px 6px 20px rgba(0,0,0,.45)', p);
    A(p, [{ offset: 0, transform: 'translateX(-110%)' }, { offset: 0.08, transform: 'translateX(-110%)', easing: 'cubic-bezier(.3,.2,.2,1)' }, { offset: 0.38, transform: 'translateX(0)' }, { offset: 0.56, transform: 'translateX(0)', easing: 'cubic-bezier(.55,0,.4,1)' }, { offset: 0.94, transform: 'translateX(112%)' }, { offset: 1, transform: 'translateX(112%)' }]);
    for (let i = 0; i < 30; i++) {
      const s = rnd(3, 9), e = mk(`left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:rgba(245,245,235,.7);will-change:transform,opacity`, L), y = rnd(0.3, 0.7) * H, x = W * rnd(0.3, 0.95);
      A(e, [{ transform: `translate(${x}px,${y}px)`, opacity: 0.9 }, { transform: `translate(${x + rnd(-20, 60)}px,${y + rnd(80, 240)}px)`, opacity: 0 }], { delay: T * rnd(0.58, 0.82), duration: T * 0.3 });
    }
    return 0.43;
  };

  // ===== Papier : une feuille à carreaux glisse par-dessus, « Thèmes » est écrit dessus, puis elle s'envole =====
  K.paper = (L, W, H) => {
    const sh = mk(`left:${-W * 0.1}px;top:${-H * 0.1}px;width:${W * 1.2}px;height:${H * 1.2}px;background:linear-gradient(90deg, transparent 14%, rgba(220,60,60,.55) 14% calc(14% + 2px), transparent calc(14% + 2px)), repeating-linear-gradient(0deg, rgba(80,110,200,.35) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgba(80,110,200,.12) 0 1px, transparent 1px 32px), repeating-linear-gradient(0deg, rgba(80,110,200,.12) 0 1px, transparent 1px 8px), #fbf8f1;box-shadow:0 20px 60px rgba(0,0,0,.35);transform-origin:50% 0;will-change:transform`, L);
    const fs = Math.min(W * 0.14, H * 0.26), tx = mk(`left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font:700 ${fs}px/1 'Caveat',cursive;color:#1f3a8a;transform:rotate(-3deg);will-change:clip-path`, sh);
    tx.textContent = 'Thèmes';
    A(tx, [{ offset: 0, clipPath: 'inset(0 100% 0 0)' }, { offset: 0.3, clipPath: 'inset(0 100% 0 0)', easing: 'cubic-bezier(.4,0,.6,1)' }, { offset: 0.5, clipPath: 'inset(0 0% 0 0)' }, { offset: 1, clipPath: 'inset(0 0% 0 0)' }]);
    A(sh, [{ offset: 0, transform: `translate(${W * 0.05}px,${H * 1.15}px) rotate(9deg)` }, { offset: 0.08, transform: `translate(${W * 0.05}px,${H * 1.15}px) rotate(9deg)`, easing: 'cubic-bezier(.25,.6,.3,1)' }, { offset: 0.38, transform: 'translate(0,0) rotate(-1deg)' }, { offset: 0.56, transform: 'translate(0,0) rotate(-1deg)', easing: 'cubic-bezier(.55,0,.6,1)' }, { offset: 0.94, transform: `translate(${-W * 0.9}px,${-H * 1.25}px) perspective(${H * 2}px) rotateX(35deg) rotate(-24deg)` }, { offset: 1, transform: `translate(${-W * 0.9}px,${-H * 1.25}px) perspective(${H * 2}px) rotateX(35deg) rotate(-24deg)` }]);
    const s = Math.min(W, H) * 0.2, pl = mk(`left:0;top:0;width:${s}px;height:${s}px;will-change:transform;filter:drop-shadow(0 8px 6px rgba(0,0,0,.18))`, L, svgBox('0 0 100 100', '<path d="M2 50 L98 10 L60 92 L46 60 Z" fill="#ffffff" stroke="#9aa6c2" stroke-width="2" stroke-linejoin="round"/><path d="M98 10 L46 60 L40 82 Z" fill="#dfe5f2" stroke="#9aa6c2" stroke-width="2" stroke-linejoin="round"/>'));
    A(pl, [{ transform: `translate(${-s}px,${H * 0.8}px) rotate(-14deg)` }, { offset: 0.45, transform: `translate(${W * 0.4}px,${H * 0.62}px) rotate(-26deg)` }, { offset: 0.7, transform: `translate(${W * 0.7}px,${H * 0.3}px) rotate(-40deg)` }, { transform: `translate(${W + s}px,${H * 0.05}px) rotate(-10deg)` }], { duration: T * 0.98, easing: 'ease-in-out' });
    return 0.42;
  };

  // ===== Bonbon : un nappage rose coule du haut, avec des vermicelles, puis il glisse vers le bas =====
  K.drip = (L, W, H, p) => {
    const cols = p.syrup || ['#ff8fc7', '#ffd1e8'];
    const drips = (c) => svgBox('0 0 1000 120', `<path d="M0 0 L1000 0 L1000 40 C980 40 975 100 955 100 C935 100 940 40 910 40 C870 40 860 70 840 70 C820 70 815 40 780 40 C740 40 735 115 712 115 C690 115 690 40 650 40 C610 40 600 60 585 60 C570 60 565 40 530 40 C490 40 485 95 465 95 C445 95 445 40 400 40 C360 40 355 75 335 75 C315 75 312 40 270 40 C230 40 228 110 205 110 C182 110 180 40 140 40 C100 40 98 65 80 65 C62 65 60 40 30 40 C15 40 10 50 0 50 Z" fill="${c}"/><g fill="#ffffff" opacity=".45"><ellipse cx="955" cy="88" rx="4" ry="7"/><ellipse cx="712" cy="102" rx="4" ry="7"/><ellipse cx="465" cy="83" rx="4" ry="7"/><ellipse cx="205" cy="97" rx="4" ry="7"/></g>`, 'none');
    cols.slice().reverse().forEach((c, i) => {
      const front = i === 1, e = mk(`left:0;top:0;width:100%;height:${H * 1.35}px;will-change:transform`, L);
      mk(`left:0;top:0;width:100%;height:${H * 1.2 + 1}px;background:linear-gradient(100deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.28) 42%, rgba(255,255,255,0) 54%), ${c}`, e);
      mk(`left:0;top:${H * 1.2}px;width:100%;height:${H * 0.15}px`, e, drips(c));
      if (front) for (let k = 0; k < 70; k++) mk(`left:${rnd(0, 100)}%;top:${rnd(0.02, 1.15) * H}px;width:${rnd(14, 22)}px;height:6px;border-radius:3px;background:${pick(['#ffffff', '#5bc0eb', '#fde74c', '#9bc53d', '#e55934', '#a06cd5'])};transform:rotate(${rnd(0, 180)}deg)`, e);
      const late = front ? 0.05 : 0;
      A(e, [{ offset: 0, transform: `translateY(${-H * 1.4}px)` }, { offset: 0.04 + late, transform: `translateY(${-H * 1.4}px)`, easing: 'cubic-bezier(.45,0,.3,1)' }, { offset: 0.42, transform: `translateY(${-H * 0.05}px)` }, { offset: 0.55, transform: `translateY(${-H * 0.02}px)`, easing: 'cubic-bezier(.55,0,.5,1)' }, { offset: 0.95 - late, transform: `translateY(${H * 1.05}px)` }, { offset: 1, transform: `translateY(${H * 1.05}px)` }]);
    });
    return 0.43;
  };

  // ===== ferme, cerfs-volants : de gros nuages arrivent des deux côtés puis s'écartent =====
  const CLOUD = 'M20 70 C0 70 0 44 22 42 C20 22 46 14 58 30 C66 10 100 10 106 34 C126 22 152 34 146 54 C166 56 166 80 146 80 L24 80 C10 80 8 72 20 70 Z';
  K.clouds = (L, W, H, p) => {
    backdrop(L, p.skyBg || 'linear-gradient(180deg, #dff1ff, #ffffff)', 0.26, 0.42, 0.56, 0.86);
    const items = [];
    for (let i = 0; i < 16; i++) items.push({ left: i % 2 === 0, s: W * rnd(0.55, 0.9), y: (i / 16) * H * 1.15 - H * 0.12 });
    items.forEach((it, i) => {
      const { left, s, y } = it, id = gid('cl');
      const e = mk(`left:0;top:0;width:${s}px;height:${s * 0.53}px;will-change:transform`, L, svgBox('0 0 170 90', `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e6f5"/></linearGradient></defs><path d="${CLOUD}" fill="url(#${id})"/>`));
      const from = left ? -s - 20 : W + 20, mid = left ? rnd(-0.2, 0.2) * W : W - s - rnd(-0.2, 0.2) * W;
      A(e, [{ offset: 0, transform: `translate(${from}px,${y}px)` }, { offset: rnd(0.02, 0.12), transform: `translate(${from}px,${y}px)`, easing: 'cubic-bezier(.3,.5,.3,1)' }, { offset: 0.42, transform: `translate(${mid}px,${y}px)` }, { offset: 0.55, transform: `translate(${mid + (left ? 12 : -12)}px,${y}px)`, easing: 'cubic-bezier(.55,0,.6,1)' }, { offset: 0.93, transform: `translate(${from}px,${y - 30}px)` }, { offset: 1, transform: `translate(${from}px,${y - 30}px)` }]);
    });
    if (p.kite) {
      const s = Math.min(W, H) * 0.22, k = mk(`left:0;top:0;width:${s}px;height:${s * 1.6}px;will-change:transform`, L, svgBox('0 0 100 160', '<path d="M50 0 L95 45 L50 100 L5 45 Z" fill="#e63946"/><path d="M50 0 L50 100 M5 45 L95 45" stroke="#fff" stroke-width="3"/><path d="M50 0 L95 45 L50 45 Z" fill="#ffd166"/><path d="M50 100 C40 115 60 125 50 140 C40 150 55 155 50 160" stroke="#264653" stroke-width="2" fill="none"/>'));
      A(k, [{ transform: `translate(${-s}px,${H * 0.6}px) rotate(-20deg)` }, { offset: 0.5, transform: `translate(${W * 0.45}px,${H * 0.15}px) rotate(10deg)` }, { transform: `translate(${W + s}px,${-s * 1.6}px) rotate(25deg)` }], { delay: T * 0.42, duration: T * 0.55, easing: 'ease-in-out' });
    }
    return 0.43;
  };

  // ===== forêt sous la pluie, Londres : une averse, un rideau d'eau tombe, puis il ruisselle vers le bas =====
  K.rain = (L, W, H, p) => {
    const bgc = p.rainBg || 'linear-gradient(180deg, #4f6b66, #1f2d2e)';
    const wall = mk(`left:0;top:0;width:100%;height:${H * 1.3}px;background:repeating-linear-gradient(100deg, rgba(255,255,255,.05) 0 2px, transparent 2px 28px), ${bgc};-webkit-mask-image:linear-gradient(180deg, #000 76%, transparent);mask-image:linear-gradient(180deg, #000 76%, transparent);will-change:transform`, L);
    A(wall, [{ offset: 0, transform: `translateY(${-H * 1.32}px)` }, { offset: 0.1, transform: `translateY(${-H * 1.32}px)`, easing: 'cubic-bezier(.45,0,.4,1)' }, { offset: 0.42, transform: 'translateY(0)' }, { offset: 0.55, transform: 'translateY(0)', easing: 'cubic-bezier(.55,0,.55,1)' }, { offset: 0.95, transform: `translateY(${H * 1.02}px)` }, { offset: 1, transform: `translateY(${H * 1.02}px)` }]);
    for (let i = 0; i < 110; i++) {
      const l = rnd(50, 150), e = mk(`left:0;top:0;width:2px;height:${l}px;background:linear-gradient(transparent, rgba(220,235,255,${rnd(0.4, 0.85).toFixed(2)}));will-change:transform`, L), x = rnd(-0.1, 1.15) * W;
      A(e, [{ transform: `translate(${x}px,${-l}px) rotate(12deg)` }, { transform: `translate(${x - H * 0.21}px,${H + l}px) rotate(12deg)` }], { delay: rnd(0, 0.75) * T, duration: rnd(240, 380), iterations: 2, easing: 'linear', fill: 'none' });
    }
    // des éclaboussures en bas
    for (let i = 0; i < 26; i++) {
      const e = mk(`left:0;top:0;width:14px;height:7px;border:2px solid rgba(220,235,255,.6);border-bottom:0;border-radius:14px 14px 0 0;will-change:transform,opacity`, L), x = rnd(0, W);
      A(e, [{ transform: `translate(${x}px,${H - 12}px) scale(.2)`, opacity: 1 }, { transform: `translate(${x}px,${H - 16}px) scale(1.6)`, opacity: 0 }], { delay: T * rnd(0.02, 0.4), duration: 300, iterations: 2, fill: 'none' });
    }
    if (p.bolt) { const f = mk('inset:0;background:#e8f0ff;opacity:0;will-change:opacity', L); A(f, [{ offset: 0, opacity: 0 }, { offset: 0.2, opacity: 0 }, { offset: 0.21, opacity: 0.55 }, { offset: 0.23, opacity: 0 }, { offset: 0.25, opacity: 0.35 }, { offset: 0.28, opacity: 0 }, { offset: 1, opacity: 0 }]); }
    return 0.43;
  };

  // ===== camping, et thèmes perso : un cercle se referme comme au cinéma, puis se rouvre =====
  K.iris = (L, W, H, p) => {
    const R = Math.hypot(W, H) / 2 + 8, col = p.irisC || '#070b1e';
    hole(L, W, H, { fill: col, ring: p.ring || 'rgba(255,190,110,.9)', ringW: 3, from: 0, to: 0.99, k: (f) => (f < 0.42 ? R * (1 - ein(f / 0.42)) : f < 0.54 ? 0 : 1 + eout(cl((f - 0.54) / 0.38)) * R) });
    if (p.stars !== false) for (let i = 0; i < 30; i++) {
      const s = rnd(2, 4), e = mk(`left:${rnd(0, W)}px;top:${rnd(0, H)}px;width:${s}px;height:${s}px;border-radius:50%;background:#fff;opacity:0;will-change:opacity`, L);
      A(e, [{ offset: 0, opacity: 0 }, { offset: 0.3, opacity: 0 }, { offset: 0.42, opacity: rnd(0.4, 1) }, { offset: 0.54, opacity: rnd(0.4, 1) }, { offset: 0.66, opacity: 0 }, { offset: 1, opacity: 0 }]);
    }
    if (p.sparkles !== false) for (let i = 0; i < 22; i++) {
      const s = rnd(4, 9), e = mk(`left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:${pick(['#ffd97a', '#ff9a3c', '#fff3c8'])};box-shadow:0 0 12px #ffb347;will-change:transform,opacity`, L), x = W / 2 + rnd(-0.08, 0.08) * W, y = H * rnd(0.5, 0.65);
      A(e, [{ transform: `translate(${x}px,${y}px)`, opacity: 0 }, { offset: 0.2, opacity: 1 }, { transform: `translate(${x + rnd(-120, 120)}px,${y - rnd(150, 420)}px)`, opacity: 0 }], { delay: T * rnd(0.36, 0.62), duration: T * 0.42 });
    }
    return 0.43;
  };

  // mouvements réduits : un simple fondu
  K.fade = (L, W, H, p) => { backdrop(L, p.irisC || '#000', 0, 0.4, 0.55, 1); return 0.42; };

  // ---------- quel thème → quelle transition ----------
  const MAP = {
    spooky: ['bats'], gotham: ['batsignal'],
    autumn: ['leaf'],
    orchard: ['leaf', { leaves: [['#c6ec7a', '#8cc84b', '#4f8f2a', '#2f5e16'], ['#d8f08a', '#a6d65a', '#5a9e2f', '#356a18'], ['#ff8a6a', '#f05a3c', '#c8321e', '#8a1c10']], vein: '#f0ffd0' }],
    vineyard: ['leaf', { leaves: [['#c08ad0', '#8a3a8c', '#5a2a6e', '#3a1648'], ['#c2e07a', '#9cc24a', '#4f7a24', '#2f4e12'], ['#ffd27a', '#e8a03a', '#a8531c', '#6a3010']], vein: '#ffe8ff' }],
    rainwood: ['rain'], london: ['rain', { rainBg: 'linear-gradient(180deg, #3d3a6b, #121a36)', bolt: true }],
    winter: ['frost'], alpine: ['frost', { flake: '#e63946' }], polar: ['frost', { ice: ['#eafff6', '#9fe8ff', '#38b8ff'], flake: '#6dffb0' }], skating: ['frost', { flake: '#c27a9a' }], glacier: ['frost', { flake: '#2b7fff' }],
    xmas: ['gift'], newyear: ['fireworks'], bastille: ['tricolor'], valentine: ['hearts'],
    spring: ['petals'], zen: ['petals', { petals: ['#ffe0ea', '#f7a8c4', '#fff3f7'], bloomBg: '#fff1f5' }], easter: ['petals', { petals: ['#fff1cf', '#ffd27a', '#e8f7ff'], bloomBg: '#eaf7ff' }],
    farm: ['clouds'], kites: ['clouds', { skyBg: 'linear-gradient(180deg, #a8dcff, #eaf8ff)', kite: true }],
    april: ['bubbles'], summer: ['wave'], tropical: ['wave', { sea: ['#7ff0e6', '#17b5c9', '#0b6f9e'] }],
    music: ['curtain', { fringe: '#ffd166', notes: true }], gothic: ['curtain', { drape: ['#1e070a', '#5a1219'], fringe: '#8a6a2a' }], luxe: ['curtain', { drape: ['#3a2c14', '#a87a2f'], fringe: '#fbe9bd' }], fair: ['curtain', { stripes: true, drape: ['#e63946', '#fff3e0'], fringe: '#ffd166' }],
    terminal: ['crt'], matrix: ['crt', { phos: '#ff5a36', cmd: '> THÈMES' }],
    neon: ['glitch'], holo: ['glitch', { glitch: ['#020409', '#22d3ee', '#9ff8ff', '#06283a'] }], trippy: ['glitch', { glitch: ['#12002b', '#ff4fd8', '#00c2a8', '#7b2ff7'] }], grid: ['glitch', { glitch: ['#000000', '#4ade80', '#ffffff', '#0b1a10'] }],
    arcade: ['pixels', { invader: true, invC: '#ffd23f' }],
    iso: ['pixels', { px: ['#2b1a4a', '#3a2466', '#ffb84d', '#ff7a59', '#5ad1ff'], cols: 12, pxEase: 'cubic-bezier(.3,1.5,.5,1)', cube: true }],
    brutal: ['pixels', { px: ['#ffe14d', '#111111', '#ffffff', '#ffe14d'], cols: 6, border: '4px #111', pxEase: 'cubic-bezier(.7,0,.3,1)' }],
    sunset: ['sun'], cosmos: ['warp'], rentree: ['chalk'], paper: ['paper'], candy: ['drip'], camping: ['iris'],
  };
  const kindFor = (id) => (MAP[id] || ['iris'])[0];

  let cur = null;
  const play = (id, pal, onCover) => {
    if (cur) cur();
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const m = MAP[id] || ['iris', { irisC: (pal && pal.bg2) || '#0b0b10', ring: (pal && pal.accent) || '#ffffff', sparkles: false, stars: false }];
    const kind = reduce ? 'fade' : m[0], opt = { ...(pal || {}), ...(m[1] || {}) };
    const W = window.innerWidth, H = window.innerHeight;
    const L = document.createElement('div');
    L.setAttribute('data-fh-trans', kind);
    L.style.cssText = 'position:fixed;inset:0;z-index:2147483000;overflow:hidden;pointer-events:auto;contain:strict';
    L.addEventListener('contextmenu', (e) => e.preventDefault());
    document.body.appendChild(L);
    let coverAt = 0.44, covered = false, done = false;
    try { coverAt = K[kind](L, W, H, opt) || coverAt; } catch (e) { console.error(e); coverAt = 0; }
    // mouvements réduits : tout va plus vite
    const dur = kind === 'fade' ? 500 : T;
    if (kind === 'fade') L.getAnimations({ subtree: true }).forEach(a => a.effect.updateTiming({ duration: dur }));
    const cover = () => { if (covered) return; covered = true; try { onCover && onCover(); } catch (e) { console.error(e); } };
    const end = () => { if (done) return; done = true; cover(); L.remove(); if (cur === end) cur = null; };
    const t1 = setTimeout(cover, coverAt * dur);
    const t2 = setTimeout(end, dur + 60);
    cur = () => { clearTimeout(t1); clearTimeout(t2); end(); };
    return cur;
  };

  window.FHTrans = { play, kindFor, MAP, T };
})();
