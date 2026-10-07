/* findheure · décors animés des thèmes (le décor Halloween, lui, est dans index.html)
   Chaque décor = un dessin fixe en SVG (1600 × 900, transformé une seule fois en image)
   + quelques calques animés qui ne bougent qu'avec transform / opacity : fluide même sur un vieil ordinateur de classe.
   La scène est cadrée comme une image « cover » ancrée en bas : 1em = 10 unités du dessin. */
(function () {
  'use strict';
  const W = 1600, H = 900;
  const N = (v) => Math.round(v * 10) / 10;
  const P = (pts) => pts.map(([x, y]) => N(x) + ' ' + N(y)).join(' L');
  const em = (v) => N(v / 10) / 1 + 'em';
  function prng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seedOf(s) { let a = 7; for (let i = 0; i < s.length; i++) a = (Math.imul(a, 31) + s.charCodeAt(i)) | 0; return a; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const rr = (r, a, b) => a + r() * (b - a);

  // ---------- SVG ----------
  const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
  const URIS = new Map();
  const cached = (key, make) => { let u = URIS.get(key); if (!u) { u = `url("data:image/svg+xml,${encodeURIComponent(make())}")`; URIS.set(key, u); } return u; };
  const stp = ([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a !== 1 ? ` stop-opacity="${a}"` : ''}/>`;
  const lg = (id, stops, x2, y2, x1, y1) => `<linearGradient id="${id}" x1="${x1 || 0}" y1="${y1 || 0}" x2="${x2 == null ? 0 : x2}" y2="${y2 == null ? 1 : y2}">${stops.map(stp).join('')}</linearGradient>`;
  const rg = (id, stops, cx, cy, r, extra) => `<radialGradient id="${id}" cx="${cx == null ? 0.5 : cx}" cy="${cy == null ? 0.5 : cy}" r="${r == null ? 0.5 : r}"${extra || ''}>${stops.map(stp).join('')}</radialGradient>`;
  const rect = (x, y, w, h, fill, extra) => `<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" fill="${fill}"${extra || ''}/>`;
  const circ = (x, y, r, fill, extra) => `<circle cx="${N(x)}" cy="${N(y)}" r="${N(r)}" fill="${fill}"${extra || ''}/>`;
  const ell = (x, y, rx, ry, fill, extra) => `<ellipse cx="${N(x)}" cy="${N(y)}" rx="${N(rx)}" ry="${N(ry)}" fill="${fill}"${extra || ''}/>`;
  const path = (d, fill, extra) => `<path d="${d}" fill="${fill}"${extra || ''}/>`;
  const line = (d, stroke, w, extra) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra || ''}/>`;
  const sky = (id, stops) => `<defs>${lg(id, stops)}</defs>${rect(0, 0, W, H, `url(#${id})`)}`;
  const glow = (id, x, y, r, c, a) => `<defs>${rg(id, [[0, c, a == null ? 0.6 : a], [0.4, c, (a == null ? 0.6 : a) * 0.35], [1, c, 0]])}</defs>${circ(x, y, r, `url(#${id})`)}`;

  // relief : somme de sinus + un peu de bruit, puis lissage (collines) ou lignes brisées (montagnes)
  function profile(r, o) {
    const x0 = o.x0 == null ? -40 : o.x0, x1 = o.x1 == null ? W + 40 : o.x1, n = o.n || 24, f = o.f || [1.2, 2.9, 6.7], w = o.w || [0.55, 0.3, 0.15];
    const ph = f.map(() => r() * Math.PI * 2), pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; let v = 0; f.forEach((q, k) => { v += w[k] * Math.sin(t * Math.PI * 2 * q + ph[k]); }); pts.push([x0 + (x1 - x0) * t, o.y - o.amp * (0.5 + 0.5 * v) + (r() - 0.5) * (o.jitter || 0)]); }
    return pts;
  }
  function smooth(pts, base) {
    const b = base == null ? H + 10 : base;
    let d = `M${N(pts[0][0])} ${b} L${N(pts[0][0])} ${N(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [a, c] = pts[i + 1]; d += ` Q${N(x)} ${N(y)} ${N((x + a) / 2)} ${N((y + c) / 2)}`; }
    const L = pts[pts.length - 1]; return d + ` L${N(L[0])} ${N(L[1])} L${N(L[0])} ${b}Z`;
  }
  const hill = (r, o, fill, extra) => path(smooth(profile(r, o), o.base), fill, extra);
  // chaîne de montagnes : pics, face à l'ombre, calottes de neige (découpées sur la montagne)
  function mountains(r, id, o) {
    const n = o.n || 8, x0 = o.x0 == null ? -80 : o.x0, x1 = o.x1 == null ? W + 80 : o.x1, base = o.base == null ? H + 10 : o.base, span = (x1 - x0) / n;
    const pk = [];
    // « valley » : pics plus bas au centre de l'image (là où s'affiche l'heure)
    const k = (x) => (o.valley ? 1 - o.valley * Math.max(0, 1 - Math.abs(x - W / 2) / (W * 0.42)) : 1);
    for (let i = 0; i <= n * 2; i++) { const x = x0 + span * i / 2 + (r() - 0.5) * span * 0.3; pk.push([x, i % 2 ? o.y - o.amp * k(x) * (0.12 + r() * 0.28) : o.y - o.amp * k(x) * (0.55 + r() * 0.45)]); }
    const fine = [];
    for (let i = 0; i < pk.length - 1; i++) { const [ax, ay] = pk[i], [bx, by] = pk[i + 1]; for (let k = 0; k < 5; k++) { const t = k / 5; fine.push([ax + (bx - ax) * t + (k ? (r() - 0.5) * 8 : 0), ay + (by - ay) * t + (k ? (r() - 0.5) * o.amp * 0.07 : 0)]); } }
    fine.push(pk[pk.length - 1]);
    const d = `M${N(x0)} ${base} L${P(fine)} L${N(x1)} ${base}Z`;
    let s = `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>` + path(d, o.fill);
    let shade = '', snow = '';
    for (let i = 0; i < pk.length; i += 2) {
      const [px, py] = pk[i], nx = pk[i + 1] || [px + span / 2, base], pv = pk[i - 1] || [px - span / 2, base];
      if (o.shade) shade += path(`M${N(px)} ${N(py - 2)} L${N(nx[0] + 30)} ${N(nx[1] + 4)} L${N(nx[0] + 30)} ${base} L${N(px + (nx[0] - px) * 0.25)} ${base}Z`, o.shade);
      if (o.snow) { const sy = py + (Math.min(pv[1], nx[1]) - py) * (o.snowLine || 0.38), z = []; const lx = px - span * 0.55, rx = px + span * 0.55; for (let k = 0; k <= 8; k++) z.push([rx - (rx - lx) * k / 8, sy + (k % 2 ? 10 + r() * 16 : -4 - r() * 8)]); snow += path(`M${N(px)} ${N(py - 6)} L${P(z)}Z`, o.snow); }
    }
    // brume en bas de la chaîne : donne de la profondeur avec le plan suivant
    const haze = o.haze ? `<defs>${lg(id + 'h', [[0, o.haze, 0], [1, o.haze, o.hazeA || 0.55]])}</defs>` + rect(x0, o.y - o.amp * 0.35, x1 - x0, base - (o.y - o.amp * 0.35), `url(#${id}h)`) : '';
    if (shade || snow || haze) s += `<g clip-path="url(#${id})">${shade}${snow}${haze}</g>`;
    return s;
  }
  // sapin (étages de branches), éventuellement enneigé
  function pine(x, y, h, c, o) {
    o = o || {};
    const w = h * (o.w || 0.36), tiers = o.tiers || 4;
    let s = rect(x - h * 0.035, y - h * 0.16, h * 0.07, h * 0.17, o.trunk || c);
    for (let i = 0; i < tiers; i++) {
      const top = y - h + i * h * 0.19, bot = y - h * 0.1 - (tiers - 1 - i) * h * 0.17, hw = w * (0.42 + 0.58 * (i + 1) / tiers);
      s += path(`M${N(x)} ${N(top)} L${N(x + hw)} ${N(bot)} Q${N(x)} ${N(bot - h * 0.05)} ${N(x - hw)} ${N(bot)}Z`, c);
      if (o.light) s += path(`M${N(x)} ${N(top)} L${N(x - hw)} ${N(bot)} Q${N(x - hw * 0.4)} ${N(bot - h * 0.03)} ${N(x - hw * 0.05)} ${N(bot - h * 0.04)}Z`, o.light);
      if (o.snow) s += path(`M${N(x)} ${N(top)} L${N(x + hw * 0.62)} ${N(top + (bot - top) * 0.62)} Q${N(x + hw * 0.2)} ${N(top + (bot - top) * 0.46)} ${N(x)} ${N(top + (bot - top) * 0.56)} Q${N(x - hw * 0.3)} ${N(top + (bot - top) * 0.44)} ${N(x - hw * 0.72)} ${N(top + (bot - top) * 0.66)}Z`, o.snow);
    }
    return s;
  }
  // arbre feuillu : tronc, branches, houppier fait de cercles (ombre, couleur, lumière)
  function leafy(r, x, y, h, o) {
    const tr = o.trunk, R = h * 0.3, cx = x, cy = y - h * 0.66;
    let s = path(`M${N(x - h * 0.05)} ${N(y)} Q${N(x - h * 0.02)} ${N(y - h * 0.3)} ${N(x - h * 0.014)} ${N(y - h * 0.6)} L${N(x + h * 0.014)} ${N(y - h * 0.6)} Q${N(x + h * 0.02)} ${N(y - h * 0.3)} ${N(x + h * 0.05)} ${N(y)}Z`, tr);
    s += line(`M${N(x)} ${N(y - h * 0.38)} Q${N(x - h * 0.08)} ${N(y - h * 0.48)} ${N(x - h * 0.17)} ${N(y - h * 0.6)}`, tr, N(h * 0.022)) + line(`M${N(x)} ${N(y - h * 0.45)} Q${N(x + h * 0.08)} ${N(y - h * 0.55)} ${N(x + h * 0.16)} ${N(y - h * 0.64)}`, tr, N(h * 0.02));
    const blobs = []; for (let i = 0; i < (o.n || 16); i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R; blobs.push([cx + Math.cos(a) * d * 1.2, cy + Math.sin(a) * d * 0.82, R * (0.3 + r() * 0.22)]); }
    if (o.shadow) s += blobs.map(([bx, by, br]) => circ(bx + br * 0.18, by + br * 0.22, br, o.shadow)).join('');
    s += blobs.map(([bx, by, br]) => circ(bx, by, br, pick(r, o.cols))).join('');
    if (o.light) s += blobs.filter(([bx, by]) => bx < cx && by < cy + R * 0.2).map(([bx, by, br]) => circ(bx - br * 0.25, by - br * 0.3, br * 0.45, o.light)).join('');
    if (o.dots) for (let i = 0; i < o.dots.n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 1.1; s += circ(cx + Math.cos(a) * d * 1.2, cy + Math.sin(a) * d * 0.8, o.dots.r * (0.6 + r() * 0.8), pick(r, o.dots.c)); }
    return s;
  }
  // nuage : boules + base arrondie (option : ombre dessous, reflet clair dessus)
  function cloud(x, y, k, fill, shade, hi) {
    const c = [[0, 0, 46], [-58, 14, 34], [60, 12, 38], [-24, -22, 36], [30, -26, 40], [-98, 24, 22], [100, 24, 24]];
    const g = (f, dx, dy, s) => `<g fill="${f}">${c.map(([a, b, q]) => `<circle cx="${N(x + (a + dx) * k)}" cy="${N(y + (b + dy) * k)}" r="${N(q * k * s)}"/>`).join('')}<rect x="${N(x + (dx - 112) * k)}" y="${N(y + (dy + 8) * k)}" width="${N(224 * k)}" height="${N(38 * k)}" rx="${N(19 * k)}"/></g>`;
    return (shade ? g(shade, 4, 7, 1) : '') + g(fill, 0, 0, 1) + (hi ? g(hi, -6, -8, 0.62) : '');
  }
  function starsSvg(r, n, o) {
    o = o || {}; let s = '';
    for (let i = 0; i < n; i++) { const z = (o.min || 0.6) + Math.pow(r(), 3) * ((o.max || 2.2) - (o.min || 0.6)); s += circ(rr(r, o.x0 || 0, o.x1 == null ? W : o.x1), rr(r, o.y0 || 0, o.y1 == null ? 480 : o.y1), z, o.c || '#ffffff', ` opacity="${N(0.3 + r() * 0.7)}"`); }
    return s;
  }
  function moonSvg(id, x, y, R, c1, c2, glowA) {
    c1 = c1 || '#fffbea'; c2 = c2 || '#f2dc9e';
    return `<defs>${rg(id + 'g', [[0, c1, glowA == null ? 0.45 : glowA], [0.3, c1, (glowA == null ? 0.45 : glowA) * 0.4], [1, c1, 0]])}${rg(id + 'b', [[0, '#ffffff'], [0.55, c1], [1, c2]], 0.38, 0.36, 0.7)}</defs>`
      + circ(x, y, R * 3.4, `url(#${id}g)`) + circ(x, y, R, `url(#${id}b)`)
      + circ(x + R * 0.28, y + R * 0.18, R * 0.17, c2, ' opacity=".55"') + circ(x - R * 0.3, y + R * 0.38, R * 0.11, c2, ' opacity=".5"') + circ(x - R * 0.12, y - R * 0.34, R * 0.13, c2, ' opacity=".45"') + circ(x + R * 0.42, y - R * 0.3, R * 0.07, c2, ' opacity=".5"');
  }
  // rangée d'immeubles avec fenêtres allumées
  function skyline(r, o) {
    let s = '', x = o.x0 == null ? -20 : o.x0;
    const x1 = o.x1 == null ? W + 20 : o.x1;
    while (x < x1) {
      const w = rr(r, o.minW, o.maxW), h = rr(r, o.minH, o.maxH), top = o.y - h;
      s += rect(x, top, w + 1, h + 30, o.fill);
      const roof = r();
      if (o.roofs && roof < 0.18) s += rect(x + w * 0.3, top - h * 0.12, w * 0.4, h * 0.12 + 1, o.fill);
      else if (o.roofs && roof < 0.3) s += line(`M${N(x + w / 2)} ${N(top)} V${N(top - 26 - r() * 30)}`, o.fill, 2.5);
      else if (o.roofs && roof < 0.38) s += path(`M${N(x - 1)} ${N(top + 1)} L${N(x + w / 2)} ${N(top - w * 0.45)} L${N(x + w + 1)} ${N(top + 1)}Z`, o.fill);
      if (o.win) {
        const ww = o.winW || 5, wh = o.winH || 8, gx = o.gapX || 6, gy = o.gapY || 7;
        for (let wy = top + 10; wy < o.y - 12; wy += wh + gy) for (let wx = x + 6; wx < x + w - ww - 4; wx += ww + gx) if (r() < (o.winP || 0.35)) s += rect(wx, wy, ww, wh, pick(r, o.win));
      }
      x += w + rr(r, 0, o.gap || 5);
    }
    return s;
  }
  // herbe : brins fins
  function grass(r, n, o) { let s = ''; for (let i = 0; i < n; i++) { const x = rr(r, o.x0, o.x1), y = rr(r, o.y0, o.y1), h = rr(r, o.h[0], o.h[1]), b = (r() - 0.5) * h * 0.6; s += line(`M${N(x)} ${N(y)} Q${N(x + b * 0.3)} ${N(y - h * 0.6)} ${N(x + b)} ${N(y - h)}`, pick(r, o.c), o.w || 1.6); } return s; }
  // fleur simple (pétales autour d'un cœur)
  function flower(x, y, k, petal, heart, n) { let s = ''; const m = n || 5; for (let i = 0; i < m; i++) { const a = i / m * Math.PI * 2; s += ell(x + Math.cos(a) * 5 * k, y + Math.sin(a) * 5 * k, 4.2 * k, 2.6 * k, petal, ` transform="rotate(${N(a * 180 / Math.PI)} ${N(x + Math.cos(a) * 5 * k)} ${N(y + Math.sin(a) * 5 * k)})"`); } return s + circ(x, y, 2.6 * k, heart); }
  function tulip(x, y, h, c, leaf) { return line(`M${N(x)} ${N(y)} Q${N(x + 3)} ${N(y - h * 0.5)} ${N(x)} ${N(y - h)}`, leaf, 2.4) + path(`M${N(x - 2)} ${N(y - h * 0.25)} Q${N(x - 14)} ${N(y - h * 0.5)} ${N(x - 9)} ${N(y - h * 0.8)} Q${N(x - 4)} ${N(y - h * 0.5)} ${N(x - 2)} ${N(y - h * 0.25)}Z`, leaf) + path(`M${N(x - 8)} ${N(y - h)} Q${N(x - 9)} ${N(y - h - 16)} ${N(x - 4)} ${N(y - h - 18)} L${N(x)} ${N(y - h - 12)} L${N(x + 4)} ${N(y - h - 18)} Q${N(x + 9)} ${N(y - h - 16)} ${N(x + 8)} ${N(y - h)} Q${N(x)} ${N(y - h + 6)} ${N(x - 8)} ${N(y - h)}Z`, c); }

  // ---------- petites images (sprites) ----------
  const SP = {
    dot: (c) => svg('0 0 20 20', `<defs>${rg('d', [[0, c, 1], [0.45, c, 0.9], [1, c, 0]])}</defs>${circ(10, 10, 10, 'url(#d)')}`),
    flake: (c) => svg('0 0 20 20', `<g stroke="${c}" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M10 1.5V18.5M2.6 5.75L17.4 14.25M2.6 14.25L17.4 5.75"/><path d="M10 5L7.8 2.9M10 5L12.2 2.9M10 15L7.8 17.1M10 15L12.2 17.1M5.7 7.5L2.9 7.9M5.7 7.5L4.8 4.8M14.3 12.5L17.1 12.1M14.3 12.5L15.2 15.2M14.3 7.5L15.2 4.8M14.3 7.5L17.1 7.9M5.7 12.5L4.8 15.2M5.7 12.5L2.9 12.1" stroke-width="1.1"/></g>`),
    maple: (c, v) => svg('0 0 40 40', path('M20 2L23 11L29 7L28 15L37 14L31 21L35 24L25 26L26 33L21 29L20.6 38H19.4L19 29L14 33L15 26L5 24L9 21L3 14L12 15L11 7L17 11Z', c) + line('M20 37V12M20 25L12 17M20 25L28 17', v || 'rgba(0,0,0,.18)', 0.9)),
    oak: (c, v) => svg('0 0 40 40', path('M20 3C25 5 23 9 27 10C32 11 28 15 31 17C35 19 30 22 31 25C32 29 26 28 24 31C22 33 21 36 20 38C19 36 18 33 16 31C14 28 8 29 9 25C10 22 5 19 9 17C12 15 8 11 13 10C17 9 15 5 20 3Z', c) + line('M20 38V8M20 18L14 13M20 18L26 13M20 26L13 21M20 26L27 21', v || 'rgba(0,0,0,.18)', 0.9)),
    leaf: (c, v) => svg('0 0 40 40', path('M20 3C31 10 33 26 20 37C7 26 9 10 20 3Z', c) + line('M20 37V7M20 18L14 13M20 18L26 13M20 27L13 21M20 27L27 21', v || 'rgba(0,0,0,.18)', 0.9)),
    petal: (c, d) => svg('0 0 20 20', path('M10 18.5C2.5 13.5 1.5 6 6.5 2.2L10 5.2L13.5 2.2C18.5 6 17.5 13.5 10 18.5Z', c) + line('M10 16V8', d || 'rgba(190,60,110,.35)', 0.8)),
    heart: (c, hl) => svg('0 0 20 20', path('M10 18C2 12 0.5 7 3 4C5.8 0.8 9 2 10 5C11 2 14.2 0.8 17 4C19.5 7 18 12 10 18Z', c) + (hl ? path('M5.2 5.2C6.2 4.2 7.6 4.3 8.2 5', 'none', ` stroke="${hl}" stroke-width="1.4" stroke-linecap="round"`) : '')),
    hballoon: (c, d) => svg('0 0 40 90', line('M20 34Q16 50 22 62Q27 74 19 89', 'rgba(255,255,255,.75)', 1) + path('M20 35C6 25 1 15 5 8C9 1 17 2 20 9C23 2 31 1 35 8C39 15 34 25 20 35Z', c) + path('M18 35L22 35L21 38L19 38Z', d) + path('M10 9C12 6.5 15 6.5 16.5 8.5', 'none', ' stroke="rgba(255,255,255,.7)" stroke-width="2.4" stroke-linecap="round"')),
    balloon: (c, d) => svg('0 0 40 90', line('M20 50Q16 62 22 72Q27 80 19 89', 'rgba(255,255,255,.7)', 1) + ell(20, 24, 17, 22, c) + path('M17 45L23 45L21.5 50L18.5 50Z', d) + ell(13, 15, 4, 7, 'rgba(255,255,255,.5)', ' transform="rotate(25 13 15)"')),
    bird: (c) => svg('0 0 40 20', path('M1 9Q9 0.5 20 10Q31 0.5 39 9Q31 5 20 14Q9 5 1 9Z', c)),
    gull: () => svg('0 0 50 22', path('M1 11Q12 1 25 12Q38 1 49 11Q38 7 25 16Q12 7 1 11Z', '#ffffff', ' stroke="#9aa9b4" stroke-width="1"') + path('M1 11Q4 8 7 7L5 11Z', '#3b4651') + path('M49 11Q46 8 43 7L45 11Z', '#3b4651') + ell(25, 13.5, 3.2, 2.2, '#ffffff') + path('M27.5 13.5L31 14.2L27.5 15Z', '#f3a531')),
    butterfly: (a, b, k) => svg('0 0 40 32', path('M20 15C14 3 3 0 2 7C1 13 9 16 19 16Z', a) + path('M20 15C26 3 37 0 38 7C39 13 31 16 21 16Z', a) + path('M19 17C10 17 5 23 8 28C11 31 17 25 19.5 18Z', b) + path('M21 17C30 17 35 23 32 28C29 31 23 25 20.5 18Z', b) + circ(9, 8, 2.2, 'rgba(255,255,255,.55)') + circ(31, 8, 2.2, 'rgba(255,255,255,.55)') + ell(20, 17, 1.4, 8, k || '#2b2118') + line('M20 9Q17 4 15 3M20 9Q23 4 25 3', k || '#2b2118', 0.9)),
    bee: () => svg('0 0 34 26', ell(13, 6, 8, 5, 'rgba(255,255,255,.75)', ' transform="rotate(-20 13 6)"') + ell(21, 6, 7, 4.5, 'rgba(255,255,255,.65)', ' transform="rotate(20 21 6)"') + ell(17, 16, 11, 8, '#ffcc33') + path('M12 9.2Q13.5 16 12 22.8L15.5 23.8Q17 16 15.5 8.2Z', '#2d2016') + path('M19.5 8.2Q21 16 19.5 23.8L23 22.6Q24.5 16 23 9.4Z', '#2d2016') + circ(27, 14, 1.4, '#2d2016') + path('M5.5 16L2 17.2L5.6 18.4Z', '#2d2016')),
    fish: (a, b, eye) => svg('0 0 64 36', path('M46 18L63 5Q58 18 63 31Z', b) + path('M4 18C10 4 30 1 46 18C30 35 10 32 4 18Z', a) + path('M22 6Q28 0 36 4L34 8Z', b) + path('M24 30Q30 35 36 31L32 28Z', b) + path('M28 5Q24 18 28 31', 'none', ` stroke="${b}" stroke-width="2.6" opacity=".7"`) + path('M38 9Q35 18 38 27', 'none', ` stroke="${b}" stroke-width="2.2" opacity=".6"`) + circ(13, 15, 3.4, '#ffffff') + circ(12.4, 15, 1.9, eye || '#14213d') + path('M5.5 21Q8 22.5 10.5 21.5', 'none', ' stroke="rgba(0,0,0,.35)" stroke-width="1" stroke-linecap="round"')),
    pfish: (a, b) => svg('0 0 92 54', path('M66 27L90 9L84 27L90 45Z', b) + path('M3 27C12 8 42 3 66 27C42 51 12 46 3 27Z', a, ' stroke="rgba(0,0,0,.25)" stroke-width="1.2"') + line('M22 10L30 27L22 44M40 7L48 27L40 47M56 17L62 27L56 37', 'rgba(0,0,0,.16)', 1.2) + circ(15, 23, 4, '#ffffff', ' stroke="#222" stroke-width="1"') + circ(14.4, 23, 2, '#222') + path('M6 31Q11 35 16 32', 'none', ' stroke="#222" stroke-width="1.4" stroke-linecap="round"') + rect(30, 0, 14, 22, 'rgba(255,255,230,.62)', ' transform="rotate(18 37 11)" stroke="rgba(200,190,150,.5)" stroke-width=".6"')),
    bubble: () => svg('0 0 20 20', circ(10, 10, 8.6, 'rgba(255,255,255,.08)', ' stroke="rgba(255,255,255,.7)" stroke-width="1.2"') + path('M5.2 8.2Q6 5.4 8.8 4.8', 'none', ' stroke="rgba(255,255,255,.9)" stroke-width="1.5" stroke-linecap="round"')),
    note1: (c) => svg('0 0 26 40', ell(8.5, 32, 7.5, 5.5, c, ' transform="rotate(-22 8.5 32)"') + rect(14, 4, 2.6, 28, c) + path('M14.5 4Q22 8 24 15Q25 21 21 25Q23 18 15.5 13Z', c)),
    note2: (c) => svg('0 0 40 40', ell(8, 32, 7, 5.2, c, ' transform="rotate(-22 8 32)"') + ell(30, 28, 7, 5.2, c, ' transform="rotate(-22 30 28)"') + rect(13, 6, 2.6, 26, c) + rect(35, 2, 2.6, 26, c) + path('M13 6L37.6 2V8.5L13 12.5Z', c)),
    sparkle: (c) => svg('0 0 20 20', path('M10 0C10.8 6.6 13.4 9.2 20 10C13.4 10.8 10.8 13.4 10 20C9.2 13.4 6.6 10.8 0 10C6.6 9.2 9.2 6.6 10 0Z', c)),
    sleigh: (c, g) => svg('0 0 330 90', line('M64 46L214 56', c, 1.4) + [0, 62, 124].map((x) => path(`M${x + 10} 50C${x + 12} 42 ${x + 22} 40 ${x + 34} 41C${x + 40} 41 ${x + 44} 36 ${x + 46} 31L${x + 50} 26L${x + 56} 28L${x + 54} 33C${x + 54} 38 ${x + 50} 44 ${x + 44} 48C${x + 42} 54 ${x + 36} 56 ${x + 28} 56L${x + 34} 68L${x + 30} 69L${x + 22} 57L${x + 16} 57L${x + 6} 66L${x + 3} 64L${x + 10} 55C${x + 6} 55 ${x + 2} 53 ${x} 52Z`, c) + line(`M${x + 50} 27L${x + 47} 16M${x + 48} 21L${x + 43} 17M${x + 49} 19L${x + 53} 13M${x + 54} 27L${x + 58} 18M${x + 57} 21L${x + 62} 18`, c, 1.6)).join('') + path('M206 64Q200 44 214 40L266 40Q282 40 286 26L298 24Q300 60 268 64Z', c) + line('M196 74L282 74Q300 74 304 62', c, 2.4) + line('M220 64V74M262 64V74', c, 2) + circ(236, 32, 11, c) + path('M228 24Q234 6 248 14L242 24Z', c) + circ(266, 30, 12, c) + (g ? circ(250, 15, 2, g) : '')),
    present: (a, b) => svg('0 0 40 40', rect(4, 12, 32, 26, a) + rect(2, 8, 36, 8, a) + rect(17, 8, 6, 30, b) + rect(2, 10, 36, 3, 'rgba(0,0,0,.12)') + path('M20 8C14 0 8 2 10 6C11 8 16 8 20 8C24 8 29 8 30 6C32 2 26 0 20 8Z', b)),
    plane: (c, d) => svg('0 0 60 30', path('M2 16L58 2L22 22Z', c) + path('M22 22L58 2L28 28Z', d) + path('M22 22L26 16L58 2Z', 'rgba(0,0,0,.08)')),
  };
  const spr = (name, ...a) => cached('sp|' + name + '|' + a.join('|'), () => SP[name](...a));

  // ---------- animations (keyframes communs) ----------
  const CSS = [
    '@keyframes fhs-move{from{transform:translate3d(var(--x0,0em),var(--y0,0em),0) rotate(var(--r0,0deg))}to{transform:translate3d(var(--x1,0em),var(--y1,0em),0) rotate(var(--r1,0deg))}}',
    '@keyframes fhs-movef{0%{transform:translate3d(var(--x0,0em),var(--y0,0em),0) rotate(var(--r0,0deg));opacity:0}10%{opacity:var(--op,1)}85%{opacity:var(--op,1)}100%{transform:translate3d(var(--x1,0em),var(--y1,0em),0) rotate(var(--r1,0deg));opacity:0}}',
    '@keyframes fhs-sway{0%,100%{transform:translate3d(calc(var(--sw,1em) * -1),0,0) rotate(calc(var(--sr,0deg) * -1))}50%{transform:translate3d(var(--sw,1em),0,0) rotate(var(--sr,0deg))}}',
    '@keyframes fhs-rock{0%,100%{transform:rotate(calc(var(--a,4deg) * -1))}50%{transform:rotate(var(--a,4deg))}}',
    '@keyframes fhs-bob{0%,100%{transform:translate3d(0,0,0) rotate(0deg)}50%{transform:translate3d(var(--bx,0em),var(--by,-1em),0) rotate(var(--br,0deg))}}',
    '@keyframes fhs-tw{0%,100%{opacity:var(--o1,1)}50%{opacity:var(--o0,.15)}}',
    '@keyframes fhs-spin{to{transform:rotate(360deg)}}',
    '@keyframes fhs-spinr{to{transform:rotate(-360deg)}}',
    '@keyframes fhs-flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(var(--f,.3))}}',
    '@keyframes fhs-flapx{0%,100%{transform:scaleX(1)}50%{transform:scaleX(var(--f,.25))}}',
    '@keyframes fhs-burst{0%{transform:scale(.04);opacity:0}4%{opacity:1}42%{opacity:1}66%{transform:scale(1) translate3d(0,.8em,0);opacity:0}100%{transform:scale(1) translate3d(0,.8em,0);opacity:0}}',
    '@keyframes fhs-rocket{0%{transform:translate3d(0,0,0);opacity:0}3%{opacity:1}25%{opacity:1}29%{transform:translate3d(0,var(--ry,-30em),0);opacity:0}100%{transform:translate3d(0,var(--ry,-30em),0);opacity:0}}',
    '@keyframes fhs-scroll{from{transform:translate3d(0,0,0)}to{transform:translate3d(var(--sx,-50%),var(--sy,0),0)}}',
    '@keyframes fhs-flick{0%,100%{opacity:1}6%{opacity:.35}8%{opacity:1}50%{opacity:1}51%{opacity:.2}53%{opacity:.9}55%{opacity:.35}57%{opacity:1}}',
    '@keyframes fhs-pulse{0%,100%{transform:scale(1);opacity:var(--o1,1)}50%{transform:scale(var(--s,1.15));opacity:var(--o0,.6)}}',
    '@keyframes fhs-shoot{0%{transform:translate3d(0,0,0) rotate(var(--ang,20deg));opacity:0}1.5%{opacity:1}6%{transform:translate3d(var(--x1,40em),var(--y1,15em),0) rotate(var(--ang,20deg));opacity:0}100%{transform:translate3d(var(--x1,40em),var(--y1,15em),0) rotate(var(--ang,20deg));opacity:0}}',
    '@keyframes fhs-hop{0%,40%,100%{transform:translate3d(0,0,0) scale(1,1)}10%{transform:translate3d(0,0,0) scale(1.08,.9)}22%{transform:translate3d(0,var(--hy,-2em),0) scale(.96,1.05)}34%{transform:translate3d(0,0,0) scale(1.06,.92)}}',
    '@keyframes fhs-blink{0%,49%{opacity:1}50%,100%{opacity:0}}',
    '@keyframes fhs-fw{0%,29%{transform:scale(.03);opacity:0}30%{transform:scale(.06);opacity:1}46%{transform:scale(.92);opacity:1}62%{opacity:.85}80%{transform:scale(1) translate3d(0,1em,0);opacity:0}100%{transform:scale(1) translate3d(0,1em,0);opacity:0}}',
    '@keyframes fhs-rk{0%{transform:translate3d(0,0,0);opacity:0}2%{opacity:1}27%{opacity:1}29.5%{transform:translate3d(0,var(--ry,-30em),0);opacity:0}100%{transform:translate3d(0,var(--ry,-30em),0);opacity:0}}',
    '@keyframes fhs-flash{0%,29%{opacity:0}32%{opacity:var(--o1,.7)}55%,100%{opacity:0}}',
  ].join('');
  function injectCss() { if (typeof document === 'undefined' || document.getElementById('fhs-css')) return; const st = document.createElement('style'); st.id = 'fhs-css'; st.textContent = CSS; document.head.appendChild(st); }

  // ---------- registre des décors ----------
  const SC = {};
  const ids = [];
  const def = (id, sc) => { SC[id] = sc; ids.push(id); };

  // outils passés à chaque décor : en mode « rendu » ils créent des éléments React, en mode « aperçu » ils collectent le SVG
  function tools(E, id, o, mode) {
    const bodies = [], colorKey = [o.bg1, o.bg2, o.bg3].join(',');
    const keyed = (k) => id + '-' + k;
    const t = {
      E: mode === 'preview' ? () => null : E, id, o, preview: mode === 'preview', bodies,
      r: (k) => prng(seedOf(id + '|' + k)),
      // dessin fixe plein cadre
      art: (k, fn) => {
        if (mode === 'preview') { bodies.push(fn(keyed(k))); return null; }
        return E('div', { key: 'art-' + k, style: { position: 'absolute', inset: 0, backgroundImage: cached('art|' + id + '|' + k + '|' + colorKey, () => svg(`0 0 ${W} ${H}`, fn(keyed(k)))), backgroundSize: '100% 100%' } });
      },
      // élément libre (positions et tailles en unités du dessin)
      el: (k, st, kids) => (mode === 'preview' ? null : E('div', { key: k, style: st }, kids)),
      still: (svgBody) => { if (mode === 'preview') bodies.push(svgBody); return null; },
      img: (url, st) => ({ position: 'absolute', backgroundImage: url, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', ...st }),
      // liste d'éléments tirés au hasard une fois pour toutes
      n: (k, count, mk) => { const r = prng(seedOf(id + '#' + k)); return Array.from({ length: count }, (_, i) => mk(r, i)); },
    };
    return t;
  }
  // particules qui tombent / montent / traversent : un porteur qui se déplace, un enfant qui oscille et porte l'image
  function drift(t, key, list) {
    if (t.preview) return [];
    const E = t.E;
    return list.map((p, i) => E('div', { key: key + i, style: { position: 'absolute', left: em(p.x), top: em(p.y), width: em(p.w), height: em(p.h == null ? p.w : p.h), '--x0': em(p.x0 || 0), '--y0': em(p.y0 || 0), '--x1': em(p.x1 || 0), '--y1': em(p.y1 || 0), '--r0': (p.r0 || 0) + 'deg', '--r1': (p.r1 || 0) + 'deg', '--op': p.op == null ? 1 : p.op, opacity: p.fade ? 0 : p.op, animation: `${p.fade ? 'fhs-movef' : 'fhs-move'} ${N(p.dur)}s ${p.ease || 'linear'} ${N(p.dl || 0)}s infinite`, zIndex: p.z } },
      E('div', { style: { width: '100%', height: '100%', '--sw': em(p.sw || 0), '--sr': (p.sr || 0) + 'deg', animation: p.sw || p.sr ? `fhs-sway ${N(p.swd || 3)}s ease-in-out ${N(-(p.dl || 0) * 0.7)}s infinite` : undefined } },
        E('div', { style: { width: '100%', height: '100%', ...(p.img ? { backgroundImage: p.img, backgroundSize: '100% 100%' } : { background: p.bg }), borderRadius: p.round, '--f': p.f, animation: p.flap ? `${p.flapx ? 'fhs-flapx' : 'fhs-flap'} ${N(p.flap)}s ease-in-out infinite` : undefined, transform: p.flip ? 'scaleX(-1)' : undefined } }))));
  }

  // ======================================================================
  //                             LES DÉCORS
  // ======================================================================

  // neige à plusieurs profondeurs (loin : petits points lents ; près : gros flocons flous)
  function snowfall(t, key, o) {
    o = o || {};
    const dot = spr('dot', o.c || '#ffffff'), flake = spr('flake', o.c || '#ffffff');
    const far = t.n(key + 'f', o.far == null ? 34 : o.far, (r) => ({ x: r() * 1640 - 20, y: -30, w: rr(r, 4, 7), y1: 960, x1: rr(r, -60, 60), dur: rr(r, 16, 26), dl: -r() * 26, sw: rr(r, 1, 2.5), swd: rr(r, 3, 6), op: rr(r, 0.45, 0.8), img: dot }));
    const near = t.n(key + 'n', o.near == null ? 14 : o.near, (r) => ({ x: r() * 1640 - 20, y: -40, w: rr(r, 10, 17), y1: 980, x1: rr(r, -120, 120), dur: rr(r, 8, 13), dl: -r() * 13, sw: rr(r, 2, 4), swd: rr(r, 2.5, 4.5), op: rr(r, 0.7, 0.95), img: dot }));
    const cry = t.n(key + 'c', o.crystals == null ? 6 : o.crystals, (r) => ({ x: r() * 1600, y: -40, w: rr(r, 16, 26), y1: 980, x1: rr(r, -80, 80), r1: rr(r, -300, 300), dur: rr(r, 11, 17), dl: -r() * 17, sw: 2.5, swd: 4, op: 0.85, img: flake }));
    return [...drift(t, key + 'f', far), ...drift(t, key + 'c', cry), ...drift(t, key + 'n', near)];
  }
  // étoiles qui scintillent (petites étincelles)
  function twinkles(t, key, n, area, c) {
    if (t.preview) return [];
    const img = spr('sparkle', c || '#ffffff');
    return t.n(key, n, (r) => ({ x: rr(r, area[0], area[2]), y: rr(r, area[1], area[3]), z: rr(r, 6, 13), d: rr(r, 2, 5), dl: -r() * 5 })).map((p, i) => t.E('div', { key: key + i, style: t.img(img, { left: em(p.x), top: em(p.y), width: em(p.z), height: em(p.z), '--o0': 0.1, animation: `fhs-tw ${N(p.d)}s ease-in-out ${N(p.dl)}s infinite` }) }));
  }
  // étoile filante de temps en temps
  function shooting(t, key, x, y, dx, dy, period, delay) {
    if (t.preview) return null;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    return t.E('div', { key, style: { position: 'absolute', left: em(x), top: em(y), width: em(160), height: em(2.4), marginLeft: em(-160), borderRadius: 99, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.95))', transformOrigin: '100% 50%', '--ang': N(ang) + 'deg', '--x1': em(dx), '--y1': em(dy), opacity: 0, animation: `fhs-shoot ${period}s ease-out ${delay || 0}s infinite` } });
  }
  // fumée de cheminée : bouffées qui montent, grossissent un peu et s'effacent
  function smoke(t, key, x, y, n, c) {
    const img = spr('dot', c || '#e9eef5');
    return drift(t, key, t.n(key, n || 6, (r, i) => ({ x: x - 9, y: y - 9, w: 18 + i * 3, x1: rr(r, 30, 70), y1: -rr(r, 120, 170), dur: 6, dl: -i * (6 / (n || 6)), op: 0.55, fade: true, img })));
  }

  // aurore boréale : un ruban ondulant fait de fins rideaux verticaux (lumineux en bas, qui s'effacent vers le haut)
  function auroraSvg(seed, o) {
    const r = prng(seed), ph = [r() * 6.3, r() * 6.3, r() * 6.3];
    let s = `<defs>${lg('c', [[0, o.top, 0], [0.55, o.mid, 0.55], [0.92, o.low, 1], [1, o.low, 0]])}${lg('e', [[0, '#fff', 0], [0.12, '#fff', 1], [0.88, '#fff', 1], [1, '#fff', 0]], 1, 0)}<mask id="m"><rect width="1600" height="420" fill="url(#e)"/></mask></defs><g mask="url(#m)">`;
    for (let x = -10; x < 1610; x += 7) {
      const yb = o.y + 70 * Math.sin(x / 300 + ph[0]) + 28 * Math.sin(x / 113 + ph[1]) + o.tilt * (x / 1600 - 0.5), h = 110 + 80 * (0.5 + 0.5 * Math.sin(x / 170 + ph[2])) + r() * 40;
      s += rect(x, yb - h, 8, h, 'url(#c)', ` opacity="${N(0.25 + 0.6 * Math.pow(r(), 0.7))}"`);
    }
    return svg('0 0 1600 420', s + '</g>');
  }

  // ---------------- HIVER : montagnes, aurore boréale, chalet, neige ----------------
  def('winter', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const E = t.E;
      const aur1 = cached('aur1', () => auroraSvg(11, { y: 250, tilt: -90, low: '#59ffb4', mid: '#2fd6c4', top: '#8a6bff' })), aur2 = cached('aur2', () => auroraSvg(23, { y: 215, tilt: 60, low: '#7dffcf', mid: '#6f8bff', top: '#c06bff' }));
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.5, o.bg1], [0.78, o.bg3]]) + starsSvg(t.r('st'), 150, { y1: 430 }) + moonSvg(p + 'm', 1290, 140, 34, '#fbfdff', '#c9dbef', 0.35)),
        twinkles(t, 'tw', 12, [40, 20, 1560, 380]),
        shooting(t, 'sh', 420, 110, 380, 150, 17, 4),
        t.el('aur1', t.img(aur1, { left: em(-100), top: em(-10), width: em(1800), height: em(470), '--o0': 0.45, '--bx': em(60), '--by': em(10), animation: 'fhs-tw 9s ease-in-out infinite, fhs-bob 22s ease-in-out infinite' })),
        t.el('aur2', t.img(aur2, { left: em(-200), top: em(20), width: em(1900), height: em(440), opacity: 0.6, '--o1': 0.6, '--o0': 0.2, '--bx': em(-90), '--by': em(14), animation: 'fhs-tw 13s ease-in-out -4s infinite, fhs-bob 30s ease-in-out -8s infinite' })),
        t.still(`<image href="${aur1.slice(5, -2)}" x="-90" y="-10" width="1780" height="470" preserveAspectRatio="none"/>`),
        t.art('land', (p) => {
          const r = t.r('land');
          let s = mountains(r, p + 'm1', { y: 650, amp: 330, n: 7, valley: 0.6, fill: '#7ea4cc', shade: 'rgba(40,70,120,.28)', snow: '#eef5ff', snowLine: 0.42, haze: '#9cc0e4', hazeA: 0.7 });
          s += mountains(r, p + 'm2', { y: 700, amp: 200, n: 9, valley: 0.55, fill: '#4f7aa8', shade: 'rgba(20,40,80,.3)', snow: '#dce9f8', snowLine: 0.32, haze: '#b9d3ec', hazeA: 0.6 });
          s += hill(r, { y: 735, amp: 50, n: 16 }, '#d7e5f4');
          for (let i = 0; i < 46; i++) { const x = rr(r, -20, 1620), h = rr(r, 34, 78); if (x > 1150 && x < 1360) continue; s += pine(x, 712 + rr(r, 0, 28), h, '#2b4c69', { snow: '#e3eefa', tiers: 3 }); }
          // chalet
          s += glow(p + 'cg', 1250, 735, 170, '#ffcf6e', 0.35);
          s += rect(1185, 700, 130, 62, '#6b3f25') + [0, 1, 2, 3, 4].map(i => rect(1185, 704 + i * 12, 130, 2.2, '#4f2c18')).join('');
          s += rect(1286, 640, 18, 50, '#5a4a44') + rect(1282, 632, 26, 10, '#ecf3fb');
          s += path('M1160 708L1250 642L1340 708L1330 714L1250 656L1170 714Z', '#ecf3fb') + path('M1170 714L1250 656L1330 714Z', '#7a4a2a', ' opacity=".0"');
          s += path('M1162 706Q1180 714 1196 706Q1214 716 1232 707Q1250 716 1268 707Q1286 716 1304 706Q1320 715 1338 706L1340 712L1160 712Z', '#ffffff');
          s += rect(1200, 718, 26, 24, '#ffd27a') + rect(1212, 718, 2.4, 24, '#6b3f25') + rect(1200, 729, 26, 2.4, '#6b3f25') + rect(1270, 718, 26, 24, '#ffd27a') + rect(1282, 718, 2.4, 24, '#6b3f25') + rect(1270, 729, 26, 2.4, '#6b3f25');
          s += rect(1236, 726, 22, 36, '#3b2213') + circ(1253, 745, 1.6, '#ffcf6e');
          // sol enneigé, ombres bleutées, traces de pas
          s += hill(r, { y: 772, amp: 34, n: 12, f: [0.8, 2.1, 4.3] }, '#f3f8fe');
          s += ell(1250, 776, 110, 12, '#ffe2a6', ' opacity=".22"');
          s += hill(r, { y: 840, amp: 30, n: 10 }, '#c9dcee', ' opacity=".7"') + hill(r, { y: 862, amp: 26, n: 10 }, '#f7fbff');
          for (let i = 0; i < 14; i++) { const k = i / 14, x = 1210 - k * 520 + Math.sin(k * 8) * 30, y = 790 + k * 80; s += ell(x + (i % 2 ? 8 : -8), y, 5 + k * 3, 2.4 + k * 1.2, '#c4d6ea'); }
          // grands sapins de premier plan
          [[70, 900, 330], [190, 905, 250], [290, 910, 180], [1440, 905, 300], [1550, 900, 360]].forEach(([x, y, h]) => { s += pine(x, y, h, '#163b37', { snow: '#f2f7fd', light: 'rgba(255,255,255,.06)', tiers: 5 }); });
          return s;
        }),
        ...smoke(t, 'smk', 1295, 628, 6),
        t.el('win', { position: 'absolute', left: em(1170), top: em(690), width: em(160), height: em(80), background: 'radial-gradient(closest-side, rgba(255,200,110,.45), rgba(255,200,110,0))', '--o0': 0.7, animation: 'fhs-tw 3.3s ease-in-out infinite' }),
        ...snowfall(t, 'sn'),
      ];
    },
  });

  // feux d'artifice : fusée qui monte, éclair, gerbe de points (une seule boîte + ombres portées)
  function burstShadow(R, n, c, c2, dot) {
    const out = [];
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; out.push(`${em(Math.cos(a) * R)} ${em(Math.sin(a) * R)} 0 ${em(dot)} ${c}`); if (c2) out.push(`${em(Math.cos(a + 0.18) * R * 0.62)} ${em(Math.sin(a + 0.18) * R * 0.62)} 0 ${em(dot * 0.7)} ${c2}`); if (k % 2 === 0) out.push(`${em(Math.cos(a + 0.1) * R * 0.84)} ${em(Math.sin(a + 0.1) * R * 0.84)} 0 ${em(dot * 0.55)} ${c}`); }
    return out.join(',');
  }
  function burstSvg(x, y, R, c, c2) { let s = glow('bg' + Math.round(x) + 'x' + Math.round(y), x, y, R * 1.3, c, 0.25); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; s += line(`M${N(x + Math.cos(a) * R * 0.35)} ${N(y + Math.sin(a) * R * 0.35)}L${N(x + Math.cos(a) * R)} ${N(y + Math.sin(a) * R)}`, k % 2 ? c2 : c, 3, ' opacity=".85"') + circ(x + Math.cos(a) * R, y + Math.sin(a) * R, 3.4, k % 2 ? c2 : c); } return s; }
  function fireworks(t, key, n, o) {
    const list = t.n(key, n, (r, i) => ({ x: rr(r, o.area[0], o.area[2]), y: rr(r, o.area[1], o.area[3]), R: rr(r, o.R ? o.R[0] : 70, o.R ? o.R[1] : 125), dur: rr(r, 4.2, 6.2), dl: -(i * (o.gap || 1.4) + r() * 1.2), c: pick(r, o.colors), c2: pick(r, o.colors), k: 18 + Math.floor(r() * 8) }));
    if (t.preview) { list.slice(0, 3).forEach(b => t.still(burstSvg(b.x, b.y, b.R, b.c, b.c2))); return []; }
    const E = t.E, ground = o.ground || 820;
    return list.flatMap((b, i) => [
      E('div', { key: key + 'r' + i, style: { position: 'absolute', left: em(b.x - 1.5), top: em(ground), width: em(3), height: em(26), borderRadius: 9, background: `linear-gradient(180deg, ${b.c}, rgba(255,255,255,0))`, '--ry': em(b.y - ground), opacity: 0, animation: `fhs-rk ${N(b.dur)}s cubic-bezier(.3,.6,.4,1) ${N(b.dl)}s infinite` } }),
      E('div', { key: key + 'f' + i, style: { position: 'absolute', left: em(b.x - b.R * 1.4), top: em(b.y - b.R * 1.4), width: em(b.R * 2.8), height: em(b.R * 2.8), borderRadius: '50%', background: `radial-gradient(closest-side, ${b.c}, rgba(0,0,0,0))`, '--o1': 0.35, opacity: 0, animation: `fhs-flash ${N(b.dur)}s linear ${N(b.dl)}s infinite` } }),
      E('div', { key: key + 'b' + i, style: { position: 'absolute', left: em(b.x - 2), top: em(b.y - 2), width: em(4), height: em(4), borderRadius: '50%', background: '#fff', boxShadow: burstShadow(b.R, b.k, b.c, b.c2, 2.6), opacity: 0, animation: `fhs-fw ${N(b.dur)}s cubic-bezier(.15,.7,.3,1) ${N(b.dl)}s infinite` } }),
    ]);
  }
  // confettis qui tombent en tournant
  function confetti(t, key, n, colors) {
    return drift(t, key, t.n(key, n, (r) => ({ x: r() * 1600, y: -40, w: rr(r, 7, 12), h: rr(r, 12, 20), y1: 980, x1: rr(r, -120, 120), r1: rr(r, -900, 900), dur: rr(r, 7, 13), dl: -r() * 13, sw: rr(r, 1.5, 3), swd: rr(r, 2, 4), bg: pick(r, colors), round: 2, flap: rr(r, 0.4, 0.9), f: 0.15 })));
  }
  // maison de village (murs, toit enneigé, fenêtres allumées, cheminée)
  function house(r, x, base, w, h, o) {
    const roofH = w * 0.48;
    let s = rect(x + w * 0.66, base - h - roofH * 0.9, w * 0.12, roofH * 0.7, o.chim || '#5b3d36') + rect(x + w * 0.64, base - h - roofH * 0.95, w * 0.16, 5, o.snow);
    s += rect(x, base - h, w, h, o.wall) + rect(x + w * 0.6, base - h, w * 0.4, h, 'rgba(0,0,0,.14)');
    s += path(`M${N(x - 8)} ${N(base - h + 2)} L${N(x + w / 2)} ${N(base - h - roofH)} L${N(x + w + 8)} ${N(base - h + 2)}Z`, o.roof);
    s += path(`M${N(x - 10)} ${N(base - h + 4)} L${N(x + w / 2)} ${N(base - h - roofH - 3)} L${N(x + w + 10)} ${N(base - h + 4)} L${N(x + w + 4)} ${N(base - h + 9)} Q${N(x + w * 0.75)} ${N(base - h - 2)} ${N(x + w / 2)} ${N(base - h + 6)} Q${N(x + w * 0.25)} ${N(base - h - 2)} ${N(x - 4)} ${N(base - h + 9)}Z`, o.snow);
    const cols = Math.max(1, Math.round(w / 34));
    for (let i = 0; i < cols; i++) { const wx = x + (w / cols) * (i + 0.5) - 7; if (r() < 0.85) s += rect(wx, base - h * 0.72, 14, 16, r() < 0.8 ? o.win : '#3a3550') + line(`M${N(wx + 7)} ${N(base - h * 0.72)}V${N(base - h * 0.72 + 16)}M${N(wx)} ${N(base - h * 0.72 + 8)}H${N(wx + 14)}`, o.frame || 'rgba(60,30,20,.55)', 1.4); }
    if (h > 50) s += rect(x + w * 0.4, base - 26, 13, 26, o.door || '#3b2418');
    return s;
  }

  // ---------------- NOËL : village sous la neige, grand sapin, traîneau devant la lune ----------------
  const XHOUSES = [[180, 720, 110, 70], [300, 712, 90, 86], [410, 724, 120, 62], [660, 728, 100, 66], [770, 716, 84, 80], [870, 726, 110, 64], [990, 720, 96, 76]], XT = [1355, 880, 400];
  def('xmas', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const E = t.E, bulbs = ['#ff4d4d', '#ffd166', '#5ee38a', '#5aa9ff', '#ff8ad8'];
      const [tx, tb, th] = XT;
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.55, o.bg1], [0.82, o.bg3]]) + starsSvg(t.r('st'), 140, { y1: 420 }) + moonSvg(p + 'm', 300, 165, 72, '#fffaf0', '#f0d9a8', 0.5)),
        twinkles(t, 'tw', 12, [40, 20, 1560, 360]),
        // traîneau du Père Noël qui passe devant la lune, avec une traînée dorée
        t.el('sleigh', { position: 'absolute', left: em(-360), top: em(150), width: em(330), height: em(90), animation: 'fhs-move 28s linear -6s infinite', '--x1': em(2300), '--y1': em(-40) },
          [E('div', { key: 'tr', style: { position: 'absolute', right: '92%', top: '38%', width: em(220), height: em(5), background: 'linear-gradient(90deg, rgba(255,215,120,0), rgba(255,226,150,.75))', borderRadius: 99 } }),
           E('div', { key: 'sp', style: t.img(spr('sleigh', '#0e1a33', '#ffd27a'), { inset: 0, '--a': '3deg', animation: 'fhs-rock 2.4s ease-in-out infinite' }) })]),
        t.art('village', (p) => {
          const r = t.r('vil');
          let s = hill(r, { y: 640, amp: 70, n: 14 }, '#9fb6d6') + hill(r, { y: 690, amp: 60, n: 14 }, '#c4d4ea');
          for (let i = 0; i < 26; i++) { const x = rr(r, -20, 1620); if (x > 1150 && x < 1520) continue; s += pine(x, 682 + rr(r, 0, 20), rr(r, 40, 72), '#1d3b4e', { snow: '#dfeaf7', tiers: 3 }); }
          // église
          s += rect(560, 600, 70, 110, '#8a7f99') + path('M552 604L595 560L638 604Z', '#4d4a63') + rect(578, 470, 34, 140, '#8a7f99') + path('M572 474L595 380L618 474Z', '#4d4a63') + path('M570 476L595 386L620 476L612 480L595 420L578 480Z', '#eef4fb') + line('M595 380V352M586 362H604', '#d8c8a0', 3) + circ(595, 520, 9, '#ffd98a') + rect(586, 640, 18, 30, '#ffd98a', ' rx="9"');
          const hc = ['#b5534a', '#5d7fb3', '#d6a64d', '#7d9b6a', '#c47a9a'];
          XHOUSES.forEach(([x, b, w, h], i) => { s += house(r, x, b, w, h, { wall: hc[i % hc.length], roof: '#3d3346', snow: '#f1f6fc', win: '#ffd27a' }); });
          s += hill(r, { y: 760, amp: 40, n: 12, f: [0.9, 2.2, 5] }, '#eaf2fb');
          // bonhomme de neige
          const sx = 250, sb = 846;
          s += ell(sx + 8, sb + 4, 70, 12, 'rgba(90,120,170,.25)') + circ(sx, sb - 46, 50, '#f7fbff', ' stroke="#b9cbe3" stroke-width="2"') + circ(sx + 14, sb - 38, 36, 'rgba(150,180,220,.22)') + circ(sx, sb - 120, 37, '#f2f7fd', ' stroke="#b9cbe3" stroke-width="2"') + circ(sx, sb - 176, 27, '#f7fbff', ' stroke="#b9cbe3" stroke-width="2"');
          s += path(`M${sx - 22} ${sb - 160}Q${sx} ${sb - 150} ${sx + 24} ${sb - 160}L${sx + 26} ${sb - 150}Q${sx} ${sb - 140} ${sx - 24} ${sb - 150}Z`, '#d6334a') + path(`M${sx + 10} ${sb - 152}L${sx + 18} ${sb - 112}L${sx + 30} ${sb - 116}L${sx + 20} ${sb - 152}Z`, '#d6334a');
          s += rect(sx - 26, sb - 207, 52, 8, '#1f1b24') + rect(sx - 17, sb - 240, 34, 35, '#1f1b24') + rect(sx - 17, sb - 214, 34, 6, '#d6334a');
          s += circ(sx - 9, sb - 182, 3.2, '#1f1b24') + circ(sx + 9, sb - 182, 3.2, '#1f1b24') + path(`M${sx} ${sb - 175}L${sx + 26} ${sb - 170}L${sx} ${sb - 168}Z`, '#f08a24') + [-10, -5, 0, 5, 10].map((d) => circ(sx + d, sb - 162 - Math.abs(d) * 0.25, 1.8, '#1f1b24')).join('');
          s += [0, 1, 2].map((k) => circ(sx, sb - 132 + k * 18, 4, '#1f1b24')).join('') + line(`M${sx - 34} ${sb - 126}L${sx - 86} ${sb - 160}M${sx - 70} ${sb - 150}L${sx - 80} ${sb - 172}`, '#5b3a22', 4) + line(`M${sx + 34} ${sb - 126}L${sx + 84} ${sb - 150}M${sx + 70} ${sb - 143}L${sx + 88} ${sb - 132}`, '#5b3a22', 4);
          // grand sapin décoré
          s += glow(p + 'tg', tx, tb - th * 0.45, 320, '#ffcf6e', 0.2);
          s += rect(tx - 16, tb - 50, 32, 50, '#5b3a22');
          for (let i = 0; i < 6; i++) { const top = tb - th + i * th * 0.14, bot = tb - 40 - (5 - i) * th * 0.12, hw = th * 0.38 * (0.3 + 0.7 * (i + 1) / 6); s += path(`M${tx} ${N(top)}L${N(tx + hw)} ${N(bot)}Q${tx} ${N(bot - 14)} ${N(tx - hw)} ${N(bot)}Z`, '#17583d') + path(`M${tx} ${N(top)}L${N(tx - hw)} ${N(bot)}Q${N(tx - hw * 0.45)} ${N(bot - 8)} ${N(tx - hw * 0.1)} ${N(bot - 10)}Z`, '#1f6e4b'); }
          for (let i = 0; i < 4; i++) { const y0 = tb - th * (0.78 - i * 0.18), w0 = th * 0.38 * (0.38 + i * 0.16); s += line(`M${N(tx - w0 * 0.75)} ${N(y0)}Q${tx} ${N(y0 + 46)} ${N(tx + w0 * 0.85)} ${N(y0 + 20)}`, '#f6c453', 4, ' opacity=".9"'); }
          const orn = ['#e63946', '#ffd166', '#4ea8ff', '#f4f1ea', '#c77dff'];
          for (let i = 0; i < 28; i++) { const f = rr(r, 0.12, 0.95), y = tb - 40 - (th - 60) * (1 - f), hw = th * 0.38 * f * 0.82; const ox = tx + rr(r, -hw, hw), oc = pick(r, orn), or = rr(r, 6, 10); s += circ(ox, y, or, oc) + circ(ox - or * 0.35, y - or * 0.35, or * 0.3, 'rgba(255,255,255,.55)'); }
          s += [[-150, '#5ee38a', '#e63946'], [-95, '#e63946', '#ffd166'], [-30, '#4ea8ff', '#f4f1ea'], [40, '#ffd166', '#e63946'], [100, '#c77dff', '#ffd166']].map(([dx, a, b2], i) => { const w = 50 + (i % 3) * 14, bx = tx + dx, by = tb + 4; return rect(bx, by - w * 0.8, w, w * 0.8, a) + rect(bx + w * 0.62, by - w * 0.8, w * 0.38, w * 0.8, 'rgba(0,0,0,.14)') + rect(bx + w / 2 - 4, by - w * 0.8, 8, w * 0.8, b2) + rect(bx, by - w * 0.5, w, 7, b2); }).join('');
          s += hill(r, { y: 884, amp: 22, n: 10 }, '#f6faff');
          return s;
        }),
        // étoile du sapin, lumières qui scintillent, guirlande en haut de l'écran
        t.el('star', t.img(spr('sparkle', '#ffe39a'), { left: em(tx - 34), top: em(tb - th - 40), width: em(68), height: em(68), '--s': 1.2, '--o0': 0.75, animation: 'fhs-pulse 2.2s ease-in-out infinite' })),
        t.el('starg', { position: 'absolute', left: em(tx - 60), top: em(tb - th - 66), width: em(120), height: em(120), borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,220,130,.75), rgba(255,220,130,0))', '--s': 1.25, '--o0': 0.5, animation: 'fhs-pulse 2.2s ease-in-out infinite' }),
        ...t.n('lights', 22, (r, i) => { const f = rr(r, 0.15, 0.95), y = tb - 40 - (th - 40) * (1 - f), hw = th * 0.38 * f * 0.8, c = pick(r, bulbs); return t.el('li' + i, { position: 'absolute', left: em(tx + rr(r, -hw, hw) - 5), top: em(y - 5), width: em(10), height: em(10), borderRadius: '50%', background: c, boxShadow: `0 0 .9em .25em ${c}`, '--o0': 0.25, animation: `fhs-tw ${N(rr(r, 1.2, 2.6))}s ease-in-out ${N(-r() * 3)}s infinite` }); }),
        t.art('wire', () => line('M-10 6Q130 80 270 10Q410 80 550 10Q690 80 830 10Q970 80 1110 10Q1250 80 1390 10Q1530 80 1670 10', '#20321f', 3.2)),
        ...t.n('garl', 34, (r, i) => { const x2 = -10 + (i + 0.5) * (1620 / 34), ph = ((x2 + 10) % 280) / 280, y = 8 + 2 * ph * (1 - ph) * 72, c = bulbs[i % bulbs.length]; return t.el('g' + i, { position: 'absolute', left: em(x2 - 6), top: em(y), width: em(12), height: em(17), borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: c, boxShadow: `0 0 1.1em .2em ${c}`, '--o0': 0.3, animation: `fhs-tw 1.8s ease-in-out ${(i % 2) * -0.9}s infinite` }); }),
        ...[1, 4].flatMap((i) => { const [x, b, w, h] = XHOUSES[i]; return smoke(t, 'sm' + i, x + w * 0.72, b - h - w * 0.48 * 0.95 - 4, 5); }),
        ...snowfall(t, 'sn', { far: 30, near: 12, crystals: 6 }),
      ];
    },
  });

  // ---------------- AUTOMNE : forêt à l'heure dorée, feuilles qui tombent, oiseaux ----------------
  def('autumn', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const leafC = ['#d9481c', '#f08a24', '#f6b73c', '#b8321c', '#e2672a', '#c9a227'];
      const kinds = ['maple', 'oak', 'leaf'];
      return [
        t.art('sky', (p) => {
          const r = t.r('sk');
          let s = sky(p + 's', [[0, o.bg2], [0.45, o.bg1], [0.72, o.bg3]]) + glow(p + 'sun', 1010, 600, 420, '#ffd27a', 0.55) + circ(1010, 600, 70, '#ffe7a8', ' opacity=".95"');
          for (let i = 0; i < 6; i++) { const y = rr(r, 120, 360), x = rr(r, -100, 1500); s += ell(x, y, rr(r, 160, 300), rr(r, 10, 20), '#ffc7a0', ` opacity="${N(rr(r, 0.12, 0.3))}"`); }
          return s;
        }),
        t.el('mist1', { position: 'absolute', left: em(-200), top: em(470), width: em(2000), height: em(220), background: 'radial-gradient(45% 50% at 30% 50%, rgba(255,214,170,.28), transparent 70%), radial-gradient(40% 45% at 75% 55%, rgba(255,214,170,.22), transparent 70%)', '--x1': em(140), animation: 'fhs-move 40s ease-in-out infinite alternate' }),
        t.art('forest', (p) => {
          const r = t.r('fo');
          let s = hill(r, { y: 610, amp: 80, n: 16 }, '#9a5a62', ' opacity=".85"');
          for (let i = 0; i < 70; i++) { const x = rr(r, -20, 1620), y = rr(r, 600, 640); s += circ(x, y, rr(r, 14, 26), pick(r, ['#8a3f3a', '#a24c34', '#7d4a3d', '#b2603a'])); }
          s += hill(r, { y: 650, amp: 50, n: 14 }, '#7c3b2a');
          for (let i = 0; i < 40; i++) { const x = rr(r, -20, 1620); if (x > 520 && x < 1080 && r() < 0.6) continue; s += leafy(r, x, rr(r, 668, 700), rr(r, 70, 120), { trunk: '#4a2618', cols: ['#c8461d', '#e2752a', '#eab140', '#a8341c'], shadow: 'rgba(60,20,10,.35)', n: 9 }); }
          // chemin qui serpente
          s += path('M640 900C700 820 820 800 770 760C730 730 800 710 860 700L890 700C840 714 790 734 830 762C890 804 820 836 860 900Z', '#d9a066') + path('M700 900C730 850 790 830 780 800', 'none', ' stroke="#c48a52" stroke-width="5" opacity=".6"');
          s += hill(r, { y: 760, amp: 40, n: 12 }, '#5b2c17');
          return s;
        }),
        t.art('front', (p) => {
          const r = t.r('fr');
          let s = '';
          // tapis de feuilles au sol
          s += path('M-20 900L-20 800C200 780 400 830 640 812L700 900Z', '#4a2412') + path('M870 900L900 812C1100 800 1300 780 1620 806L1620 900Z', '#4a2412');
          for (let i = 0; i < 260; i++) { const x = rr(r, -10, 1610); if (x > 660 && x < 880) continue; const y = rr(r, 812, 900); s += ell(x, y, rr(r, 4, 9), rr(r, 2, 4), pick(r, leafC), ` transform="rotate(${N(rr(r, -60, 60))} ${N(x)} ${N(y)})" opacity="${N(rr(r, 0.7, 1))}"`); }
          // champignons
          [[520, 846, 1], [548, 852, 0.7], [1080, 842, 0.9]].forEach(([x, y, k]) => { s += rect(x - 5 * k, y - 22 * k, 10 * k, 22 * k, '#f1e3cc', ` rx="${N(4 * k)}"`) + path(`M${N(x - 20 * k)} ${N(y - 20 * k)}Q${x} ${N(y - 46 * k)} ${N(x + 20 * k)} ${N(y - 20 * k)}Z`, '#c8321f') + circ(x - 7 * k, y - 30 * k, 3 * k, '#fff3e6') + circ(x + 6 * k, y - 27 * k, 2.4 * k, '#fff3e6'); });
          // clôture
          for (let x = 1120; x < 1420; x += 46) s += rect(x, 760 + (x - 1120) * 0.02, 10, 70, '#6b4128') + path(`M${x - 1} ${760 + (x - 1120) * 0.02}L${x + 5} ${750 + (x - 1120) * 0.02}L${x + 11} ${760 + (x - 1120) * 0.02}Z`, '#6b4128');
          s += line('M1110 782L1430 790M1110 808L1430 816', '#6b4128', 7);
          // grands arbres qui encadrent l'image
          s += leafy(r, 70, 905, 560, { trunk: '#3a1d12', cols: ['#c8461d', '#b8321c', '#d65a24', '#9e2d18'], shadow: 'rgba(50,15,5,.45)', light: 'rgba(255,200,110,.18)', n: 26 });
          s += leafy(r, 1545, 905, 540, { trunk: '#3a1d12', cols: ['#b8321c', '#d9481c', '#c8461d', '#a8341c'], shadow: 'rgba(50,15,5,.45)', light: 'rgba(255,200,110,.16)', n: 24 });
          s += leafy(r, 300, 880, 260, { trunk: '#4a2618', cols: ['#f6b73c', '#eab140', '#f08a24'], shadow: 'rgba(50,15,5,.35)', light: 'rgba(255,240,170,.2)', n: 14 });
          return s;
        }),
        // vol d'oiseaux en V
        t.el('birds', { position: 'absolute', left: em(-300), top: em(190), width: em(240), height: em(120), '--x1': em(2200), '--y1': em(-60), animation: 'fhs-move 46s linear -12s infinite' },
          [[0, 50], [34, 38], [34, 62], [68, 26], [68, 74], [102, 14], [102, 86]].map(([x, y], i) => t.E('div', { key: i, style: t.img(spr('bird', '#3b1d1d'), { left: em(200 - x), top: em(y), width: em(30), height: em(15), '--f': 0.25, animation: `fhs-flap ${N(0.55 + (i % 3) * 0.08)}s ease-in-out ${N(-i * 0.13)}s infinite` }) }))),
        ...drift(t, 'lv', t.n('lv', 22, (r) => ({ x: rr(r, -40, 1600), y: -60, w: rr(r, 22, 38), y1: 1000, x1: rr(r, -240, 160), r0: rr(r, -40, 40), r1: rr(r, -540, 540), dur: rr(r, 10, 17), dl: -r() * 17, sw: rr(r, 3, 6), sr: rr(r, 10, 30), swd: rr(r, 2.4, 4.2), img: spr(pick(r, kinds), pick(r, leafC)) }))),
      ];
    },
  });

  // ---------------- NOUVEL AN : ville la nuit au bord du fleuve, feux d'artifice, confettis ----------------
  def('newyear', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const fw = ['#ffd166', '#f72585', '#4cc9f0', '#7cff6b', '#ffffff', '#ff8c42', '#c77dff'];
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.6, o.bg1], [0.86, '#55307a']]) + starsSvg(t.r('st'), 120, { y1: 520 })),
        twinkles(t, 'tw', 10, [40, 20, 1560, 420]),
        ...fireworks(t, 'fw', 8, { area: [180, 90, 1420, 380], colors: fw, ground: 700, gap: 1.25 }),
        t.art('city', (p) => {
          const r = t.r('ci');
          let s = skyline(r, { y: 720, minW: 40, maxW: 90, minH: 90, maxH: 210, fill: '#2b2357', win: ['#f7d774', '#ffe9a8'], winP: 0.18, winW: 4, winH: 6, gapX: 7, gapY: 9, roofs: true });
          s += skyline(r, { y: 740, minW: 50, maxW: 110, minH: 60, maxH: 170, fill: '#1a1440', win: ['#ffd166', '#ffe3a1', '#9ad8ff'], winP: 0.3, winW: 6, winH: 8, roofs: true });
          // tour de l'horloge (sans chiffres : ils changent chaque année)
          s += rect(760, 520, 80, 240, '#141033') + path('M752 524L800 450L848 524Z', '#141033') + line('M800 450V420', '#141033', 4) + circ(800, 572, 26, '#ffe8a8') + circ(800, 572, 26, 'none', ' stroke="#141033" stroke-width="4"') + line('M800 572V556M800 572L812 578', '#141033', 3);
          s += skyline(r, { y: 770, x0: -20, x1: 700, minW: 60, maxW: 130, minH: 40, maxH: 120, fill: '#0e0b26', win: ['#ffd166', '#ffb86b'], winP: 0.35, winW: 7, winH: 9, roofs: true });
          s += skyline(r, { y: 770, x0: 900, x1: 1620, minW: 60, maxW: 130, minH: 40, maxH: 120, fill: '#0e0b26', win: ['#ffd166', '#ffb86b'], winP: 0.35, winW: 7, winH: 9, roofs: true });
          // quai et fleuve avec reflets
          s += rect(-10, 768, 1620, 14, '#191431') + `<defs>${lg(p + 'w', [[0, '#120e30'], [1, '#05040f']])}</defs>` + rect(-10, 782, 1620, 130, `url(#${p}w)`);
          for (let i = 0; i < 90; i++) { const x = rr(r, 0, 1600), c = pick(r, ['#ffd166', '#ffb86b', '#9ad8ff', '#f72585']); s += rect(x, rr(r, 790, 860), rr(r, 3, 6), rr(r, 10, 36), c, ` opacity="${N(rr(r, 0.12, 0.35))}"`); }
          return s;
        }),
        // reflets qui scintillent sur l'eau
        ...t.n('ref', 14, (r, i) => t.el('rf' + i, { position: 'absolute', left: em(rr(r, 0, 1580)), top: em(rr(r, 795, 880)), width: em(rr(r, 30, 70)), height: em(3), borderRadius: 9, background: pick(r, ['#ffd166', '#ffe9a8', '#9ad8ff']), '--o0': 0.05, '--o1': 0.55, animation: `fhs-tw ${N(rr(r, 1.6, 3.4))}s ease-in-out ${N(-r() * 3)}s infinite` })),
        ...confetti(t, 'cf', 26, ['#ffd166', '#f72585', '#4cc9f0', '#7cff6b', '#ffffff', '#c77dff']),
      ];
    },
  });

  // ---------------- 14 JUILLET : Paris la nuit, tour Eiffel qui scintille, feux bleu blanc rouge ----------------
  function eiffel(cx, base, h, fill, lattice) {
    const k = h / 630, X = (dx) => cx + dx * k, Y = (f) => base - f * h;
    const side = (s) => `M${N(X(-122 * s))} ${N(base)}Q${N(X(-96 * s))} ${N(Y(0.12))} ${N(X(-80 * s))} ${N(Y(0.235))}L${N(X(-48 * s))} ${N(Y(0.45))}Q${N(X(-24 * s))} ${N(Y(0.62))} ${N(X(-12 * s))} ${N(Y(0.8))}L${N(X(-5 * s))} ${N(Y(0.965))}`;
    const outline = `${side(1)}L${N(X(0))} ${N(Y(1.04))}L${N(X(5))} ${N(Y(0.965))}L${N(X(12))} ${N(Y(0.8))}Q${N(X(24))} ${N(Y(0.62))} ${N(X(48))} ${N(Y(0.45))}L${N(X(80))} ${N(Y(0.235))}Q${N(X(96))} ${N(Y(0.12))} ${N(X(122))} ${N(base)}L${N(X(70))} ${N(base)}Q${N(X(40))} ${N(Y(0.13))} ${N(X(0))} ${N(Y(0.135))}Q${N(X(-40))} ${N(Y(0.13))} ${N(X(-70))} ${N(base)}Z`;
    let s = path(outline, fill);
    s += `<defs><clipPath id="eif"><path d="${outline}"/></clipPath></defs><g clip-path="url(#eif)" stroke="${lattice}" stroke-width="${N(2 * k)}" fill="none" opacity=".75">`;
    for (let f = 0.02; f < 0.98; f += 0.045) { const w = 130 - f * 125; s += `<path d="M${N(X(-w))} ${N(Y(f))}L${N(X(w))} ${N(Y(f + 0.045))}M${N(X(w))} ${N(Y(f))}L${N(X(-w))} ${N(Y(f + 0.045))}"/>`; }
    s += '</g>';
    s += rect(X(-92), Y(0.245), 184 * k, 12 * k, fill) + rect(X(-56), Y(0.455), 112 * k, 10 * k, fill) + rect(X(-16), Y(0.81), 32 * k, 8 * k, fill);
    return s;
  }
  function haussmann(r, x0, x1, base, o) {
    let s = '', x = x0;
    while (x < x1) {
      const w = rr(r, 90, 170), h = rr(r, o.h[0], o.h[1]), top = base - h;
      s += rect(x, top, w, h + 2, o.wall) + path(`M${N(x - 3)} ${N(top + 1)}L${N(x + 10)} ${N(top - 34)}L${N(x + w - 10)} ${N(top - 34)}L${N(x + w + 3)} ${N(top + 1)}Z`, o.roof);
      for (let cx = x + 16; cx < x + w - 10; cx += rr(r, 34, 56)) s += rect(cx, top - 50, 10, 18, o.roof);
      for (let wy = top + 14; wy < base - 20; wy += 26) { s += rect(x, wy + 17, w, 2, o.line); for (let wx = x + 9; wx < x + w - 14; wx += 20) if (r() < 0.75) s += rect(wx, wy, 9, 15, r() < o.lit ? pick(r, o.win) : o.dark); }
      for (let wx = x + 14; wx < x + w - 14; wx += 28) if (r() < 0.6) s += rect(wx, top - 26, 10, 12, r() < o.lit ? o.win[0] : o.dark);
      x += w + 2;
    }
    return s;
  }
  def('bastille', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const E = t.E, tri = ['#3a6bff', '#ffffff', '#ff3b4e'];
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.6, o.bg1], [0.84, '#3b356f']]) + starsSvg(t.r('st'), 100, { y1: 480 }) + glow(p + 'h', 800, 760, 700, '#e63946', 0.16)),
        ...fireworks(t, 'fw', 8, { area: [160, 80, 1080, 360], colors: tri, ground: 720, gap: 1.2 }),
        // phare de la tour qui balaie le ciel
        ...[0, 1].map((i) => t.el('beam' + i, { position: 'absolute', left: em(1250 - 1150), top: em(236 - 23), width: em(1150), height: em(46), transformOrigin: '100% 50%', transform: `rotate(${i ? 22 : 8}deg)` },
          E('div', { style: { width: '100%', height: '100%', transformOrigin: '100% 50%', background: 'linear-gradient(270deg, rgba(255,240,200,.42), rgba(255,240,200,0))', clipPath: 'polygon(0 0, 100% 45%, 100% 55%, 0 100%)', '--a': '16deg', animation: `fhs-rock ${i ? 11 : 8}s ease-in-out ${-i * 3}s infinite` } }))),
        t.art('city', (p) => {
          const r = t.r('ci');
          let s = '';
          // Sacré-Cœur au loin
          s += path('M210 640Q210 580 250 570Q290 580 290 640Z', '#2a2d5c') + path('M232 572Q250 520 268 572Z', '#2a2d5c') + rect(246, 500, 8, 26, '#2a2d5c') + path('M150 650Q150 610 175 604Q200 610 200 650Z', '#2a2d5c') + path('M300 650Q300 610 325 604Q350 610 350 650Z', '#2a2d5c') + rect(130, 640, 240, 60, '#2a2d5c');
          s += skyline(r, { y: 700, minW: 60, maxW: 120, minH: 40, maxH: 90, fill: '#232554', win: ['#ffd98a'], winP: 0.12, winW: 4, winH: 6 });
          // tour Eiffel illuminée
          s += `<defs>${lg(p + 'e', [[0, '#ffe39a'], [0.5, '#f4b34a'], [1, '#b8650f']])}</defs>` + glow(p + 'eg', 1250, 520, 420, '#ffb84d', 0.22) + eiffel(1250, 800, 600, `url(#${p}e)`, '#7a3d05');
          s += circ(1250, 236, 8, '#fff6d6');
          // immeubles haussmanniens et la Seine
          s += haussmann(r, -20, 1050, 790, { h: [110, 170], wall: '#3a3b6e', roof: '#262757', line: '#2c2d5c', win: ['#ffd98a', '#ffe7b0', '#ffc46b'], dark: '#1c1d45', lit: 0.45 });
          s += haussmann(r, 1420, 1640, 790, { h: [110, 160], wall: '#3a3b6e', roof: '#262757', line: '#2c2d5c', win: ['#ffd98a', '#ffe7b0'], dark: '#1c1d45', lit: 0.45 });
          s += rect(-10, 788, 1620, 16, '#2b2a55') + `<defs>${lg(p + 'w', [[0, '#141a46'], [1, '#05081c']])}</defs>` + rect(-10, 804, 1620, 110, `url(#${p}w)`);
          // pont à arches
          s += rect(-10, 812, 1620, 18, '#3a3b6e') + [0, 1, 2, 3, 4, 5].map((i) => path(`M${-10 + i * 290} 830L${270 + i * 290} 830Q${130 + i * 290} 760 ${-10 + i * 290} 830Z`, '#05081c')).join('');
          for (let i = 0; i < 12; i++) { const x = 30 + i * 140; s += rect(x, 790, 4, 22, '#2b2a55') + circ(x + 2, 788, 5, '#ffe7b0') + glow(p + 'l' + i, x + 2, 788, 26, '#ffd98a', 0.5); }
          for (let i = 0; i < 80; i++) { const x = rr(r, 0, 1600), c = pick(r, ['#ffd98a', '#ffb84d', '#3a6bff', '#ff3b4e']); s += rect(x, rr(r, 836, 890), rr(r, 3, 6), rr(r, 8, 24), c, ` opacity="${N(rr(r, 0.12, 0.3))}"`); }
          return s;
        }),
        // la tour scintille (comme chaque heure à Paris)
        ...t.n('sp', 26, (r, i) => { const f = Math.pow(r(), 1.3) * 0.95, hw = (122 - f * 118) * (600 / 630) * 0.85, y = 800 - f * 600; return t.el('sp' + i, t.img(spr('sparkle', '#ffffff'), { left: em(1250 + rr(r, -hw, hw) - 6), top: em(y - 6), width: em(12), height: em(12), '--o0': 0, animation: `fhs-tw ${N(rr(r, 0.5, 1.1))}s ease-in-out ${N(-r() * 2)}s infinite` })); }),
        ...t.n('ref', 12, (r, i) => t.el('rf' + i, { position: 'absolute', left: em(rr(r, 0, 1580)), top: em(rr(r, 840, 885)), width: em(rr(r, 30, 70)), height: em(3), borderRadius: 9, background: pick(r, ['#ffd98a', '#ffe7b0', '#7d9bff']), '--o0': 0.05, '--o1': 0.5, animation: `fhs-tw ${N(rr(r, 1.6, 3.4))}s ease-in-out ${N(-r() * 3)}s infinite` })),
        // petit drapeau qui flotte
        t.el('flag', { position: 'absolute', left: em(436), top: em(596), width: em(90), height: em(60), transformOrigin: '0 50%', '--a': '4deg', animation: 'fhs-rock 3s ease-in-out infinite' },
          E('div', { style: { width: '100%', height: '100%', background: 'linear-gradient(90deg, #2350d8 0 33.3%, #ffffff 33.3% 66.6%, #e63946 66.6%)', borderRadius: '2px 8px 8px 2px', boxShadow: '0 .3em .8em rgba(0,0,0,.3)' } })),
        t.still(rect(436, 596, 90, 60, '#ffffff') + rect(436, 596, 30, 60, '#2350d8') + rect(496, 596, 30, 60, '#e63946')),
        t.el('pole', { position: 'absolute', left: em(430), top: em(588), width: em(6), height: em(205), background: '#2b2a55', borderRadius: 4 }),
      ];
    },
  });

  // nuages qui dérivent lentement d'un bord à l'autre
  function clouds(t, key, list) {
    return drift(t, key, list.map((c) => ({ x: c.x, y: c.y, w: 240 * c.k, h: 110 * c.k, x1: c.dx, dur: c.dur, dl: c.dl || 0, img: cached('cl|' + c.c + c.s, () => svg('-125 -75 250 125', cloud(0, 0, 1, c.c, c.s, c.h))), op: c.op })));
  }
  // papillons qui volettent (trajet aller-retour + battement d'ailes)
  function butterflies(t, key, n, area, cols) {
    if (t.preview) return [];
    return t.n(key, n, (r, i) => ({ x: rr(r, area[0], area[2]), y: rr(r, area[1], area[3]), dx: rr(r, -260, 260), dy: rr(r, -90, 60), dur: rr(r, 9, 16), c: pick(r, cols) })).map((b, i) => t.E('div', { key: key + i, style: { position: 'absolute', left: em(b.x), top: em(b.y), width: em(36), height: em(29), '--x1': em(b.dx), '--y1': em(b.dy), '--r1': (b.dx > 0 ? 12 : -12) + 'deg', animation: `fhs-move ${N(b.dur)}s ease-in-out ${N(-i * 2.3)}s infinite alternate` } },
      t.E('div', { style: { width: '100%', height: '100%', '--by': em(-14), animation: `fhs-bob ${N(1.6 + (i % 3) * 0.3)}s ease-in-out infinite` } },
        t.E('div', { style: t.img(spr('butterfly', b.c[0], b.c[1]), { position: 'static', width: '100%', height: '100%', '--f': 0.2, animation: `fhs-flapx ${N(0.22 + (i % 2) * 0.05)}s ease-in-out infinite` }) }))));
  }
  // œuf décoré (rayures, zigzag ou pois), découpé dans sa forme
  function egg(id, x, y, s, base, deco, c2, rot) {
    const d = `M${N(x)} ${N(y - 1.3 * s)}C${N(x + 0.98 * s)} ${N(y - 1.3 * s)} ${N(x + 1.05 * s)} ${N(y + 0.92 * s)} ${N(x)} ${N(y + 0.95 * s)}C${N(x - 1.05 * s)} ${N(y + 0.92 * s)} ${N(x - 0.98 * s)} ${N(y - 1.3 * s)} ${N(x)} ${N(y - 1.3 * s)}Z`;
    let pat = '';
    if (deco === 0) pat = rect(x - s * 1.2, y - s * 0.35, s * 2.4, s * 0.32, c2) + rect(x - s * 1.2, y + s * 0.25, s * 2.4, s * 0.18, c2, ' opacity=".75"');
    else if (deco === 1) { let z = `M${N(x - s * 1.2)} ${N(y)}`; for (let k = 0; k < 8; k++) z += `L${N(x - s * 1.2 + (k + 0.5) * s * 0.3)} ${N(y + (k % 2 ? 0.22 : -0.22) * s)}`; pat = line(z, c2, N(s * 0.16)) + line(z.replace(/ (-?[\d.]+)(?=L|$)/g, (m, v) => ' ' + N(+v - s * 0.55)), '#ffffff', N(s * 0.1), ' opacity=".8"'); }
    else pat = [[-0.4, -0.5], [0.35, -0.3], [-0.1, 0.1], [0.45, 0.4], [-0.5, 0.45], [0.05, -0.9]].map(([a, b]) => circ(x + a * s, y + b * s, s * 0.16, c2)).join('');
    return `<g transform="rotate(${rot || 0} ${N(x)} ${N(y)})"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>${path(d, base)}<g clip-path="url(#${id})">${pat}${ell(x + s * 0.55, y + s * 0.2, s * 0.6, s * 1.3, 'rgba(0,0,0,.08)')}${ell(x - s * 0.4, y - s * 0.6, s * 0.18, s * 0.34, 'rgba(255,255,255,.5)')}</g></g>`;
  }
  Object.assign(SP, {
    chick: () => svg('0 0 50 50', ell(25, 47, 14, 2.5, 'rgba(0,0,0,.12)') + line('M20 40L18 46M30 40L32 46', '#f08a24', 2) + circ(25, 30, 15, '#ffd84d') + circ(25, 16, 11, '#ffe066') + path('M33 15L41 17.5L33 20Z', '#f08a24') + circ(28.5, 13.5, 1.8, '#2b2118') + path('M15 30Q9 26 11 34Q14 36 18 34Z', '#f5c431') + path('M22 5Q24 1 27 5', 'none', ' stroke="#f5c431" stroke-width="2"') + circ(31, 19, 2.2, '#ff9f9f', ' opacity=".6"')),
    boat: () => svg('0 0 120 130', path('M58 8L58 96L14 96Z', '#ffffff') + path('M64 18L64 96L104 96Z', '#ffd8a8') + rect(59, 4, 4, 98, '#6b4a3a') + path('M8 100L112 100L98 120L22 120Z', '#d6334a') + rect(8, 100, 104, 5, '#ffffff') + path('M58 8L70 13L58 18Z', '#3a6bff')),
    crab: () => svg('0 0 60 40', ell(30, 26, 18, 11, '#e2533b') + ell(30, 23, 14, 6, '#f2765c') + line('M14 28L4 34M15 32L7 39M46 28L56 34M45 32L53 39', '#c8402c', 2.6) + line('M18 20L10 10M42 20L50 10', '#c8402c', 3) + circ(8, 8, 6, '#e2533b') + circ(52, 8, 6, '#e2533b') + path('M3 6L9 9L4 12Z', '#a8341c') + path('M57 6L51 9L56 12Z', '#a8341c') + line('M25 18V12M35 18V12', '#c8402c', 1.6) + circ(25, 11, 3, '#ffffff') + circ(35, 11, 3, '#ffffff') + circ(25.5, 11, 1.6, '#2b2118') + circ(35.5, 11, 1.6, '#2b2118')),
    foam: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 60" preserveAspectRatio="none">${path(`M0 30${Array.from({ length: 20 }, (_, i) => `Q${i * 40 + 20} ${i % 2 ? 44 : 14} ${i * 40 + 40} 30`).join('')}L800 60L0 60Z`, c)}</svg>`,
    rays: (c, n) => svg('-100 -100 200 200', `<defs>${rg('g', [[0, c, 0.5], [0.35, c, 0.28], [1, c, 0]], 0.5, 0.5, 0.5)}</defs><g fill="url(#g)">${Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, b = a + Math.PI / n * 0.7; return `<path d="M0 0L${N(Math.cos(a) * 100)} ${N(Math.sin(a) * 100)}L${N(Math.cos(b) * 100)} ${N(Math.sin(b) * 100)}Z"/>`; }).join('')}</g>`),
    rose: (c) => svg('0 0 20 20', path('M10 18.5C3 14 2 7 6 3.5C8 2 9.5 3 10 5C10.5 3 12 2 14 3.5C18 7 17 14 10 18.5Z', c) + path('M10 16C7 13 6.5 9 8.5 6.5', 'none', ' stroke="rgba(0,0,0,.18)" stroke-width="1"')),
  });

  // ---------------- PRINTEMPS : prairie fleurie, cerisier en fleurs, papillons ----------------
  def('spring', {
    base: (o) => o.bg1,
    layers: (t, o) => {
      const pinkC = ['#ffb7d5', '#ff9cc5', '#ffd1e3', '#ffc2dc'];
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.55, o.bg1], [0.78, o.bg3]]) + glow(p + 'sun', 1300, 140, 300, '#fff4b8', 0.75) + circ(1300, 140, 54, '#fff8d6')),
        ...clouds(t, 'cl', [{ x: -260, y: 90, k: 1.1, dx: 2000, dur: 120, dl: -20, c: '#ffffff', s: '#dcefff' }, { x: -260, y: 200, k: 0.75, dx: 2000, dur: 90, dl: -60, c: '#ffffff', s: '#dcefff' }, { x: -260, y: 40, k: 0.6, dx: 2000, dur: 140, dl: -100, c: '#ffffff', s: '#dcefff' }]),
        t.still(cloud(380, 120, 1.1, '#ffffff', '#dcefff') + cloud(980, 220, 0.75, '#ffffff', '#dcefff')),
        t.art('land', (p) => {
          const r = t.r('la');
          let s = hill(r, { y: 640, amp: 70, n: 14 }, '#bfe6a8');
          for (let i = 0; i < 40; i++) { const x = rr(r, -20, 1620), y = rr(r, 600, 640); s += circ(x, y, rr(r, 8, 15), pick(r, ['#8fcf7a', '#7cc46a', '#a6d98e'])); }
          s += rect(1060, 600, 46, 30, '#fffaf0') + path('M1054 602L1083 580L1112 602Z', '#e2533b') + rect(1076, 612, 9, 18, '#a6754a');
          s += hill(r, { y: 690, amp: 60, n: 14 }, '#97d880') + hill(r, { y: 745, amp: 45, n: 12 }, '#79c564');
          for (let i = 0; i < 140; i++) { const x = rr(r, -10, 1610), y = rr(r, 700, 790); s += circ(x, y, rr(r, 1.6, 3), pick(r, ['#ffffff', '#ffe066', '#ff9cc5', '#c9a7ff'])); }
          return s;
        }),
        t.art('front', (p) => {
          const r = t.r('fr');
          let s = hill(r, { y: 812, amp: 36, n: 12 }, '#5fb04c') + rect(-10, 840, 1620, 70, '#58a646');
          s += grass(r, 260, { x0: -10, x1: 1610, y0: 820, y1: 905, h: [14, 34], c: ['#3f8f35', '#4e9e3e', '#6cbf57'], w: 2 });
          // cerisier
          s += leafy(r, 210, 860, 560, { trunk: '#5a3a2e', cols: pinkC, shadow: 'rgba(200,90,140,.35)', light: 'rgba(255,255,255,.35)', n: 30, dots: { n: 40, r: 4, c: ['#ffffff', '#ff7fb2'] } });
          s += leafy(r, 1440, 850, 380, { trunk: '#5a3a2e', cols: pinkC, shadow: 'rgba(200,90,140,.3)', light: 'rgba(255,255,255,.35)', n: 20, dots: { n: 24, r: 3.5, c: ['#ffffff', '#ff7fb2'] } });
          // pétales tombés au pied des arbres
          for (let i = 0; i < 60; i++) { const x = rr(r, 60, 420), y = rr(r, 840, 890); s += ell(x, y, 4, 2.4, pick(r, pinkC)); }
          // tulipes, marguerites, pissenlits
          const tc = ['#e63946', '#ffd166', '#ff6fb5', '#9d6bff', '#ff8c42'];
          for (let i = 0; i < 34; i++) { const x = rr(r, 380, 1300); if (x > 640 && x < 960 && r() < 0.7) continue; s += tulip(x, rr(r, 860, 900), rr(r, 40, 70), pick(r, tc), '#3f8f35'); }
          for (let i = 0; i < 40; i++) { const x = rr(r, -10, 1610), y = rr(r, 830, 900); s += line(`M${N(x)} ${N(y)}V${N(y - 22)}`, '#3f8f35', 1.6) + flower(x, y - 24, rr(r, 0.9, 1.3), pick(r, ['#ffffff', '#fff6d6']), '#ffcc33', 8); }
          return s;
        }),
        ...drift(t, 'pt', t.n('pt', 18, (r) => ({ x: rr(r, 0, 1600), y: -40, w: rr(r, 14, 22), y1: 980, x1: rr(r, -200, 200), r1: rr(r, -400, 400), dur: rr(r, 11, 18), dl: -r() * 18, sw: rr(r, 3, 5), sr: 20, swd: rr(r, 2.5, 4), img: spr('petal', pick(r, pinkC)) }))),
        butterflies(t, 'bf', 4, [300, 260, 1300, 620], [['#ff9f43', '#ffd166'], ['#7ec8ff', '#c9a7ff'], ['#ff6fb5', '#ffd1e3'], ['#ffd166', '#ffe9a8']]),
        ...t.n('bee', 2, (r, i) => t.el('bee' + i, t.img(spr('bee'), { left: em(i ? 1180 : 520), top: em(i ? 700 : 740), width: em(34), height: em(26), '--bx': em(i ? -60 : 70), '--by': em(-30), '--br': '8deg', animation: `fhs-bob ${i ? 3.4 : 2.8}s ease-in-out infinite` }))),
      ];
    },
  });

  // ---------------- PÂQUES : jardin, panier d'œufs décorés, lapin, poussins ----------------
  def('easter', {
    base: (o) => o.bg1,
    layers: (t, o) => {
      const ec = ['#ff8fab', '#ffd166', '#8ecae6', '#b8f2a6', '#c9a7ff', '#ffb38a'];
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.55, o.bg1], [0.8, o.bg3]]) + glow(p + 'sun', 260, 130, 280, '#fff4b8', 0.7) + circ(260, 130, 48, '#fff8d6')),
        ...clouds(t, 'cl', [{ x: -260, y: 70, k: 0.9, dx: 2000, dur: 110, dl: -30, c: '#ffffff', s: '#e2f1ff' }, { x: -260, y: 190, k: 0.65, dx: 2000, dur: 85, dl: -70, c: '#ffffff', s: '#e2f1ff' }]),
        t.still(cloud(700, 110, 0.9, '#ffffff', '#e2f1ff') + cloud(1150, 200, 0.65, '#ffffff', '#e2f1ff')),
        t.art('land', (p) => {
          const r = t.r('la');
          let s = hill(r, { y: 650, amp: 60, n: 14 }, '#c6ecb0') + hill(r, { y: 710, amp: 55, n: 14 }, '#a3dd8a') + hill(r, { y: 790, amp: 40, n: 12 }, '#86cf6c') + rect(-10, 830, 1620, 80, '#79c45e');
          s += grass(r, 220, { x0: -10, x1: 1610, y0: 800, y1: 905, h: [12, 30], c: ['#5aa846', '#68b852', '#4f9a3e'], w: 2 });
          for (let i = 0; i < 26; i++) { const x = rr(r, -10, 1610); if (x > 560 && x < 1040) continue; s += tulip(x, rr(r, 860, 900), rr(r, 36, 60), pick(r, ['#ff6fb5', '#ffd166', '#c9a7ff', '#ff8c42']), '#4f9a3e'); }
          // œufs cachés dans l'herbe
          [[460, 842, 20, 0, -12], [560, 862, 17, 1, 10], [1040, 856, 19, 2, -8], [1120, 840, 15, 0, 14], [1250, 870, 22, 1, -6], [380, 872, 15, 2, 6], [700, 880, 14, 0, -16], [930, 884, 16, 2, 12]].forEach(([x, y, k, d, rot], i) => { s += ell(x + 4, y + k * 0.95, k * 0.9, k * 0.22, 'rgba(0,60,0,.18)') + egg(p + 'e' + i, x, y, k, ec[i % ec.length], d, ec[(i + 2) % ec.length], rot); });
          // panier plein d'œufs
          const bx = 240, by = 840;
          s += ell(bx, by + 6, 150, 18, 'rgba(0,60,0,.2)') + path(`M${bx - 130} ${by - 70}Q${bx} ${by - 300} ${bx + 130} ${by - 70}`, 'none', ' stroke="#a8743f" stroke-width="12"');
          [[-80, -88, 30, 0, -14], [-30, -100, 32, 1, 6], [25, -96, 30, 2, -4], [75, -86, 28, 0, 12], [-55, -70, 26, 2, 4], [50, -68, 26, 1, -10]].forEach(([dx, dy, k, d, rot], i) => { s += egg(p + 'b' + i, bx + dx, by + dy, k, ec[(i + 1) % ec.length], d, ec[(i + 3) % ec.length], rot); });
          s += path(`M${bx - 140} ${by - 76}L${bx + 140} ${by - 76}L${bx + 110} ${by}L${bx - 110} ${by}Z`, '#c68a4a');
          for (let k = 0; k < 6; k++) s += line(`M${bx - 136 + k * 3} ${by - 66 + k * 13}H${bx + 136 - k * 3}`, '#a8743f', 4);
          for (let k = 0; k < 11; k++) s += line(`M${bx - 120 + k * 24} ${by - 76}L${bx - 100 + k * 20} ${by}`, '#b67a3c', 3);
          s += path(`M${bx - 30} ${by - 76}Q${bx - 70} ${by - 110} ${bx - 60} ${by - 60}Z M${bx + 30} ${by - 76}Q${bx + 70} ${by - 110} ${bx + 60} ${by - 60}Z`, '#ff6fb5') + circ(bx, by - 74, 11, '#ff4f9a');
          // lapin assis
          const lx = 1330, ly = 860;
          s += ell(lx, ly + 4, 90, 14, 'rgba(0,60,0,.2)') + ell(lx, ly - 60, 72, 66, '#f4f1ee') + ell(lx + 30, ly - 44, 40, 46, '#e5dfdb') + circ(lx - 66, ly - 42, 18, '#ffffff');
          s += ell(lx + 12, ly - 4, 34, 13, '#ece6e2') + ell(lx - 30, ly - 4, 26, 11, '#ece6e2');
          s += path(`M${lx + 4} ${ly - 150}C${lx - 16} ${ly - 250} ${lx + 18} ${ly - 270} ${lx + 26} ${ly - 160}Z`, '#f4f1ee') + path(`M${lx + 8} ${ly - 156}C${lx - 4} ${ly - 236} ${lx + 16} ${ly - 246} ${lx + 20} ${ly - 162}Z`, '#ffc2d1');
          s += path(`M${lx + 40} ${ly - 150}C${lx + 50} ${ly - 250} ${lx + 86} ${ly - 240} ${lx + 62} ${ly - 150}Z`, '#ece6e2') + path(`M${lx + 45} ${ly - 156}C${lx + 54} ${ly - 230} ${lx + 76} ${ly - 226} ${lx + 58} ${ly - 158}Z`, '#ffb3c7');
          s += circ(lx + 30, ly - 128, 46, '#f4f1ee') + circ(lx + 46, ly - 136, 5, '#2b2118') + circ(lx + 47.5, ly - 137.5, 1.6, '#ffffff') + circ(lx + 14, ly - 136, 5, '#2b2118') + ell(lx + 31, ly - 114, 6, 4.5, '#ff8fab') + circ(lx + 56, ly - 116, 7, '#ffc2d1', ' opacity=".7"') + circ(lx + 4, ly - 116, 7, '#ffc2d1', ' opacity=".7"');
          s += line(`M${lx + 38} ${ly - 112}L${lx + 70} ${ly - 118}M${lx + 38} ${ly - 108}L${lx + 70} ${ly - 104}M${lx + 24} ${ly - 112}L${lx - 6} ${ly - 118}M${lx + 24} ${ly - 108}L${lx - 6} ${ly - 104}`, '#b9aea8', 1.2);
          return s;
        }),
        ...[[420, 800, 50], [520, 826, 44], [1180, 820, 46]].map(([x, y, z], i) => t.el('ch' + i, { position: 'absolute', left: em(x), top: em(y), width: em(z), height: em(z), transform: i === 2 ? 'scaleX(-1)' : undefined }, t.E('div', { style: t.img(spr('chick'), { inset: 0, transformOrigin: '50% 100%', '--hy': em(-18), animation: `fhs-hop ${N(2.2 + i * 0.5)}s ease-in-out ${N(-i * 0.7)}s infinite` }) }))),
        t.still([[420, 800, 50], [520, 826, 44], [1180, 820, 46]].map(([x, y, z]) => `<image href="${spr('chick').slice(5, -2)}" x="${x}" y="${y}" width="${z}" height="${z}"/>`).join('')),
        butterflies(t, 'bf', 3, [300, 300, 1300, 640], [['#ff8fab', '#ffd1e3'], ['#8ecae6', '#c9a7ff'], ['#ffd166', '#ffe9a8']]),
        ...drift(t, 'pt', t.n('pt', 10, (r) => ({ x: rr(r, 0, 1600), y: -40, w: rr(r, 13, 19), y1: 980, x1: rr(r, -200, 200), r1: rr(r, -400, 400), dur: rr(r, 12, 19), dl: -r() * 19, sw: 4, sr: 20, swd: 3.4, img: spr('petal', pick(r, ['#ffd1e3', '#fff6d6', '#ffe0ef'])) }))),
      ];
    },
  });

  // ---------------- ÉTÉ : plage, palmiers, voilier, mouettes, vagues ----------------
  function palm(r, x, base, h, lean, o) {
    const topX = x + lean, topY = base - h;
    let s = '';
    for (let k = 0; k < 14; k++) { const t0 = k / 14, t1 = (k + 1) / 14, xa = x + lean * t0 * t0, ya = base - h * t0, xb = x + lean * t1 * t1, yb = base - h * t1, w = 16 - t0 * 7; s += path(`M${N(xa - w)} ${N(ya)}L${N(xb - w + 1)} ${N(yb)}L${N(xb + w - 1)} ${N(yb)}L${N(xa + w)} ${N(ya)}Z`, k % 2 ? o.trunk : o.trunk2); }
    const fr = [[-150, 30], [-120, -40], [-60, -80], [20, -95], [90, -60], [140, 10], [150, 60], [-160, 80]];
    fr.forEach(([dx, dy], i) => { const ex = topX + dx, ey = topY + dy + 40, mx = topX + dx * 0.5, my = topY + dy * 0.6 - 30; s += path(`M${N(topX)} ${N(topY)}Q${N(mx)} ${N(my - 20)} ${N(ex)} ${N(ey)}Q${N(mx + 10)} ${N(my + 14)} ${N(topX)} ${N(topY + 8)}Z`, i % 2 ? o.leaf : o.leaf2); for (let q = 1; q < 6; q++) { const f = q / 6, px = topX + (ex - topX) * f, py = topY + (ey - topY) * f - Math.sin(f * Math.PI) * 30; s += line(`M${N(px)} ${N(py)}l${N((dy > 0 ? 8 : -6))} ${N(18)}`, o.leaf2, 4, ' opacity=".7"'); } });
    s += circ(topX - 8, topY + 10, 9, '#6b4a2a') + circ(topX + 8, topY + 12, 9, '#7a5533') + circ(topX, topY + 20, 9, '#6b4a2a');
    return s;
  }
  def('summer', {
    base: (o) => o.bg1,
    layers: (t, o) => {
      const E = t.E;
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.5, o.bg1], [0.655, '#bfe9ff'], [0.66, '#1fb5c9'], [0.82, '#0b88b8']])),
        t.el('rays', t.img(spr('rays', '#fff6c8', 22), { left: em(1290 - 360), top: em(150 - 360), width: em(720), height: em(720), animation: 'fhs-spin 90s linear infinite' })),
        t.art('sun', (p) => glow(p + 'g', 1290, 150, 260, '#fff2a8', 0.85) + circ(1290, 150, 62, '#fffbe0') + circ(1290, 150, 62, 'none', ' stroke="#ffe27a" stroke-width="6" opacity=".6"') + cloud(300, 150, 0.8, '#ffffff', '#d7efff') + cloud(560, 250, 0.55, '#ffffff', '#d7efff') + cloud(1000, 110, 0.45, '#ffffff', '#d7efff')),
        t.art('sea', (p) => {
          const r = t.r('se');
          let s = path('M-20 596Q80 540 180 560Q260 520 330 596Z', '#3f9a6a') + palm(r, 210, 590, 70, 14, { trunk: '#7a5533', trunk2: '#6b4a2a', leaf: '#2f8a4a', leaf2: '#3fa05a' }).replace(/stroke-width="4"/g, 'stroke-width="1.5"');
          for (let i = 0; i < 60; i++) { const y = rr(r, 610, 740); s += rect(rr(r, -10, 1600), y, rr(r, 20, 90), 2, '#ffffff', ` opacity="${N(rr(r, 0.12, 0.35))}"`); }
          s += `<defs>${lg(p + 'sa', [[0, '#f6dfae'], [1, '#e8c487']])}</defs>` + path('M-20 900L-20 772C200 756 420 780 640 768C900 754 1140 778 1400 762C1500 756 1580 764 1620 760L1620 900Z', `url(#${p}sa)`);
          s += path('M-20 780C200 764 420 788 640 776C900 762 1140 786 1400 770C1500 764 1580 772 1620 768L1620 790C1400 792 1100 806 800 796C500 786 200 806 -20 796Z', '#d9b47a', ' opacity=".55"');
          for (let i = 0; i < 120; i++) s += circ(rr(r, -10, 1610), rr(r, 800, 900), rr(r, 1, 2.2), pick(r, ['#d4ad72', '#fff1d0', '#c99a5e']));
          // parasol, serviette, seau, étoile de mer, coquillages
          s += path('M1040 870L1210 846L1226 880L1056 904Z', '#ff6b6b') + path('M1078 864L1094 862L1110 896L1094 898Z M1146 855L1162 853L1178 887L1162 889Z', '#ffffff');
          s += line('M1130 900L1112 640', '#8a6a4a', 6) + path('M1000 680Q1110 560 1230 640Q1170 640 1115 650Q1060 660 1000 680Z', '#ff5a5f') + path('M1040 664Q1080 600 1112 600Q1100 640 1083 655Z M1150 640Q1150 600 1112 600Q1140 610 1190 642Z', '#ffffff');
          s += path('M300 880L310 840L340 840L350 880Z', '#4ea8ff') + path('M302 846Q325 812 348 846', 'none', ' stroke="#2f6fd6" stroke-width="3"') + line('M352 870L392 820M386 818L398 826', '#ffb703', 4);
          s += path('M880 870l7 -17l7 17l18 1l-14 11l5 18l-16 -10l-16 10l5 -18l-14 -11Z', '#ff8c5a') + path('M560 880q10 -16 20 0q-10 6 -20 0Z', '#ffe0d0') + path('M1340 868q8 -14 16 0q-8 5 -16 0Z', '#ffd0e0');
          // palmiers de premier plan
          s += palm(r, 120, 905, 520, 120, { trunk: '#8a6340', trunk2: '#7a5533', leaf: '#2f8a4a', leaf2: '#45a862' });
          s += palm(r, 1500, 905, 470, -110, { trunk: '#8a6340', trunk2: '#7a5533', leaf: '#2f8a4a', leaf2: '#45a862' });
          return s;
        }),
        // mer qui scintille, voilier, mouettes, écume des vagues, crabe
        twinkles(t, 'tw', 12, [380, 610, 1500, 740], '#ffffff'),
        t.el('boat', { position: 'absolute', left: em(560), top: em(500), width: em(72), height: em(78), '--x1': em(320), animation: 'fhs-move 60s ease-in-out infinite alternate' }, E('div', { style: t.img(spr('boat'), { inset: 0, transformOrigin: '50% 90%', '--a': '3deg', animation: 'fhs-rock 3.6s ease-in-out infinite' }) })),
        t.still(`<image href="${spr('boat').slice(5, -2)}" x="560" y="500" width="72" height="78"/>`),
        ...drift(t, 'gl', t.n('gl', 3, (r, i) => ({ x: -100, y: rr(r, 240, 420), w: rr(r, 50, 70), h: rr(r, 22, 30), x1: 1900, y1: rr(r, -80, 80), dur: rr(r, 26, 38), dl: -i * 11, flap: rr(r, 0.7, 1), f: 0.3, img: spr('gull') }))),
        ...[0, 1].map((i) => t.el('wv' + i, { position: 'absolute', left: 0, top: em(i ? 742 : 752), width: em(3200), height: em(i ? 40 : 34), backgroundImage: spr('foam', i ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)'), backgroundSize: '50% 100%', backgroundRepeat: 'repeat-x', '--sx': em(-800), animation: `fhs-scroll ${i ? 14 : 9}s linear infinite` })),
        t.el('crab', { position: 'absolute', left: em(640), top: em(838), width: em(60), height: em(40), '--x1': em(220), animation: 'fhs-move 9s ease-in-out infinite alternate' }, E('div', { style: t.img(spr('crab'), { inset: 0, '--by': em(-3), animation: 'fhs-bob .35s ease-in-out infinite' }) })),
      ];
    },
  });

  // ---------------- SAINT-VALENTIN : crépuscule rose, arbre-cœur, ballons, pétales ----------------
  def('valentine', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const E = t.E;
      const heartPath = (x, y, s) => `M${N(x)} ${N(y + s * 0.9)}C${N(x - s * 1.2)} ${N(y + s * 0.2)} ${N(x - s * 1.1)} ${N(y - s * 0.75)} ${N(x - s * 0.5)} ${N(y - s * 0.8)}C${N(x - s * 0.15)} ${N(y - s * 0.82)} ${N(x)} ${N(y - s * 0.55)} ${N(x)} ${N(y - s * 0.4)}C${N(x)} ${N(y - s * 0.55)} ${N(x + s * 0.15)} ${N(y - s * 0.82)} ${N(x + s * 0.5)} ${N(y - s * 0.8)}C${N(x + s * 1.1)} ${N(y - s * 0.75)} ${N(x + s * 1.2)} ${N(y + s * 0.2)} ${N(x)} ${N(y + s * 0.9)}Z`;
      return [
        t.art('sky', (p) => {
          const r = t.r('sk');
          let s = sky(p + 's', [[0, o.bg2], [0.5, o.bg1], [0.75, o.bg3]]) + glow(p + 'sun', 800, 690, 520, '#ffd1a8', 0.6) + circ(800, 690, 90, '#ffe3c6', ' opacity=".9"');
          for (let i = 0; i < 7; i++) s += ell(rr(r, -100, 1600), rr(r, 140, 480), rr(r, 150, 320), rr(r, 10, 22), '#ffc2d6', ` opacity="${N(rr(r, 0.15, 0.35))}"`);
          return s + starsSvg(r, 50, { y1: 260, c: '#ffe3f0' });
        }),
        ...t.n('bk', 14, (r, i) => { const z = rr(r, 30, 80), c = pick(r, ['255,180,210', '255,220,170', '255,140,190']); return t.el('bk' + i, { position: 'absolute', left: em(rr(r, 0, 1600)), top: em(rr(r, 60, 560)), width: em(z), height: em(z), borderRadius: '50%', background: `radial-gradient(closest-side, rgba(${c},.55), rgba(${c},.2) 70%, rgba(${c},0))`, '--o0': 0.15, '--o1': 0.8, animation: `fhs-tw ${N(rr(r, 3, 7))}s ease-in-out ${N(-r() * 6)}s infinite` }); }),
        t.art('land', (p) => {
          const r = t.r('la');
          let s = hill(r, { y: 700, amp: 80, n: 14 }, '#8e2a55') + hill(r, { y: 760, amp: 60, n: 12 }, '#6a1a40');
          // arbre au feuillage en cœur, sur la colline
          s += path('M190 830Q186 730 182 660Q174 626 148 610M184 690Q208 656 236 646', 'none', ' stroke="#3a0d22" stroke-width="14" stroke-linecap="round"') + path(heartPath(190, 540, 135), '#e83f78') + path(heartPath(176, 526, 95), '#ff5d8f', ' opacity=".7"');
          for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 95; s += path(heartPath(190 + Math.cos(a) * d * 1.05, 540 + Math.sin(a) * d * 0.8, rr(r, 7, 12)), pick(r, ['#ff8fb3', '#c2185b', '#ffb3cc'])); }
          // réverbère et banc
          s += glow(p + 'lamp', 1330, 560, 170, '#ffd9a0', 0.55) + rect(1325, 570, 10, 230, '#2a0a1a') + path('M1312 572L1348 572L1342 548L1318 548Z', '#2a0a1a') + rect(1318, 552, 24, 18, '#ffe3b0') + rect(1300, 796, 60, 10, '#2a0a1a');
          s += rect(1150, 760, 150, 10, '#2a0a1a') + rect(1150, 736, 150, 8, '#2a0a1a') + rect(1160, 770, 8, 30, '#2a0a1a') + rect(1282, 770, 8, 30, '#2a0a1a');
          s += hill(r, { y: 830, amp: 40, n: 12 }, '#3d0c26') + rect(-10, 860, 1620, 50, '#3d0c26');
          // buissons de roses
          for (let i = 0; i < 9; i++) { const x = [80, 160, 470, 560, 1000, 1080, 1420, 1500, 1570][i], y = rr(r, 850, 870); s += ell(x, y, 60, 34, '#2c0a1d'); for (let k = 0; k < 7; k++) s += circ(x + rr(r, -45, 45), y + rr(r, -22, 10), rr(r, 5, 8), pick(r, ['#e0245e', '#ff4d7d', '#ff7aa2'])); }
          return s;
        }),
        ...drift(t, 'hb', t.n('hb', 8, (r, i) => ({ x: rr(r, 40, 1500), y: 900, w: rr(r, 36, 52), h: rr(r, 80, 115), y1: -1080, x1: rr(r, -100, 100), dur: rr(r, 18, 28), dl: -i * 3.2 - r() * 2, sw: 2, sr: 6, swd: 4, img: spr('hballoon', pick(r, ['#ff3d7f', '#ff7aa2', '#e0245e', '#ffffff']), '#b8184c') }))),
        ...drift(t, 'pt', t.n('pt', 12, (r) => ({ x: rr(r, 0, 1600), y: -40, w: rr(r, 14, 20), y1: 980, x1: rr(r, -200, 200), r1: rr(r, -500, 500), dur: rr(r, 11, 18), dl: -r() * 18, sw: 4, sr: 25, swd: 3.2, img: spr('rose', pick(r, ['#e0245e', '#ff4d7d', '#c2185b'])) }))),
        ...drift(t, 'hu', t.n('hu', 6, (r) => ({ x: rr(r, 100, 1500), y: 860, w: rr(r, 16, 26), y1: -700, x1: rr(r, -60, 60), dur: rr(r, 10, 16), dl: -r() * 16, sw: 2, swd: 3, fade: true, op: 0.85, img: spr('heart', '#ffd1e0', '#ffffff') }))),
        t.still(path(heartPath(1450, 300, 30), '#ff3d7f') + path(heartPath(1380, 360, 22), '#ff7aa2')),
      ];
    },
  });

  // texte écrit à la craie / à la main (police chargée par la page), placé en unités du dessin
  function scribble(t, key, list, font) {
    if (t.preview) return [];
    // (la position est donnée au conteneur : un « em » dépend de la taille de police de l'élément lui-même)
    return list.map(([txt, x, y, size, rot, c, op], i) => t.E('div', { key: key + i, style: { position: 'absolute', left: em(x), top: em(y), transform: `rotate(${rot || 0}deg)`, transformOrigin: '0 50%' } },
      t.E('div', { style: { fontFamily: font || "'Caveat', cursive", fontWeight: 600, fontSize: (size / 10) + 'em', lineHeight: 1, whiteSpace: 'nowrap', color: c, opacity: op == null ? 0.6 : op } }, txt)));
  }
  Object.assign(SP, {
    jelly: (c) => svg('0 0 60 110', path('M6 40C6 14 54 14 54 40C54 46 50 44 47 48C44 44 40 47 37 50C34 46 30 48 27 50C24 46 20 47 17 50C14 46 10 48 6 44Z', c, ' opacity=".75"') + ell(22, 28, 7, 5, 'rgba(255,255,255,.45)') + line('M14 50Q10 70 16 90Q20 100 14 108M24 52Q22 74 28 92M34 52Q38 72 32 94M44 50Q50 70 44 90Q40 100 46 108', c, 2.2, ' opacity=".6"')),
    weed: (c, d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 300" preserveAspectRatio="none">${path('M30 300C10 240 46 200 26 150C10 110 40 70 30 0C44 60 24 104 40 150C58 204 22 240 38 300Z', c)}${path('M30 300C20 250 40 210 30 160', 'none', ` stroke="${d}" stroke-width="3" opacity=".6"`)}${[60, 110, 170, 220].map((y, i) => path(`M${i % 2 ? 36 : 26} ${y}Q${i % 2 ? 58 : 2} ${y - 22} ${i % 2 ? 50 : 8} ${y - 46}Q${i % 2 ? 44 : 18} ${y - 20} ${i % 2 ? 36 : 26} ${y}Z`, c)).join('')}</svg>`,
    beam: (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 400" preserveAspectRatio="none"><defs>${lg('b', [[0, c, 0], [0.4, c, 0.18], [1, c, 0.7]])}</defs>${path('M0 0L100 0L56 400L44 400Z', 'url(#b)')}</svg>`,
    arm: (c) => svg('0 0 30 90', path('M10 90L12 40Q12 26 8 14L6 6Q8 0 13 3L16 12L17 2Q21 -1 22 4L21 14L25 6Q29 5 28 10L24 22Q22 34 20 44L22 90Z', c)),
  });

  // ---------------- RENTRÉE : tableau noir encadré de bois, dessins et formules à la craie ----------------
  def('rentree', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const chalk = 'rgba(255,255,250,.62)', yel = 'rgba(255,236,140,.7)', pink = 'rgba(255,170,200,.65)', blue = 'rgba(160,215,255,.62)';
      const ch = (d, c, w) => line(d, c || chalk, w || 3.4, ' opacity=".95"');
      return [
        t.art('board', (p) => {
          const r = t.r('bo');
          let s = `<defs>${rg(p + 'b', [[0, o.bg3], [0.6, o.bg1], [1, o.bg2]], 0.5, 0.45, 0.75)}</defs>` + rect(0, 0, W, H, `url(#${p}b)`);
          // traces d'effaçage
          for (let i = 0; i < 26; i++) s += ell(rr(r, 60, 1540), rr(r, 60, 820), rr(r, 80, 260), rr(r, 30, 90), '#ffffff', ` opacity="${N(rr(r, 0.015, 0.045))}" transform="rotate(${N(rr(r, -20, 20))})"`);
          for (let i = 0; i < 8; i++) { const y = rr(r, 100, 780), x = rr(r, 80, 1300); s += path(`M${N(x)} ${N(y)}C${N(x + 120)} ${N(y - 40)} ${N(x + 240)} ${N(y + 40)} ${N(x + 360)} ${N(y)}`, 'none', ` stroke="#ffffff" stroke-width="${N(rr(r, 30, 60))}" opacity="${N(rr(r, 0.02, 0.04))}" stroke-linecap="round"`); }
          // dessins à la craie
          s += circ(210, 170, 42, 'none', ` stroke="${yel}" stroke-width="3.6"`) + Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return ch(`M${N(210 + Math.cos(a) * 54)} ${N(170 + Math.sin(a) * 54)}L${N(210 + Math.cos(a) * 76)} ${N(170 + Math.sin(a) * 76)}`, yel, 3.4); }).join('') + circ(196, 160, 3.5, yel) + circ(224, 160, 3.5, yel) + ch('M194 182Q210 196 226 182', yel);
          s += ch('M120 560L120 470L190 420L260 470L260 560Z') + ch('M120 470L260 470') + ch('M170 560V510H210V560') + ch('M140 490H165V512H140Z') + ch('M300 560V500') + circ(300, 480, 30, 'none', ` stroke="${chalk}" stroke-width="3.4"`) + ch('M80 562H340');
          s += ch('M1310 190L1440 190L1310 100Z', blue) + ch('M1310 172H1328V190', blue, 2.6) + ch('M1408 190Q1400 176 1412 168', blue, 2.6);
          s += ch('M1250 560V380M1240 548H1460', chalk, 3) + ch('M1260 400Q1330 600 1440 400', pink, 3.6) + ch('M1250 380L1244 392M1250 380L1256 392M1460 548L1448 542M1460 548L1448 554', chalk, 3);
          s += ch('M140 760Q150 700 150 680M150 680C130 660 132 636 150 632C168 636 170 660 150 680M150 680C126 690 112 676 120 662M150 680C174 690 188 676 180 662', pink) + ch('M150 760Q160 730 176 726', chalk);
          s += [[460, 120], [1100, 110], [1500, 300], [560, 300]].map(([x, y]) => ch(`M${x} ${y - 16}L${x + 5} ${y - 4}L${x + 18} ${y - 4}L${x + 8} ${y + 4}L${x + 12} ${y + 17}L${x} ${y + 9}L${x - 12} ${y + 17}L${x - 8} ${y + 4}L${x - 18} ${y - 4}L${x - 5} ${y - 4}Z`, yel, 2.6)).join('');
          s += ell(1480, 690, 46, 18, 'none', ` stroke="${blue}" stroke-width="3"`) + ell(1480, 690, 46, 18, 'none', ` stroke="${blue}" stroke-width="3" transform="rotate(60 1480 690)"`) + ell(1480, 690, 46, 18, 'none', ` stroke="${blue}" stroke-width="3" transform="rotate(120 1480 690)"`) + circ(1480, 690, 6, blue);
          s += ch('M1150 700l60 -24l-8 14l30 2l-30 10l8 14z', yel, 2.6);
          // cadre en bois et rebord avec craies et brosse
          s += `<defs>${lg(p + 'w', [[0, '#a8743f'], [0.5, '#8a5a30'], [1, '#6e4524']])}${lg(p + 'w2', [[0, '#9a6a3a'], [1, '#5e3a1d']], 1, 0)}</defs>`;
          s += path(`M0 0H${W}V${H}H0Z M28 28V842H${W - 28}V28Z`, `url(#${p}w)`, ' fill-rule="evenodd"') + path(`M28 28H${W - 28}V842H28Z`, 'none', ' stroke="rgba(0,0,0,.35)" stroke-width="6"');
          for (let i = 0; i < 10; i++) { const y = rr(r, 4, 24); s += line(`M${N(rr(r, 0, 300))} ${N(y)}H${N(rr(r, 600, 1600))}`, 'rgba(60,30,10,.25)', 1.2); }
          s += rect(0, 836, W, 64, `url(#${p}w2)`) + rect(0, 836, W, 8, '#b98552') + rect(0, 890, W, 10, '#4a2d16');
          s += rect(380, 848, 110, 30, '#3a3a46', ' rx="5"') + rect(380, 840, 110, 14, '#b98552', ' rx="4"') + [0, 1, 2, 3, 4].map((k) => rect(386 + k * 21, 856, 16, 20, '#4a4a58', ' rx="3"')).join('');
          [[620, '#fbfbf5', 0], [700, '#ffe680', -6], [770, '#ffb3cc', 4], [1180, '#a8d8ff', -3], [1250, '#fbfbf5', 8]].forEach(([x, c, rot]) => { s += rect(x, 856, 64, 14, c, ` rx="7" transform="rotate(${rot} ${x + 32} 863)"`); });
          for (let i = 0; i < 60; i++) s += circ(rr(r, 360, 1300), rr(r, 850, 880), rr(r, 0.8, 2), '#ffffff', ` opacity="${N(rr(r, 0.2, 0.5))}"`);
          return s;
        }),
        ...scribble(t, 'tx', [['A b c', 380, 640, 64, -4, '#fffff6', 0.6], ['2 + 3 = 5', 990, 620, 54, 3, '#fffff6', 0.58], ['π ≈ 3,14', 1200, 230, 46, -3, '#ffec8c', 0.62], ['H₂O', 440, 170, 48, 4, '#a0d7ff', 0.6], ['a² + b² = c²', 640, 740, 46, -2, '#fffff6', 0.55], ['Leçon n°1', 960, 730, 54, -3, '#ffb3cc', 0.62]]),
        t.still('<g font-family="cursive" font-weight="600" fill="#fffff6" opacity=".55"><text x="380" y="690" font-size="64">A b c</text><text x="990" y="670" font-size="54">2 + 3 = 5</text><text x="960" y="780" font-size="54" fill="#ffb3cc">Leçon n°1</text></g>'),
        twinkles(t, 'tw', 6, [420, 90, 1520, 320], 'rgba(255,236,140,.9)'),
        t.el('light', { position: 'absolute', left: em(-600), top: 0, width: em(500), height: '100%', background: 'linear-gradient(100deg, rgba(255,255,240,0), rgba(255,255,240,.07) 40%, rgba(255,255,240,.09) 50%, rgba(255,255,240,0))', '--x1': em(2400), animation: 'fhs-move 24s ease-in-out infinite' }),
        ...drift(t, 'du', t.n('du', 16, (r) => ({ x: rr(r, 100, 1500), y: rr(r, 600, 860), w: rr(r, 4, 8), x1: rr(r, -120, 120), y1: -rr(r, 200, 500), dur: rr(r, 12, 22), dl: -r() * 22, fade: true, op: rr(r, 0.3, 0.6), img: spr('dot', '#ffffff') }))),
      ];
    },
  });

  // ---------------- POISSON D'AVRIL : fond marin, coraux, algues, bancs de poissons et poisson en papier ----------------
  def('april', {
    base: (o) => o.bg1,
    layers: (t, o) => {
      const E = t.E, fc = [['#ffb703', '#fb8500'], ['#4cc9f0', '#3a86ff'], ['#ff6fb5', '#c9184a'], ['#90e0ef', '#00b4d8'], ['#ffd166', '#ef476f'], ['#b8f2a6', '#2a9d8f']];
      return [
        t.art('water', (p) => {
          const r = t.r('wa');
          let s = sky(p + 's', [[0, o.bg2], [0.45, o.bg1], [1, o.bg3]]);
          for (let i = 0; i < 18; i++) { const y = rr(r, 6, 120), x = rr(r, -100, 1600); s += path(`M${N(x)} ${N(y)}q30 -12 60 0t60 0t60 0`, 'none', ` stroke="#ffffff" stroke-width="${N(rr(r, 2, 5))}" opacity="${N(rr(r, 0.08, 0.2))}" stroke-linecap="round"`); }
          return s;
        }),
        ...[[250, 0.16, 9], [700, 0.12, 12], [1150, 0.15, 10], [1450, 0.1, 14]].map(([x, op, d], i) => t.el('ray' + i, { position: 'absolute', left: em(x - 120), top: em(-40), width: em(240), height: em(760), background: 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0))', clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)', transformOrigin: '50% 0', transform: `rotate(${(i % 2 ? -1 : 1) * 12}deg)`, opacity: op, '--o0': op * 0.3, '--o1': op, animation: `fhs-tw ${d}s ease-in-out ${-i * 3}s infinite` })),
        t.still([250, 700, 1150].map((x) => path(`M${x - 40} 0L${x + 40} 0L${x + 120} 760L${x - 120} 760Z`, '#ffffff', ' opacity=".07"')).join('')),
        t.el('jelly', { position: 'absolute', left: em(1180), top: em(160), width: em(60), height: em(110), '--by': em(-50), '--bx': em(-30), animation: 'fhs-bob 9s ease-in-out infinite' }, E('div', { style: t.img(spr('jelly', '#ff9fd2'), { inset: 0, transformOrigin: '50% 30%', '--f': 0.85, animation: 'fhs-flap 2.4s ease-in-out infinite' }) })),
        ...drift(t, 'sch', t.n('sch', 3, (r, i) => ({ x: i === 1 ? 1700 : -260, y: [220, 360, 520][i], w: 240, h: 110, x1: i === 1 ? -2000 : 2000, y1: rr(r, -40, 40), dur: rr(r, 30, 42), dl: -i * 12, flip: i !== 1, img: cached('school' + i, () => { const c = fc[i * 2 % fc.length]; return svg('0 0 240 110', [[20, 20], [70, 6], [60, 50], [120, 30], [110, 76], [170, 14], [170, 60], [200, 92]].map(([x, y]) => `<image href="${spr('fish', c[0], c[1]).slice(5, -2)}" x="${x}" y="${y}" width="38" height="22"/>`).join('')); }) }))),
        ...drift(t, 'fi', t.n('fi', 4, (r, i) => { const c = fc[(i + 1) % fc.length], rev = i % 2 === 0; return { x: rev ? 1700 : -140, y: rr(r, 240, 640), w: rr(r, 64, 90), h: rr(r, 36, 50), x1: rev ? -2000 : 2000, y1: rr(r, -60, 60), dur: rr(r, 20, 30), dl: -i * 7 - r() * 5, flip: !rev, sw: 0, img: spr('fish', c[0], c[1]) }; })),
        // le poisson d'avril en papier, qui se dandine
        t.el('pf', { position: 'absolute', left: em(-200), top: em(300), width: em(150), height: em(88), '--x1': em(2000), '--y1': em(80), animation: 'fhs-move 34s linear -10s infinite' }, E('div', { style: t.img(spr('pfish', '#ffe066', '#ff8fab'), { inset: 0, transform: 'scaleX(-1)', '--a': '6deg', animation: 'fhs-rock 1.8s ease-in-out infinite' }) })),
        t.still(`<image href="${spr('pfish', '#ffe066', '#ff8fab').slice(5, -2)}" x="1150" y="420" width="150" height="88"/>`),
        t.art('reef', (p) => {
          const r = t.r('re');
          let s = hill(r, { y: 760, amp: 70, n: 14 }, '#0b3d63', ' opacity=".9"');
          for (let i = 0; i < 16; i++) s += ell(rr(r, -20, 1620), rr(r, 740, 790), rr(r, 40, 90), rr(r, 24, 50), pick(r, ['#0e4a73', '#10507c', '#0a3a5e']));
          s += `<defs>${lg(p + 'sa', [[0, '#e9d3a2'], [1, '#c9a76a']])}</defs>` + hill(r, { y: 832, amp: 34, n: 12 }, `url(#${p}sa)`);
          // coraux branchus, cerveaux, éventails
          const branch = (x, y, h, c) => { let q = ''; const rec = (x0, y0, a, l, d) => { if (d > 4 || l < 8) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; q += line(`M${N(x0)} ${N(y0)}L${N(x1)} ${N(y1)}`, c, N(10 - d * 1.8)); rec(x1, y1, a - 0.45 - r() * 0.2, l * 0.74, d + 1); rec(x1, y1, a + 0.45 + r() * 0.2, l * 0.74, d + 1); }; rec(x, y, -Math.PI / 2, h * 0.36, 0); return q; };
          [[200, 840, 220, '#ff7b54'], [330, 850, 160, '#ff9fd2'], [1260, 842, 200, '#ffb347'], [1420, 850, 240, '#ff6f91']].forEach(([x, y, h, c]) => { s += branch(x, y, h, c); });
          [[470, 850, 46, '#a06cd5'], [1110, 846, 40, '#7bdff2'], [90, 856, 36, '#f4a261']].forEach(([x, y, R, c]) => { s += ell(x, y, R, R * 0.7, c) + Array.from({ length: 5 }, (_, k) => path(`M${N(x - R * 0.8)} ${N(y - R * 0.4 + k * R * 0.22)}q${N(R * 0.4)} -8 ${N(R * 0.8)} 0t${N(R * 0.8)} 0`, 'none', ' stroke="rgba(0,0,0,.18)" stroke-width="2.4"')).join(''); });
          s += path('M560 850C540 760 600 720 640 700C660 760 620 800 600 850Z', '#e63946', ' opacity=".9"') + Array.from({ length: 6 }, (_, k) => line(`M600 850L${560 + k * 16} ${720 + Math.abs(k - 2.5) * 10}`, '#b5172f', 2)).join('');
          // anémone et poisson-clown
          s += Array.from({ length: 14 }, (_, k) => path(`M${980 + k * 6} 850Q${970 + k * 7} 800 ${985 + k * 6} ${780 + (k % 3) * 6}`, 'none', ' stroke="#c77dff" stroke-width="6" stroke-linecap="round"')).join('') + `<image href="${spr('fish', '#ff8c42', '#ffffff').slice(5, -2)}" x="1000" y="770" width="54" height="30"/>`;
          for (let i = 0; i < 40; i++) s += circ(rr(r, -10, 1610), rr(r, 850, 900), rr(r, 1.2, 3), pick(r, ['#fff1d0', '#d4b27a', '#f6d7c3']));
          s += path('M760 880l7 -17l7 17l18 1l-14 11l5 18l-16 -10l-16 10l5 -18l-14 -11Z', '#ff7b54') + path('M860 884q10 -16 20 0q-10 6 -20 0Z', '#ffe0d0');
          return s;
        }),
        ...[[60, 300], [140, 360], [720, 220], [880, 260], [1340, 330], [1520, 380]].map(([x, h], i) => t.el('wd' + i, t.img(spr('weed', i % 2 ? '#2a9d8f' : '#3fb37f', '#1d6b5a'), { left: em(x - 25), top: em(870 - h), width: em(50), height: em(h), transformOrigin: '50% 100%', '--a': `${4 + (i % 3)}deg`, animation: `fhs-rock ${N(4 + (i % 3) * 0.9)}s ease-in-out ${-i * 0.7}s infinite` }))),
        t.still([[60, 300], [720, 220], [1340, 330]].map(([x, h], i) => `<image href="${spr('weed', i % 2 ? '#2a9d8f' : '#3fb37f', '#1d6b5a').slice(5, -2)}" x="${x - 25}" y="${870 - h}" width="50" height="${h}" preserveAspectRatio="none"/>`).join('')),
        ...drift(t, 'bu', t.n('bu', 16, (r) => ({ x: rr(r, 40, 1560), y: 880, w: rr(r, 8, 20), y1: -960, x1: rr(r, -50, 50), dur: rr(r, 8, 15), dl: -r() * 15, sw: 1.5, swd: 2.5, img: spr('bubble') }))),
      ];
    },
  });

  // ---------------- FÊTE DE LA MUSIQUE : scène de concert, faisceaux lumineux, foule, notes ----------------
  def('music', {
    base: (o) => o.bg2,
    layers: (t, o) => {
      const E = t.E, lc = ['#f72585', '#4cc9f0', '#ffd166', '#7cff6b', '#b5179e'];
      return [
        t.art('sky', (p) => sky(p + 's', [[0, o.bg2], [0.55, o.bg1], [0.8, '#5a1a7a']]) + starsSvg(t.r('st'), 80, { y1: 380 }) + glow(p + 'h1', 400, 640, 500, '#f72585', 0.3) + glow(p + 'h2', 1200, 640, 500, '#4cc9f0', 0.25)),
        // faisceaux des projecteurs qui balaient le ciel
        ...[[250, 245, '#4cc9f0', 48, 6], [250, 245, '#f72585', 24, 8], [1350, 245, '#ffd166', -48, 7], [1350, 245, '#7cff6b', -24, 9]].map(([x, y, c, a, d], i) => t.el('bm' + i, { position: 'absolute', left: em(x - 110), top: em(y - 760), width: em(220), height: em(760), transformOrigin: '50% 100%', transform: `rotate(${a}deg)` },
          E('div', { style: t.img(spr('beam', c), { inset: 0, transformOrigin: '50% 100%', '--a': '15deg', animation: `fhs-rock ${d}s ease-in-out ${-i * 1.7}s infinite` }) }))),
        t.still([[250, 48, '#4cc9f0'], [1350, -48, '#ffd166']].map(([x, a, c]) => `<g transform="rotate(${a} ${x} 245)"><image href="${spr('beam', c).slice(5, -2)}" x="${x - 110}" y="-515" width="220" height="760" preserveAspectRatio="none"/></g>`).join('')),
        t.art('stage', (p) => {
          const r = t.r('st2');
          let s = '';
          // pylônes en treillis
          const truss = (x) => { let q = rect(x - 22, 230, 44, 520, 'none', ' stroke="#2a2340" stroke-width="5"'); for (let y = 230; y < 740; y += 30) q += line(`M${x - 22} ${y}L${x + 22} ${y + 30}M${x + 22} ${y}L${x - 22} ${y + 30}`, '#2a2340', 3); return q + rect(x - 60, 220, 120, 22, '#2a2340') + [-40, 0, 40].map((d) => rect(x + d - 12, 242, 24, 28, '#1a1528', ' rx="4"') + circ(x + d, 266, 9, '#fff3c4')).join(''); };
          s += truss(250) + truss(1350);
          // enceintes
          const spk = (x, y, w, h) => rect(x, y, w, h, '#15111f', ' rx="6"') + circ(x + w / 2, y + h * 0.32, w * 0.22, '#2b2440') + circ(x + w / 2, y + h * 0.32, w * 0.09, '#0b0912') + circ(x + w / 2, y + h * 0.74, w * 0.3, '#2b2440') + circ(x + w / 2, y + h * 0.74, w * 0.12, '#0b0912');
          s += spk(60, 560, 120, 190) + spk(80, 430, 100, 130) + spk(1420, 560, 120, 190) + spk(1420, 430, 100, 130);
          // plateau, rampe de lumières
          s += rect(150, 740, 1300, 40, '#1d1730') + rect(150, 736, 1300, 6, '#3a2f5c');
          s += rect(330, 744, 940, 30, '#0d0a18', ' rx="4"');
          for (let i = 0; i < 4; i++) { const x = [200, 260, 1340, 1400][i], c = lc[i]; s += circ(x, 760, 9, c) + glow(p + 'rl' + i, x, 760, 34, c, 0.6); }
          return s;
        }),
        // égaliseur lumineux devant la scène
        t.el('eq', { position: 'absolute', left: em(340), top: em(746), width: em(920), height: em(26), display: 'flex', alignItems: 'flex-end', gap: em(4), opacity: 0.9 },
          t.preview ? null : t.n('eqb', 40, (r) => ({ d: rr(r, 0.45, 1.2), dl: -r() })).map((b, i) => E('div', { key: i, style: { flex: 1, height: '100%', transformOrigin: '50% 100%', borderRadius: '3px 3px 0 0', background: `linear-gradient(180deg, ${lc[i % lc.length]}, #7209b7)`, '--f': 0.2, animation: `fhs-flap ${N(b.d)}s ease-in-out ${N(b.dl)}s infinite` } }))),
        ...t.n('bl', 6, (r, i) => t.el('bl' + i, { position: 'absolute', left: em([210, 250, 290, 1310, 1350, 1390][i] - 22), top: em(244), width: em(44), height: em(44), borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,250,210,.95), rgba(255,250,210,0))', '--o0': 0.25, animation: `fhs-tw ${N(rr(r, 0.6, 1.4))}s ease-in-out ${N(-r())}s infinite` })),
        t.art('crowd', (p) => {
          const r = t.r('cr');
          let s = '';
          for (let i = 0; i < 46; i++) { const x = rr(r, -20, 1620), y = rr(r, 800, 860), k = rr(r, 0.85, 1.25); s += ell(x, y + 60 * k, 44 * k, 60 * k, '#0b0814') + circ(x, y, 22 * k, '#0b0814'); }
          s += rect(-10, 870, 1620, 40, '#0b0814');
          return s;
        }),
        ...t.n('arm', 9, (r, i) => { const x = rr(r, 60, 1540); return t.el('ar' + i, t.img(spr('arm', '#0b0814'), { left: em(x), top: em(rr(r, 700, 760)), width: em(30), height: em(110), transformOrigin: '50% 100%', '--a': `${N(rr(r, 8, 16))}deg`, animation: `fhs-rock ${N(rr(r, 0.9, 1.6))}s ease-in-out ${N(-r() * 2)}s infinite` })); }),
        ...drift(t, 'nt', t.n('nt', 12, (r) => { const c = pick(r, lc); return { x: rr(r, 80, 1520), y: 760, w: rr(r, 26, 40), h: rr(r, 36, 52), y1: -720, x1: rr(r, -80, 80), r1: rr(r, -40, 40), dur: rr(r, 9, 15), dl: -r() * 15, sw: 2.5, sr: 10, swd: 2.6, fade: true, op: 0.9, img: spr(r() < 0.5 ? 'note1' : 'note2', c) }; })),
      ];
    },
  });

  // ---------- fin des décors ----------

  // rendu React d'un décor, cadré « cover » et ancré en bas (mis en cache : même arbre tant que rien ne change)
  const RENDERED = new Map();
  function render(id, E, o, env) {
    injectCss();
    const sc = SC[id] || SC.winter;
    const vw = Math.max(1, env.vw), vh = Math.max(1, env.vh), sw = Math.round(Math.max(vw, vh * 16 / 9)), sh = Math.round(sw * 9 / 16);
    const key = [id, o.bg1, o.bg2, o.bg3, sw].join('|');
    let el = RENDERED.get(key);
    if (!el) {
      const t = tools(E, id, o, 'render');
      el = E('div', { key: 'stage-' + id, style: { position: 'absolute', left: '50%', bottom: 0, width: sw, height: sh, marginLeft: -sw / 2, fontSize: sw / 160 + 'px', overflow: 'hidden', pointerEvents: 'none' } }, sc.layers(t, o).filter(Boolean));
      if (RENDERED.size > 12) RENDERED.clear();
      RENDERED.set(key, el);
    }
    return el;
  }
  // aperçu pour les cartes de thèmes : tous les dessins fixes (+ quelques éléments figés) dans une seule image
  function preview(id, o) {
    const sc = SC[id] || SC.winter;
    return cached('pv|' + id + '|' + [o.bg1, o.bg2, o.bg3].join(','), () => { const t = tools(null, id, o, 'preview'); sc.layers(t, o); return svg(`0 0 ${W} ${H}`, t.bodies.join('')); });
  }
  const base = (id, o) => (SC[id] && SC[id].base ? SC[id].base(o) : o.bg2 || '#0b0a09');

  window.FHScenes = { ids, has: (id) => !!SC[id], render, preview, base, _: { W, H, N, P, em, prng, seedOf, pick, rr, svg, cached, lg, rg, rect, circ, ell, path, line, sky, glow, profile, smooth, hill, mountains, pine, leafy, cloud, starsSvg, moonSvg, skyline, grass, flower, tulip, spr, drift, def, SC } };
})();
