/* =====================================================================
   WELT – Symbolsuche: Kommt das Zielzeichen in der Reihe vor? → ja, ← nein. So schnell wie möglich.
   Grafik: alchemistische Zeichen in Gold auf Nachtblau.
   ===================================================================== */
function makeSymbolsuche(next, level = 0) {
  const ROW = [4, 6, 8, 9, 10, 10, 11, 11, 12, 12][level], NEED = [12, 15, 18, 20, 22, 23, 24, 25, 26, 28][level], TIME = 45;
  // Level 3 zieht seine Zeichen nur aus ähnlichen Gruppen (Dreiecke, Kreise), das verwirrt
  const POOL = level >= 2 ? [1, 2, 3, 4, 0, 7, 12, 13] : [0, 1, 2, 5, 6, 7, 8, 9, 10, 11];
  const finale = makeFinale(next);
  let target, row, present, score, timeLeft, flash, flashCol, started, failed, t = 0;
  function glyph(c, id, x, y, s) {
    c.beginPath();
    const tri = (up, bar) => { const d = up ? -1 : 1; c.moveTo(x, y + d * s); c.lineTo(x + s * 0.9, y - d * s * 0.6); c.lineTo(x - s * 0.9, y - d * s * 0.6); c.closePath(); if (bar) { c.moveTo(x - s * 0.6, y - d * s * 0.05); c.lineTo(x + s * 0.6, y - d * s * 0.05); } };
    if (id === 0) { c.arc(x, y, s * 0.8, 0, 7); c.moveTo(x + 3, y); c.arc(x, y, 3, 0, 7); }
    else if (id === 1) tri(true, false); else if (id === 2) tri(false, false);
    else if (id === 3) tri(true, true); else if (id === 4) tri(false, true);
    else if (id === 5) { c.arc(x, y, s * 0.8, 0.7, Math.PI * 2 - 0.7); c.arc(x + s * 0.45, y, s * 0.6, Math.PI * 2 - 1.2, 1.2, true); }
    else if (id === 6) { c.moveTo(x, y - s); c.lineTo(x, y + s); c.moveTo(x - s * 0.7, y - s * 0.2); c.lineTo(x + s * 0.7, y - s * 0.2); }
    else if (id === 7) { c.arc(x, y, s * 0.8, 0, 7); c.moveTo(x - s * 0.8, y); c.lineTo(x + s * 0.8, y); c.moveTo(x, y - s * 0.8); c.lineTo(x, y + s * 0.8); }
    else if (id === 8) for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * s, y + Math.sin(a) * s); }
    else if (id === 9) for (let i = 0; i < 40; i++) { const a = i * 0.45, r = i / 40 * s; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
    else if (id === 10) c.rect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4);
    else if (id === 11) { c.moveTo(x - s * 0.7, y - s); c.lineTo(x + s * 0.7, y - s); c.lineTo(x - s * 0.7, y + s); c.lineTo(x + s * 0.7, y + s); c.closePath(); }
    else if (id === 12) { c.arc(x, y, s * 0.8, 0, 7); c.moveTo(x - s * 0.8, y); c.lineTo(x + s * 0.8, y); }
    else if (id === 13) { c.arc(x, y, s * 0.8, 0, 7); c.moveTo(x, y - s * 0.8); c.lineTo(x, y + s * 0.8); }
    c.stroke();
  }
  function round() {
    target = POOL[Math.floor(Math.random() * POOL.length)];
    present = Math.random() < 0.5;
    const others = POOL.filter(g => g !== target);
    row = Array.from({ length: ROW }, () => others[Math.floor(Math.random() * others.length)]);
    if (present) row[Math.floor(Math.random() * ROW)] = target;
  }
  function reset() { score = 0; timeLeft = TIME; flash = 0; started = false; failed = false; round(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, present }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 3);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { if (pressed.action || pressed.left || pressed.right) { died(); reset(); } return; }
      const ans = pressed.right ? true : pressed.left ? false : null;
      if (ans === null) { if (started) timeLeft -= dt; if (timeLeft <= 0) failed = true; return; }
      started = true;
      if (ans === present) { score++; flash = 1; flashCol = '#ffd86b'; } else { timeLeft -= 3; flash = 1; flashCol = '#ff4d6d'; }
      if (score >= NEED) finale.start(); else round();
    },
    draw(c) {
      c.fillStyle = '#0b1030'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,216,107,0.07)'; c.lineWidth = 1;
      for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(W / 2, H / 2, 40 + i * 30, t * 0.05 + i, t * 0.05 + i + 4); c.stroke(); }
      c.lineWidth = 2.5; c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = '#ffd86b'; c.shadowColor = '#ffd86b'; c.shadowBlur = 12;
      c.strokeRect(W / 2 - 40, 50, 80, 80); glyph(c, target, W / 2, 90, 26);
      c.shadowBlur = 0;
      const gap = Math.min(70, 560 / ROW), x0 = W / 2 - gap * (ROW - 1) / 2;
      c.strokeStyle = '#e8dcff';
      row.forEach((g, i) => { c.strokeStyle = 'rgba(232,220,255,0.18)'; c.strokeRect(x0 + i * gap - gap / 2 + 4, 190, gap - 8, 70); c.strokeStyle = '#e8dcff'; glyph(c, g, x0 + i * gap, 225, Math.min(22, gap / 3)); });
      label(c, 'Ziel', W / 2, 44, '#ffd86b', 'center');
      label(c, '← nein', W / 2 - 120, 310, '#ff9db0', 'center', 16); label(c, 'ja →', W / 2 + 120, 310, '#ffd86b', 'center', 16);
      label(c, 'Kommt das Zielzeichen in der Reihe vor?', W / 2, 290, '#8b93c9', 'center');
      label(c, `Treffer ${score} / ${NEED}`, 16, 26, '#e8dcff');
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 22, W - 32, 6);
      c.fillStyle = timeLeft < 10 ? '#ff4d6d' : '#ffd86b'; c.fillRect(16, H - 22, (W - 32) * clamp(timeLeft / TIME, 0, 1), 6);
      label(c, started ? `${Math.ceil(Math.max(0, timeLeft))} s` : 'Die Zeit läuft ab der ersten Antwort', W - 16, 26, '#e8dcff', 'right');
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.15; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (failed) { c.fillStyle = 'rgba(11,16,48,0.85)'; c.fillRect(0, 150, W, 100); label(c, `Zeit abgelaufen: ${score} von ${NEED}. Taste: neuer Versuch`, W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#ffd86b', '#1a2050');
    }
  };
  return self;
}
