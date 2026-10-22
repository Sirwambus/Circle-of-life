/* =====================================================================
   WELT – Memory: Paare aufdecken. Sind alle gefunden, liegt die Tür auf dem Tisch.
   ===================================================================== */
function makeMemory(next, level = 0) {
  // Level 1–5: 4 Reihen, 4 bis 8 Spalten (8 bis 16 Paare)
  const COLS = [4, 5, 6, 7, 8, 8, 8, 8, 8, 8][level], ROWS = 4;
  const SYMS = ['kreis', 'dreieck', 'stern', 'mond', 'herz', 'raute', 'sonne', 'welle', 'kreuz', 'pfeil', 'tropfen', 'blitz', 'auge', 'spirale', 'dreizack', 'unendlich'].slice(0, COLS * ROWS / 2);
  const deck = SYMS.concat(SYMS).map(s => ({ s, r: Math.random() })).sort((a, b) => a.r - b.r)
    .map(({ s }) => ({ sym: s, up: false, matched: false, f: 0 }));
  const CW = 60, CH = 76, G = 12, X0 = (W - (COLS * CW + (COLS - 1) * G)) / 2, Y0 = 32;
  const cur = { x: 0, y: 0 }, rep = makeRepeater();
  // Ab Level 6 gibt es nur eine begrenzte Zahl an Versuchen
  const MAXTRY = [0, 0, 0, 0, 0, 46, 42, 38, 35, 32][level];
  let open = [], wait = 0, tries = 0, solvedT = -1, failed = false, t = 0;
  function reshuffle() {
    const syms = deck.map(d => d.sym).map(s => ({ s, r: Math.random() })).sort((a, b) => a.r - b.r);
    deck.forEach((d, i) => Object.assign(d, { sym: syms[i].s, up: false, matched: false, f: 0 }));
    open = []; wait = 0; tries = 0; failed = false;
  }
  const pos = i => ({ x: X0 + (i % COLS) * (CW + G), y: Y0 + Math.floor(i / COLS) * (CH + G) });
  const allDone = () => deck.every(c => c.matched);
  function drawSym(c, s, x, y, r) {
    c.beginPath();
    if (s === 'kreis') c.arc(x, y, r, 0, 7);
    else if (s === 'dreieck') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (s === 'stern') for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    else if (s === 'mond') { c.arc(x, y, r, 0.6, Math.PI * 2 - 0.6); c.arc(x + r * 0.55, y, r * 0.75, Math.PI * 2 - 1.1, 1.1, true); }
    else if (s === 'herz') { c.moveTo(x, y + r); c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4); c.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r); }
    else if (s === 'raute') { c.moveTo(x, y - r); c.lineTo(x + r * 0.7, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.7, y); c.closePath(); }
    else if (s === 'sonne') { c.arc(x, y, r * 0.5, 0, 7); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } }
    else if (s === 'kreuz') { c.rect(x - r * 0.25, y - r, r * 0.5, r * 2); c.rect(x - r, y - r * 0.25, r * 2, r * 0.5); }
    else if (s === 'pfeil') { c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x + r * 0.35, y); c.lineTo(x + r * 0.35, y + r); c.lineTo(x - r * 0.35, y + r); c.lineTo(x - r * 0.35, y); c.lineTo(x - r, y); c.closePath(); }
    else if (s === 'tropfen') { c.moveTo(x, y - r); c.bezierCurveTo(x + r * 0.2, y - r * 0.4, x + r * 0.8, y, x + r * 0.8, y + r * 0.3); c.arc(x, y + r * 0.3, r * 0.8, 0, Math.PI); c.bezierCurveTo(x - r * 0.8, y, x - r * 0.2, y - r * 0.4, x, y - r); }
    else if (s === 'blitz') { c.moveTo(x + r * 0.3, y - r); c.lineTo(x - r * 0.6, y + r * 0.15); c.lineTo(x - r * 0.05, y + r * 0.15); c.lineTo(x - r * 0.3, y + r); c.lineTo(x + r * 0.6, y - r * 0.15); c.lineTo(x + r * 0.05, y - r * 0.15); c.closePath(); }
    else if (s === 'auge') { c.moveTo(x - r, y); c.quadraticCurveTo(x, y - r * 1.1, x + r, y); c.quadraticCurveTo(x, y + r * 1.1, x - r, y); c.moveTo(x + r * 0.35, y); c.arc(x, y, r * 0.35, 0, 7); }
    else if (s === 'spirale') for (let i = 0; i < 50; i++) { const a = i * 0.4, rr = i / 50 * r; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    else if (s === 'dreizack') { c.moveTo(x, y + r); c.lineTo(x, y - r); c.moveTo(x - r * 0.7, y - r * 0.8); c.lineTo(x - r * 0.7, y - r * 0.1); c.lineTo(x + r * 0.7, y - r * 0.1); c.lineTo(x + r * 0.7, y - r * 0.8); }
    else if (s === 'unendlich') { c.moveTo(x, y); c.bezierCurveTo(x + r * 0.5, y - r * 0.7, x + r * 1.1, y - r * 0.4, x + r, y); c.bezierCurveTo(x + r * 0.9, y + r * 0.5, x + r * 0.4, y + r * 0.5, x, y); c.bezierCurveTo(x - r * 0.5, y - r * 0.7, x - r * 1.1, y - r * 0.4, x - r, y); c.bezierCurveTo(x - r * 0.9, y + r * 0.5, x - r * 0.4, y + r * 0.5, x, y); }
    else if (s === 'welle') for (let k = -1; k <= 1; k++) { c.moveTo(x - r, y + k * r * 0.6); c.bezierCurveTo(x - r * 0.3, y + k * r * 0.6 - r * 0.5, x + r * 0.3, y + k * r * 0.6 + r * 0.5, x + r, y + k * r * 0.6); }
  }
  const doorR = { x: W / 2 - 22, y: 150, w: 44, h: 80 };
  const self = {
    done: false,
    door: () => doorR,
    update(dt) {
      t += dt;
      for (const cd of deck) cd.f += ((cd.up || cd.matched ? 1 : 0) - cd.f) * Math.min(1, dt * 10);
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 0.8 && pressed.action) self.done = true; return; }
      if (failed) { if (pressed.action) { died(); reshuffle(); } return; }
      if (wait > 0) { wait -= dt; if (wait <= 0) { open.forEach(cd => cd.up = false); open = []; if (MAXTRY && tries >= MAXTRY) failed = true; } return; }
      const d = rep(dt);
      if (d) { cur.x = (cur.x + d[0] + COLS) % COLS; cur.y = (cur.y + d[1] + ROWS) % ROWS; }
      if (pressed.action) {
        const cd = deck[cur.y * COLS + cur.x];
        if (cd.up || cd.matched) return;
        cd.up = true; open.push(cd);
        if (open.length === 2) {
          tries++;
          if (open[0].sym === open[1].sym) { open.forEach(o => o.matched = true); open = []; if (allDone()) solvedT = 0; }
          else wait = 0.9;
        }
      }
    },
    draw(c) {
      c.fillStyle = '#1d553b'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 400; i++) c.fillRect((i * 97) % W, (i * 53) % H, 2, 2);
      const fade = solvedT >= 0 ? clamp(solvedT / 0.6, 0, 1) : 0;
      deck.forEach((cd, i) => {
        const p = pos(i), sx = Math.abs(Math.cos(cd.f * Math.PI));
        c.save(); c.globalAlpha = cd.matched ? 1 - fade * 0.8 : 1;
        c.translate(p.x + CW / 2, p.y + CH / 2); c.scale(Math.max(0.04, sx), 1);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-CW / 2 + 3, -CH / 2 + 4, CW, CH);
        if (cd.f < 0.5) {
          c.fillStyle = '#7a1f2b'; c.fillRect(-CW / 2, -CH / 2, CW, CH);
          c.strokeStyle = '#d9b45a'; c.lineWidth = 2; c.strokeRect(-CW / 2 + 4, -CH / 2 + 4, CW - 8, CH - 8);
          c.beginPath(); c.moveTo(0, -CH / 2 + 12); c.lineTo(CW / 2 - 12, 0); c.lineTo(0, CH / 2 - 12); c.lineTo(-CW / 2 + 12, 0); c.closePath(); c.stroke();
        } else {
          c.fillStyle = cd.matched ? '#efe4c8' : '#f6eedc'; c.fillRect(-CW / 2, -CH / 2, CW, CH);
          c.strokeStyle = '#b8954a'; c.lineWidth = 1; c.strokeRect(-CW / 2 + 3, -CH / 2 + 3, CW - 6, CH - 6);
          c.fillStyle = '#b8862e'; c.strokeStyle = '#3a2a14'; c.lineWidth = 2;
          drawSym(c, cd.sym, 0, 0, 16);
          if (['sonne', 'welle', 'auge', 'spirale', 'dreizack', 'unendlich'].includes(cd.sym)) c.stroke(); else { c.fill(); c.stroke(); }
        }
        c.restore();
      });
      if (solvedT < 0) {
        const p = pos(cur.y * COLS + cur.x);
        c.save(); c.strokeStyle = '#ffd86b'; c.shadowColor = '#ffd86b'; c.shadowBlur = 12; c.lineWidth = 3;
        c.strokeRect(p.x - 5, p.y - 5, CW + 10, CH + 10); c.restore();
      } else {
        c.globalAlpha = fade;
        paintDoor(c, doorR, { frame: '#d9b45a', panel: '#7a1f2b', knob: '#ffd86b', light: next, glow: '#ffd86b', open: 0.3 + 0.2 * Math.sin(t * 3) });
        label(c, 'Leertaste / A: eintreten', W / 2, 270, '#ffd86b', 'center');
        c.globalAlpha = 1;
      }
      label(c, MAXTRY ? `Versuche ${tries} / ${MAXTRY}` : `Versuche ${tries}`, 14, 24, MAXTRY && tries > MAXTRY - 5 ? '#ff8f7a' : '#d9b45a');
      if (failed) { c.fillStyle = 'rgba(20,40,30,0.92)'; c.fillRect(0, 160, W, 80); label(c, 'Keine Versuche mehr. Leertaste: neu mischen', W / 2, 205, '#ffd86b', 'center', 14); }
      label(c, `Paare ${deck.filter(d => d.matched).length / 2}/${SYMS.length}`, W - 14, 24, '#d9b45a', 'right');
      const v = c.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 420);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
  };
  return self;
}
