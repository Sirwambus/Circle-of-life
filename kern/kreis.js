/* =====================================================================
   DER KREIS DER SPIELE – die Karte, in zwei Ebenen.
   Übersicht: alle Spiele als Lichtstrahlen in sechs farbigen Sektoren. Je weiter ein Strahl leuchtet,
   desto mehr Level sind gemeistert. In der Mitte das Fähigkeitsprofil.
   Kategorie-Mandala: Eine Kategorie zoomt zu einem eigenen Kreis auf. Jedes ihrer Spiele ist eine Speiche,
   innen Level 1, außen das letzte Level.
   makeKreis(canvas, { cats, games, progress, levels, onSelect, onCategory, onPlay })
   ===================================================================== */
function makeKreis(canvas, opt) {
  const LV = opt.levels, S = 720, C = S / 2, cx = canvas.getContext('2d');
  const HUB = 74, CAT_R = 344;
  const { cats, games } = opt;
  const N = games.length, GAP = 1.2;
  // Übersicht: Winkel jeder Speiche, Lücke zwischen Kategorien
  const slot = Math.PI * 2 / (N + GAP * cats.length);
  const angAll = []; let k = 0;
  cats.forEach(cat => { k += GAP / 2; games.forEach((g, i) => { if (g.cat === cat.id) { angAll[i] = -Math.PI / 2 + (k + 0.5) * slot; k++; } }); k += GAP / 2; });
  const catArc = cats.map(cat => { const a = games.map((g, i) => g.cat === cat.id ? angAll[i] : null).filter(v => v !== null); return [Math.min(...a) - slot / 2, Math.max(...a) + slot / 2]; });
  const members = cats.map(cat => games.map((g, i) => g.cat === cat.id ? i : -1).filter(i => i >= 0));
  const catIndexOf = gi => cats.findIndex(c => c.id === games[gi].cat);
  // Kategorie-Mandala: Ringe und Winkel
  const RING = Array.from({ length: LV }, (_, l) => 98 + l * (238 - 98) / (LV - 1));
  const NAME_R = 254;
  const angCat = (ci, j) => -Math.PI / 2 + (j + 0.5) * Math.PI * 2 / members[ci].length;
  const posCat = (ci, j, l) => [C + Math.cos(angCat(ci, j)) * RING[l], C + Math.sin(angCat(ci, j)) * RING[l]];

  let mode = 'all', ci = 0, sel = { g: members[0][0], l: 0 }, zoom = 0, hover = null, t = 0, ignites = [], msg = '', msgT = 0;
  const stars = Array.from({ length: 140 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random() * 400, v: 8 + Math.random() * 30 }));
  const rep = makeRepeater(0.28, 0.12);
  const prog = gi => opt.progress[games[gi].id] || 0;
  const open = (gi, li) => prog(gi) >= li;
  const jOf = gi => members[catIndexOf(gi)].indexOf(gi);

  function select(g, l) { sel = { g, l: clamp(l, 0, LV - 1) }; ci = catIndexOf(g); if (mode === 'cat') opt.onSelect(sel.g, sel.l); }
  function enterCat(c) { ci = (c + cats.length) % cats.length; mode = 'cat'; if (catIndexOf(sel.g) !== ci) sel = { g: members[ci][0], l: Math.min(LV - 1, prog(members[ci][0])) }; opt.onSelect(sel.g, sel.l); }
  function toAll() { mode = 'all'; opt.onCategory(ci); }
  function tryPlay(g, l) {
    if (open(g, l)) opt.onPlay(g, l);
    else { msg = `Erst Level ${prog(g) + 1} von „${games[g].name}“ meistern`; msgT = 2; }
  }
  function point(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S, (e.clientY - r.top) / r.height * S]; }
  function hit(e) {
    const [x, y] = point(e), d = Math.hypot(x - C, y - C), a = Math.atan2(y - C, x - C);
    if (mode === 'all') {
      if (d < HUB || d > CAT_R + 10) return null;
      const c = catArc.findIndex(([a0, a1]) => { const m = (a0 + a1) / 2; return Math.abs(((a - m + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < (a1 - a0) / 2; });
      return c >= 0 ? { cat: c } : null;
    }
    if (d < HUB) return { hub: true };
    let best = null, bd = 12;
    members[ci].forEach((g, j) => { for (let l = 0; l < LV; l++) { const [px, py] = posCat(ci, j, l), dd = Math.hypot(px - x, py - y); if (dd < bd) { bd = dd; best = { g, l }; } } });
    if (!best && d < NAME_R + 80) { // Speiche oder Namensschild: Spiel wählen
      let bj = 0, ba = 9; members[ci].forEach((g, j) => { const da = Math.abs(((a - angCat(ci, j) + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (da < ba) { ba = da; bj = j; } });
      if (ba < Math.PI / members[ci].length) best = { g: members[ci][bj], l: Math.min(LV - 1, prog(members[ci][bj])), soft: true };
    }
    return best;
  }
  canvas.addEventListener('pointermove', e => { hover = hit(e); canvas.style.cursor = hover ? 'pointer' : 'default'; });
  canvas.addEventListener('pointerleave', () => { hover = null; });
  canvas.addEventListener('click', e => {
    const h = hit(e); if (!h) return;
    if (h.cat !== undefined) { if (mode === 'all' && ci === h.cat) enterCat(h.cat); else { ci = h.cat; opt.onCategory(ci); } return; }
    if (h.hub) return toAll();
    if (h.soft || sel.g !== h.g || sel.l !== h.l) select(h.g, h.l); else tryPlay(h.g, h.l);
  });

  function textOnArc(text, r, a0, a1, color, size, alpha = 1) {
    cx.save(); cx.globalAlpha = alpha; cx.font = `600 ${size}px "IBM Plex Mono", monospace`; cx.fillStyle = color; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    const mid = (a0 + a1) / 2, bottom = Math.sin(mid) > 0.2; // unten von links nach rechts lesbar
    const chars = [...text], step = (size * 0.78) / r, total = step * (chars.length - 1);
    chars.forEach((ch, i) => {
      const a = bottom ? mid + total / 2 - i * step : mid - total / 2 + i * step;
      cx.save(); cx.translate(C + Math.cos(a) * r, C + Math.sin(a) * r); cx.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2)); cx.fillText(ch, 0, 0); cx.restore();
    });
    cx.restore();
  }
  function background(hue) {
    const bg = cx.createRadialGradient(C, C, 20, C, C, 420);
    bg.addColorStop(0, `hsl(${hue + 260},55%,14%)`); bg.addColorStop(0.55, `hsl(${hue + 220},60%,7%)`); bg.addColorStop(1, '#030208');
    cx.fillStyle = bg; cx.fillRect(0, 0, S, S);
    cx.save(); cx.globalCompositeOperation = 'lighter';
    for (const s of stars) { const a = Math.min(1, s.r / 120) * 0.7; cx.fillStyle = `hsla(${hue + s.a * 60},90%,80%,${a})`; cx.fillRect(C + Math.cos(s.a) * s.r, C + Math.sin(s.a) * s.r, 1.6, 1.6); }
    cx.translate(C, C);
    for (let layer = 0; layer < 3; layer++) { // Kaleidoskop: zwölffach gespiegelte Blütenblätter
      const rr = 150 + layer * 90 + Math.sin(t * 0.4 + layer) * 18, rot = t * (layer % 2 ? -0.03 : 0.025) + layer;
      cx.strokeStyle = `hsla(${hue + layer * 70},90%,65%,0.07)`; cx.lineWidth = 1.2;
      for (let i = 0; i < 24; i++) {
        cx.save(); cx.rotate(rot + i * Math.PI / 12); cx.scale(1, i % 2 ? -1 : 1);
        cx.beginPath(); cx.moveTo(0, 0); cx.bezierCurveTo(rr * 0.3, rr * 0.25, rr * 0.7, -rr * 0.2, rr, 0); cx.bezierCurveTo(rr * 0.7, rr * 0.12, rr * 0.3, -rr * 0.05, 0, 0); cx.stroke();
        cx.restore();
      }
    }
    cx.restore();
    cx.save(); cx.lineWidth = 1;
    for (let i = 0; i < 9; i++) { cx.strokeStyle = `hsla(${hue + i * 30},80%,70%,${0.05 + 0.03 * Math.sin(t + i)})`; cx.setLineDash([2, 6 + i]); cx.lineDashOffset = t * (i % 2 ? 6 : -6); cx.beginPath(); cx.arc(C, C, 96 + i * 26 + Math.sin(t * 0.7 + i) * 3, 0, 7); cx.stroke(); }
    cx.restore();
  }
  function hubBase(hue) {
    cx.save(); cx.translate(C, C);
    const hubG = cx.createRadialGradient(0, 0, 4, 0, 0, HUB); hubG.addColorStop(0, `hsla(${hue + 300},70%,30%,0.92)`); hubG.addColorStop(1, 'rgba(10,5,25,0.92)');
    cx.fillStyle = hubG; cx.beginPath(); cx.arc(0, 0, HUB, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,0.12)'; cx.lineWidth = 1; cx.rotate(t * 0.05);
    for (let i = 0; i < 7; i++) { const a = i * Math.PI / 3, ox = i === 6 ? 0 : Math.cos(a) * 24, oy = i === 6 ? 0 : Math.sin(a) * 24; cx.beginPath(); cx.arc(ox, oy, 24, 0, 7); cx.stroke(); }
    cx.restore();
  }
  const fracOf = c => members[c].reduce((s, g) => s + prog(g), 0) / (members[c].length * LV);
  // Welches Schiffssystem die Kategorie trainiert (alle 10 Level eine Stufe)
  const shipOf = c => cats[c].ship ? `${cats[c].ship} · Stufe ${Math.floor(members[c].reduce((s, g) => s + prog(g), 0) / 10)}` : '';

  // Übersicht: alle Spiele als Strahlen
  function drawAll(alpha, scale) {
    cx.save(); cx.globalAlpha = alpha; cx.translate(C, C); cx.scale(scale, scale); cx.translate(-C, -C);
    cats.forEach((cat, c) => {
      const [a0, a1] = catArc[c], isSel = c === ci;
      const g = cx.createRadialGradient(C, C, HUB, C, C, CAT_R - 12);
      g.addColorStop(0, cat.color + '00'); g.addColorStop(0.5, cat.color + (isSel ? '30' : '16')); g.addColorStop(1, cat.color + '06');
      cx.fillStyle = g; cx.beginPath(); cx.arc(C, C, CAT_R - 12, a0, a1); cx.arc(C, C, HUB + 6, a1, a0, true); cx.closePath(); cx.fill();
      cx.strokeStyle = cat.color + (isSel ? 'cc' : '55'); cx.lineWidth = isSel ? 2 : 1; cx.beginPath(); cx.arc(C, C, CAT_R - 12, a0 + 0.01, a1 - 0.01); cx.stroke();
      textOnArc(cat.name.toUpperCase(), CAT_R, a0, a1, cat.color, isSel ? 13 : 11);
      if (cat.ship) textOnArc('TRAINIERT ' + shipOf(c).toUpperCase(), 316, a0, a1, '#ffffff', 9, isSel ? 0.85 : 0.5);
      for (const gi of members[c]) {
        const a = angAll[gi], p = prog(gi), r0 = HUB + 8, rMax = 300;
        cx.strokeStyle = 'rgba(255,255,255,0.09)'; cx.lineWidth = 1;
        cx.beginPath(); cx.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); cx.lineTo(C + Math.cos(a) * rMax, C + Math.sin(a) * rMax); cx.stroke();
        if (p > 0) {
          const r1 = r0 + (rMax - r0) * p / LV;
          cx.save(); cx.shadowColor = cat.color; cx.shadowBlur = 10; cx.strokeStyle = cat.color; cx.lineWidth = 2.2;
          cx.beginPath(); cx.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); cx.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); cx.stroke();
          cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(C + Math.cos(a) * r1, C + Math.sin(a) * r1, p === LV ? 3.2 : 2, 0, 7); cx.fill(); cx.restore();
        }
      }
    });
    hubBase((t * 4) % 360);
    cx.save(); cx.translate(C, C);
    const fr = cats.map((_, c) => fracOf(c));
    cx.beginPath(); cats.forEach((cat, c) => { const a = (catArc[c][0] + catArc[c][1]) / 2, r = 28 + fr[c] * (HUB - 36); cx[c ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }); cx.closePath();
    cx.save(); cx.shadowColor = '#ffffff'; cx.shadowBlur = 16; cx.fillStyle = 'rgba(255,255,255,0.16)'; cx.fill(); cx.strokeStyle = 'rgba(255,255,255,0.8)'; cx.lineWidth = 1.5; cx.stroke(); cx.restore();
    cats.forEach((cat, c) => { const a = (catArc[c][0] + catArc[c][1]) / 2, r = 28 + fr[c] * (HUB - 36); cx.fillStyle = cat.color; cx.beginPath(); cx.arc(Math.cos(a) * r, Math.sin(a) * r, 3.5, 0, 7); cx.fill(); });
    const total = games.reduce((s, g, i) => s + prog(i), 0), all = N * LV;
    cx.font = '600 15px "IBM Plex Mono", monospace'; cx.textAlign = 'center'; cx.fillStyle = '#ffffff'; cx.fillText(`${Math.round(total / all * 100)} %`, 0, 5);
    cx.font = '9px "IBM Plex Mono", monospace'; cx.fillStyle = 'rgba(255,255,255,0.6)'; cx.fillText(`${total} / ${all}`, 0, 19);
    cx.restore();
    cx.restore();
  }
  // Kategorie-Mandala
  function drawCat(alpha, scale) {
    const cat = cats[ci], list = members[ci];
    cx.save(); cx.globalAlpha = alpha; cx.translate(C, C); cx.scale(scale, scale); cx.translate(-C, -C);
    const g = cx.createRadialGradient(C, C, HUB, C, C, 330); g.addColorStop(0, cat.color + '00'); g.addColorStop(0.6, cat.color + '14'); g.addColorStop(1, cat.color + '00');
    cx.fillStyle = g; cx.beginPath(); cx.arc(C, C, 330, 0, 7); cx.fill();
    cx.strokeStyle = cat.color + '40'; cx.lineWidth = 1; for (const r of RING) { cx.beginPath(); cx.arc(C, C, r, 0, 7); cx.stroke(); }
    cx.lineCap = 'round';
    list.forEach((gi, j) => {
      const a = angCat(ci, j), p = prog(gi), isSel = gi === sel.g;
      cx.strokeStyle = isSel ? cat.color + 'bb' : 'rgba(255,255,255,0.1)'; cx.lineWidth = isSel ? 2 : 1;
      cx.beginPath(); cx.moveTo(C + Math.cos(a) * (HUB + 8), C + Math.sin(a) * (HUB + 8)); cx.lineTo(C + Math.cos(a) * RING[LV - 1], C + Math.sin(a) * RING[LV - 1]); cx.stroke();
      if (p > 0) { cx.save(); cx.shadowColor = cat.color; cx.shadowBlur = 12; cx.strokeStyle = cat.color; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(C + Math.cos(a) * (HUB + 8), C + Math.sin(a) * (HUB + 8)); cx.lineTo(C + Math.cos(a) * RING[p - 1], C + Math.sin(a) * RING[p - 1]); cx.stroke(); cx.restore(); }
      for (let l = 0; l < LV; l++) {
        const [x, y] = posCat(ci, j, l), r = 3.6 + l * 0.35;
        if (l < p) { cx.save(); cx.shadowColor = cat.color; cx.shadowBlur = 16; cx.fillStyle = cat.color; cx.beginPath(); cx.arc(x, y, r + 1 + Math.sin(t * 2 + gi + l) * 0.6, 0, 7); cx.fill(); cx.restore(); cx.fillStyle = 'rgba(255,255,255,0.85)'; cx.beginPath(); cx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); cx.fill(); }
        else if (l === p) { const pulse = 0.5 + 0.5 * Math.sin(t * 3 + gi); cx.strokeStyle = cat.color; cx.globalAlpha = alpha * (0.5 + 0.5 * pulse); cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, r + pulse * 2, 0, 7); cx.stroke(); cx.globalAlpha = alpha; }
        else { cx.fillStyle = 'rgba(255,255,255,0.2)'; cx.beginPath(); cx.arc(x, y, 1.8, 0, 7); cx.fill(); }
      }
      const left = Math.cos(a) < -0.01;
      cx.save(); cx.translate(C + Math.cos(a) * NAME_R, C + Math.sin(a) * NAME_R); cx.rotate(left ? a + Math.PI : a);
      cx.font = `${isSel ? 600 : 400} ${isSel ? 12 : 10}px "IBM Plex Mono", monospace`; cx.textAlign = left ? 'right' : 'left'; cx.textBaseline = 'middle';
      cx.fillStyle = isSel ? '#ffffff' : p === LV ? cat.color : 'rgba(230,225,255,0.65)'; cx.fillText(games[gi].name, 0, 0); cx.restore();
    });
    // Auswahl: Blütenkranz
    if (catIndexOf(sel.g) === ci) {
      const [sx, sy] = posCat(ci, jOf(sel.g), sel.l);
      cx.save(); cx.translate(sx, sy); cx.rotate(t * 1.2); cx.strokeStyle = cat.color; cx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { cx.rotate(Math.PI / 4); cx.beginPath(); cx.ellipse(12, 0, 4.5, 2, 0, 0, 7); cx.stroke(); }
      cx.restore();
    }
    if (hover && hover.g !== undefined && !hover.soft) { const [hx, hy] = posCat(ci, jOf(hover.g), hover.l); cx.strokeStyle = 'rgba(255,255,255,0.6)'; cx.beginPath(); cx.arc(hx, hy, 11, 0, 7); cx.stroke(); }
    for (const ig of ignites) {
      if (catIndexOf(ig.g) !== ci) continue;
      const [x, y] = posCat(ci, jOf(ig.g), ig.l), kk = ig.t / 2.2;
      cx.save(); cx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { cx.strokeStyle = cat.color; cx.globalAlpha = alpha * (1 - kk) * (1 - i * 0.25); cx.lineWidth = 3 - i; cx.beginPath(); cx.arc(x, y, 10 + kk * (80 + i * 40), 0, 7); cx.stroke(); }
      for (let i = 0; i < 16; i++) { const aa = i / 16 * Math.PI * 2 + kk; cx.fillStyle = cat.color; cx.globalAlpha = alpha * (1 - kk); cx.fillRect(x + Math.cos(aa) * kk * 110, y + Math.sin(aa) * kk * 110, 3, 3); }
      cx.restore();
    }
    hubBase((t * 4) % 360);
    cx.save(); cx.translate(C, C); cx.textAlign = 'center';
    const fr = fracOf(ci);
    cx.strokeStyle = 'rgba(255,255,255,0.15)'; cx.lineWidth = 4; cx.beginPath(); cx.arc(0, 0, HUB - 8, 0, 7); cx.stroke();
    cx.save(); cx.shadowColor = cat.color; cx.shadowBlur = 12; cx.strokeStyle = cat.color; cx.beginPath(); cx.arc(0, 0, HUB - 8, -Math.PI / 2, -Math.PI / 2 + fr * Math.PI * 2); cx.stroke(); cx.restore();
    cx.font = '600 11px "IBM Plex Mono", monospace'; cx.fillStyle = cat.color; cx.fillText(cat.name.toUpperCase(), 0, -16);
    if (cat.ship) { cx.font = '9px "IBM Plex Mono", monospace'; cx.fillStyle = 'rgba(255,255,255,0.85)'; cx.fillText('→ ' + shipOf(ci), 0, -3); }
    cx.font = '600 15px "IBM Plex Mono", monospace'; cx.fillStyle = '#ffffff'; cx.fillText(`${Math.round(fr * 100)} %`, 0, 16);
    cx.font = '9px "IBM Plex Mono", monospace'; cx.fillStyle = 'rgba(255,255,255,0.55)'; cx.fillText('Mitte: zurück', 0, 32);
    cx.restore();
    cx.restore();
  }

  return {
    select, sel: () => sel, mode: () => mode, cat: () => ci, enterCat, toAll,
    ignite(g, l) { ignites.push({ g, l, t: 0 }); Klang.chord(); },
    update(dt) {
      t += dt; msgT -= dt;
      zoom += ((mode === 'cat' ? 1 : 0) - zoom) * Math.min(1, dt * 7);
      for (const s of stars) { s.r += s.v * dt * (1 + s.r / 200); if (s.r > 420) { s.r = 0; s.a = Math.random() * Math.PI * 2; } }
      ignites = ignites.filter(i => (i.t += dt) < 2.2);
      const d = rep(dt);
      if (mode === 'all') {
        if (d && d[0]) { ci = (ci + d[0] + cats.length) % cats.length; opt.onCategory(ci); }
        if (pressed.action || (d && d[1] === -1)) enterCat(ci);
      } else {
        if (pressed.menu) return toAll();
        if (d) {
          if (d[0]) { const list = members[ci], j = (jOf(sel.g) + d[0] + list.length) % list.length; select(list[j], sel.l); }
          if (d[1]) { if (d[1] === 1 && sel.l === 0) return toAll(); select(sel.g, sel.l - d[1]); }
        }
        if (pressed.action) tryPlay(sel.g, sel.l);
      }
    },
    draw() {
      cx.setTransform(2, 0, 0, 2, 0, 0);
      background((t * 4) % 360);
      if (zoom < 0.99) drawAll(1 - zoom, 1 + zoom * 0.35);
      if (zoom > 0.01) drawCat(zoom, 0.75 + zoom * 0.25);
      if (msgT > 0) { cx.font = '600 13px "IBM Plex Mono", monospace'; cx.textAlign = 'center'; cx.fillStyle = 'rgba(0,0,0,0.6)'; cx.fillRect(C - 240, S - 46, 480, 26); cx.fillStyle = '#fff'; cx.fillText(msg, C, S - 28); }
      cx.textAlign = 'left'; cx.globalAlpha = 1;
    }
  };
}
