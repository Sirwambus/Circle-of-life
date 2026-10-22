/* =====================================================================
   WELT – Reihenfolge: Laternen treiben eine nach der anderen den nächtlichen Fluss herab.
   Danach liegen alle am Ufer – tipp sie in der Reihenfolge an, in der sie gekommen sind.
   ===================================================================== */
function makeReihenfolge(next, level = 0) {
  // Ab Level 3 liegen fremde Laternen dabei, ab Level 7 verlieren die Laternen am Ufer ihre Farbe
  const K = [3, 4, 4, 5, 5, 6, 6, 6, 7, 7][level], D = [0, 0, 1, 1, 2, 2, 3, 3, 3, 4][level], SHOW = [1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.85, 0.8][level];
  const PALE = level >= 6, ROUNDS = 3, LIVES = 3;
  const SHAPES = ['kreis', 'dreieck', 'quadrat', 'stern', 'herz', 'mond', 'raute', 'tropfen', 'blitz', 'blume', 'pfeil', 'kreuz'];
  const HUES = ['#ff6b6b', '#ffd23f', '#4ecdc4', '#ff9f43', '#ff6bd5', '#a29bfe', '#7bed9f', '#70a1ff', '#fffa65', '#ff7f50', '#55efc4', '#e056fd'];
  const M = K + D, COLS = M <= 6 ? M : Math.ceil(M / 2), ROWS = Math.ceil(M / COLS), LW = 62, LH = 84, GAP = 18;
  const X0 = W / 2 - (COLS * LW + (COLS - 1) * GAP) / 2, Y0 = ROWS === 1 ? 170 : 110;
  const finale = makeFinale(next);
  let seq, bank, chosen, phase, timer, shown, cur, roundI, lives, bad, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater();
  function newRound() {
    const ids = SHAPES.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, M);
    seq = ids.slice(0, K); bank = ids.slice().sort(() => Math.random() - 0.5); chosen = []; bad = -1;
    phase = 'show'; timer = 0.8; shown = -1; cur = 0;
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  function sym(c, s, x, y, r, col) {
    c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
    if (s === 'kreis') c.arc(x, y, r * 0.75, 0, 7);
    else if (s === 'dreieck') { c.moveTo(x, y - r * 0.85); c.lineTo(x + r * 0.85, y + r * 0.65); c.lineTo(x - r * 0.85, y + r * 0.65); }
    else if (s === 'quadrat') c.rect(x - r * 0.65, y - r * 0.65, r * 1.3, r * 1.3);
    else if (s === 'stern') for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r * 0.95; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    else if (s === 'herz') { c.moveTo(x, y + r * 0.8); c.bezierCurveTo(x - r * 1.2, y - r * 0.1, x - r * 0.5, y - r, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.5, y - r, x + r * 1.2, y - r * 0.1, x, y + r * 0.8); }
    else if (s === 'mond') { c.arc(x, y, r * 0.8, 0.927, Math.PI * 2 - 0.927); c.arc(x + r * 0.48, y, r * 0.64, Math.PI * 1.5, Math.PI * 0.5, true); }
    else if (s === 'raute') { c.moveTo(x, y - r); c.lineTo(x + r * 0.65, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.65, y); }
    else if (s === 'tropfen') { c.moveTo(x, y - r); c.quadraticCurveTo(x + r * 0.8, y + r * 0.1, x + r * 0.55, y + r * 0.45); c.arc(x, y + r * 0.35, r * 0.56, 0.2, Math.PI - 0.2); c.quadraticCurveTo(x - r * 0.8, y + r * 0.1, x, y - r); }
    else if (s === 'blitz') { c.moveTo(x + r * 0.25, y - r); c.lineTo(x - r * 0.55, y + r * 0.1); c.lineTo(x, y + r * 0.1); c.lineTo(x - r * 0.25, y + r); c.lineTo(x + r * 0.55, y - r * 0.15); c.lineTo(x, y - r * 0.15); }
    else if (s === 'blume') { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; c.moveTo(x, y); c.arc(x + Math.cos(a) * r * 0.48, y + Math.sin(a) * r * 0.48, r * 0.4, 0, 7); } }
    else if (s === 'pfeil') { c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x + r * 0.3, y); c.lineTo(x + r * 0.3, y + r); c.lineTo(x - r * 0.3, y + r); c.lineTo(x - r * 0.3, y); c.lineTo(x - r * 0.8, y); }
    else if (s === 'kreuz') { c.rect(x - r * 0.25, y - r * 0.85, r * 0.5, r * 1.7); c.rect(x - r * 0.85, y - r * 0.25, r * 1.7, r * 0.5); }
    c.closePath(); c.fill(); c.restore();
  }
  function lantern(c, id, x, y, glow, pale) {
    c.save(); c.shadowColor = pale ? '#ffffff' : HUES[id]; c.shadowBlur = 18 * glow;
    c.fillStyle = '#f6ead2'; c.beginPath(); c.roundRect(x - LW / 2, y - LH / 2 + 8, LW, LH - 16, 18); c.fill(); c.restore();
    c.fillStyle = '#5a2a1a'; c.fillRect(x - LW / 2 + 8, y - LH / 2 + 2, LW - 16, 8); c.fillRect(x - LW / 2 + 8, y + LH / 2 - 10, LW - 16, 8);
    c.strokeStyle = 'rgba(160,110,60,0.35)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x - LW / 2 + 2, y - LH / 2 + 8 + k * (LH - 16) / 4); c.lineTo(x + LW / 2 - 2, y - LH / 2 + 8 + k * (LH - 16) / 4); c.stroke(); }
    sym(c, SHAPES[id], x, y, 18, pale ? '#3a3040' : HUES[id]);
  }
  const bankPos = i => ({ x: X0 + (i % COLS) * (LW + GAP) + LW / 2, y: Y0 + Math.floor(i / COLS) * (LH + 34) + LH / 2 });
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, seq, shown, bank, chosen, cur, cols: COLS, now: phase === 'show' && shown >= 0 && shown < K ? seq[shown] : -1 }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') {
        timer -= dt;
        if (timer <= 0) { shown++; timer = SHOW; if (shown < K) Klang.tone(330 + shown * 50, 0.3); else { phase = 'pick'; } }
      } else if (phase === 'pick') {
        const d = rep(dt);
        if (d) { const x = clamp(cur % COLS + d[0], 0, COLS - 1), y = clamp(Math.floor(cur / COLS) + d[1], 0, ROWS - 1); if (y * COLS + x < M) cur = y * COLS + x; }
        if (pressed.action && !chosen.includes(cur)) {
          if (bank[cur] === seq[chosen.length]) {
            chosen.push(cur); Klang.tone(330 + chosen.length * 50, 0.25);
            if (chosen.length === K) { roundI++; if (roundI >= ROUNDS) { finale.start(); return; } msg = 'Richtige Reihenfolge!'; msgT = 1.3; phase = 'wait'; timer = 1.4; }
          } else { lives--; bad = cur; msg = lives > 0 ? 'Falsch – so war die Reihenfolge.' : 'Keine Versuche mehr. Von vorn.'; msgT = 2.2; phase = 'reveal'; timer = 2.4; Klang.tone(150, 0.4); }
        }
      } else { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#060818'); bg.addColorStop(0.45, '#0d1838'); bg.addColorStop(1, '#03060f'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(120,160,255,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const y = 60 + i * 26, off = (t * 30 + i * 47) % 80; c.beginPath(); for (let x = -80 + off; x < W; x += 80) { c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 5, x + 40, y); } c.stroke(); }
      if (phase === 'show') {
        if (shown >= 0 && shown < K) {
          const k = 1 - timer / SHOW, x = W / 2 + (k - 0.5) * 60, y = 200 + Math.sin(t * 2) * 4;
          c.globalAlpha = clamp(Math.min(k * 5, (1 - k) * 5), 0, 1);
          c.fillStyle = 'rgba(255,200,120,0.15)'; c.beginPath(); c.ellipse(x, y + 60, 50, 10, 0, 0, 7); c.fill();
          lantern(c, seq[shown], x, y, 1, false); c.globalAlpha = 1;
        }
        for (let i = 0; i < K; i++) { c.fillStyle = i <= shown ? '#ffd88a' : 'rgba(255,216,138,0.2)'; c.beginPath(); c.arc(W / 2 - (K - 1) * 10 + i * 20, 330, 5, 0, 7); c.fill(); }
      } else {
        c.fillStyle = 'rgba(40,30,20,0.55)'; c.fillRect(0, Y0 - 30, W, ROWS * (LH + 34) + 20);
        bank.forEach((id, i) => {
          const { x, y } = bankPos(i), k = chosen.indexOf(i);
          const rev = phase === 'reveal' ? seq.indexOf(id) : -1;
          lantern(c, id, x, y, k >= 0 ? 1 : 0.3, PALE && phase === 'pick' && k < 0);
          if (k >= 0 || rev >= 0) { c.fillStyle = i === bad ? '#ff5a5a' : '#ffd88a'; c.beginPath(); c.arc(x + LW / 2 - 4, y - LH / 2 + 6, 11, 0, 7); c.fill(); label(c, String((k >= 0 ? k : rev) + 1), x + LW / 2 - 4, y - LH / 2 + 11, '#1a1020', 'center', 13); }
          if (i === bad) { c.strokeStyle = '#ff5a5a'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - LW / 2 - 5, y - LH / 2 - 2, LW + 10, LH + 4, 12); c.stroke(); }
          if (phase === 'pick' && i === cur) { c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - LW / 2 - 6, y - LH / 2 - 3, LW + 12, LH + 6, 12); c.stroke(); }
        });
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${K} Laternen`, 16, 26, '#dfe6ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8aa8', 'right', 16);
      const hint = finale.active ? '' : phase === 'show' ? 'Merk dir die Reihenfolge …' : phase === 'pick' ? `Welche kam als ${chosen.length + 1}.? Pfeile wählen, Leertaste antippen` : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 16, '#dfe6ff', 'center');
      finale.draw(c, '#dfe6ff', '#0d1838');
    }
  };
  return self;
}
