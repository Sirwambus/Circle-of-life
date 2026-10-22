/* =====================================================================
   WELT – Mastermind: Errate den verborgenen Farbcode. Gold = richtige Farbe am richtigen Platz,
   Silber = richtige Farbe an einem anderen Platz. ← → Platz, ↑ ↓ Farbe, Leertaste prüfen.
   ===================================================================== */
function makeMastermind(next, level = 0) {
  const PEGS = [3, 3, 4, 4, 4, 4, 4, 5, 5, 5][level], COLS = [4, 5, 4, 5, 6, 6, 6, 6, 7, 8][level];
  const REP = [0, 0, 0, 0, 0, 1, 1, 0, 1, 1][level] === 1, TRIES = [8, 8, 8, 8, 9, 9, 8, 9, 10, 10][level];
  const PAL = ['#ff4d5e', '#ffa53a', '#ffe14d', '#4ee06a', '#3fd9ff', '#4a7bff', '#b65cff', '#ff7ad2'];
  const finale = makeFinale(next);
  const RH = Math.min(31, 300 / TRIES), SX = 36, BX = 110, BY = 76;
  let code, rows, cur, slot, state, stT, t = 0, msg = '', msgT = 0;
  const stars = Array.from({ length: 60 }, (_, i) => ({ x: (i * 157) % W, y: (i * 89) % H, p: i * 0.7 }));
  function newGame() {
    const pool = Array.from({ length: COLS }, (_, i) => i); code = [];
    for (let i = 0; i < PEGS; i++) code.push(REP ? Math.floor(Math.random() * COLS) : pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    rows = []; cur = Array(PEGS).fill(-1); slot = 0; state = 'play'; stT = 0;
  }
  newGame();
  function score(g) {
    let gold = 0, sil = 0; const a = Array(COLS).fill(0), b = Array(COLS).fill(0);
    for (let i = 0; i < PEGS; i++) { if (g[i] === code[i]) gold++; else { a[g[i]]++; b[code[i]]++; } }
    for (let k = 0; k < COLS; k++) sil += Math.min(a[k], b[k]);
    return [gold, sil];
  }
  const rep = makeRepeater(0.28, 0.12);
  // Edelstein mit Zeichen (damit die Farben auch ohne Farbsehen unterscheidbar sind)
  function gem(c, x, y, r, k, glow) {
    if (k < 0) { c.strokeStyle = 'rgba(200,190,255,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); return; }
    c.save(); if (glow) { c.shadowColor = PAL[k]; c.shadowBlur = 12; }
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, PAL[k]); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.restore();
    c.fillStyle = 'rgba(20,10,40,0.55)'; const s = r * 0.38; c.beginPath();
    if (k === 0) c.arc(x, y, s * 0.8, 0, 7);
    else if (k === 1) { c.moveTo(x, y - s); c.lineTo(x + s, y + s * 0.8); c.lineTo(x - s, y + s * 0.8); }
    else if (k === 2) c.rect(x - s * 0.8, y - s * 0.8, s * 1.6, s * 1.6);
    else if (k === 3) { c.moveTo(x, y - s * 1.1); c.lineTo(x + s, y); c.lineTo(x, y + s * 1.1); c.lineTo(x - s, y); }
    else if (k === 4) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.45 : s * 1.1; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } }
    else if (k === 5) { c.rect(x - s, y - s * 0.3, s * 2, s * 0.6); c.rect(x - s * 0.3, y - s, s * 0.6, s * 2); }
    else if (k === 6) { c.rect(x - s, y - s * 0.3, s * 2, s * 0.6); }
    else { c.arc(x - s * 0.5, y, s * 0.4, 0, 7); c.arc(x + s * 0.5, y, s * 0.4, 0, 7); }
    c.fill();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ PEGS, COLS, REP, TRIES, rows: rows.map(r => ({ g: r.g.slice(), f: r.f.slice() })), cur: cur.slice(), slot, state, fin: finale.active, code: code.slice() }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (state === 'won') { stT += dt; if (stT > 1.2) finale.start(); return; }
      if (state === 'lost') { stT += dt; if (stT > 0.6 && pressed.action) { died(); newGame(); } return; }
      const d = rep(dt);
      if (d && d[0]) slot = (slot + d[0] + PEGS) % PEGS;
      if (d && d[1]) { cur[slot] = cur[slot] < 0 ? (d[1] < 0 ? 0 : COLS - 1) : (cur[slot] - d[1] + COLS) % COLS; Klang.tone(330 + cur[slot] * 45, 0.08); }
      if (pressed.action) {
        if (cur.some(v => v < 0)) { msg = 'Erst alle Plätze füllen.'; msgT = 1.6; return; }
        const f = score(cur); rows.push({ g: cur.slice(), f }); Klang.tone(f[0] === PEGS ? 880 : 420 + f[0] * 80, 0.2);
        if (f[0] === PEGS) { state = 'won'; stT = 0; }
        else if (rows.length >= TRIES) { state = 'lost'; stT = 0; }
        else slot = 0;
      }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 420); bg.addColorStop(0, '#2a1650'); bg.addColorStop(1, '#0a0618');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      for (const s of stars) { c.fillStyle = `rgba(220,200,255,${0.25 + 0.25 * Math.sin(t * 1.5 + s.p)})`; c.fillRect(s.x, s.y, 2, 2); }
      // Brett
      const bw = PEGS * SX + 90;
      c.fillStyle = 'rgba(18,10,40,0.85)'; c.beginPath(); c.roundRect(BX - 30, 36, bw, BY - 36 + TRIES * RH + 14, 14); c.fill();
      c.strokeStyle = 'rgba(190,160,255,0.35)'; c.lineWidth = 1.5; c.stroke();
      // verborgener Code
      const show = state !== 'play';
      for (let i = 0; i < PEGS; i++) {
        const x = BX + i * SX, y = 54;
        if (show) gem(c, x, y, 12, code[i], true);
        else { c.fillStyle = '#3a2a66'; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); label(c, '?', x, y + 5, '#b9a6ff', 'center', 14); }
      }
      c.strokeStyle = 'rgba(190,160,255,0.25)'; c.beginPath(); c.moveTo(BX - 20, BY - 6); c.lineTo(BX - 40 + bw, BY - 6); c.stroke();
      for (let r = 0; r < TRIES; r++) {
        const y = BY + r * RH + RH / 2, row = rows[r], active = r === rows.length && state === 'play';
        label(c, String(r + 1), BX - 22, y + 4, active ? '#ffffff' : 'rgba(185,166,255,0.5)', 'right', 10);
        if (active) { c.fillStyle = 'rgba(160,120,255,0.18)'; c.beginPath(); c.roundRect(BX - 16, y - RH / 2 + 1, PEGS * SX, RH - 2, 8); c.fill(); }
        for (let i = 0; i < PEGS; i++) {
          const x = BX + i * SX, k = row ? row.g[i] : active ? cur[i] : -2;
          if (k === -2) { c.fillStyle = 'rgba(120,100,200,0.18)'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
          else gem(c, x, y, Math.min(11, RH / 2 - 3), k, active && i === slot);
          if (active && i === slot) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, Math.min(11, RH / 2 - 3) + 3.5, 0, 7); c.stroke(); }
        }
        if (row) { // Rückmeldung: Gold zuerst, dann Silber
          const fx = BX + PEGS * SX - 6;
          for (let i = 0; i < PEGS; i++) {
            const px = fx + (i % 3) * 11, py = y - 5 + Math.floor(i / 3) * 10;
            if (i < row.f[0]) { c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill(); }
            else if (i < row.f[0] + row.f[1]) { c.strokeStyle = '#e6e9f5'; c.lineWidth = 2; c.beginPath(); c.arc(px, py, 3.3, 0, 7); c.stroke(); }
            else { c.fillStyle = 'rgba(120,100,200,0.25)'; c.beginPath(); c.arc(px, py, 1.6, 0, 7); c.fill(); }
          }
        }
      }
      // rechte Tafel: Farben und Legende
      const px = 400;
      label(c, 'Farben im Spiel', px, 92, '#d9ccff');
      for (let k = 0; k < COLS; k++) gem(c, px + 14 + (k % 4) * 40, 118 + Math.floor(k / 4) * 38, 13, k, false);
      c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(px + 8, 210, 5, 0, 7); c.fill();
      label(c, 'Farbe und Platz richtig', px + 20, 214, '#d9ccff', 'left', 11);
      c.strokeStyle = '#e6e9f5'; c.lineWidth = 2; c.beginPath(); c.arc(px + 8, 232, 4.3, 0, 7); c.stroke();
      label(c, 'Farbe richtig, Platz falsch', px + 20, 236, '#d9ccff', 'left', 11);
      label(c, REP ? 'Farben können sich wiederholen' : 'Jede Farbe höchstens einmal', px, 266, REP ? '#ffb3e6' : '#b9a6ff', 'left', 11);
      label(c, `Versuch ${Math.min(rows.length + 1, TRIES)} / ${TRIES}   ·   ${PEGS} Steine, ${COLS} Farben`, 16, 22, '#d9ccff');
      if (state === 'lost') { c.fillStyle = 'rgba(10,6,24,0.7)'; c.fillRect(0, H - 70, W, 50); label(c, 'Keine Versuche mehr. Leertaste: neuer Code', W / 2, H - 40, '#ffffff', 'center', 15); }
      else if (msgT > 0) label(c, msg, px, 310, '#ffffff', 'left', 12);
      else if (state === 'play') { label(c, '← → Platz   ↑ ↓ Farbe', px, 310, 'rgba(217,204,255,0.75)', 'left', 11); label(c, 'Leertaste: Reihe prüfen', px, 328, 'rgba(217,204,255,0.75)', 'left', 11); }
      finale.draw(c, '#b9a6ff', '#2a1650');
    }
  };
  return self;
}
