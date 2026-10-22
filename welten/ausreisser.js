/* =====================================================================
   WELT – Ausreißer: Unter vielen gleichen Zeichen ist genau eines anders. Finde es.
   Je höher das Level, desto mehr Zeichen und desto feiner der Unterschied.
   ===================================================================== */
function makeAusreisser(next, level = 0) {
  const CWN = [4, 5, 6, 7, 8, 8, 9, 9, 10, 10][level], CHN = [3, 4, 4, 5, 5, 6, 6, 6, 6, 6][level], NEED = [6, 8, 10, 10, 12, 12, 12, 14, 14, 15][level], TIME = 60;
  const ROT = [0, 0, 0.5, 0.28, 0.2, 0.15, 0.12, 0.1, 0.08, 0.07][level], SHADE = [0.55, 0.3, 0, 0, 0.12, 0.08, 0.06, 0.05, 0.04, 0.03][level], SQUASH = [0, 0.25, 0, 0, 0, 0, 0, 0, 0, 0][level];
  const CELL = Math.min(520 / CWN, 300 / CHN), X0 = W / 2 - CELL * CWN / 2, Y0 = 50 + (320 - CELL * CHN) / 2;
  const finale = makeFinale(next);
  let odd, base, cur, score, timeLeft, started, failed, flash, flashCol, t = 0;
  const rep = makeRepeater();
  function round() { odd = { x: Math.floor(Math.random() * CWN), y: Math.floor(Math.random() * CHN) }; base = { hue: Math.floor(Math.random() * 360), kind: Math.floor(Math.random() * 3), rot: Math.random() * 6 }; }
  function reset() { score = 0; timeLeft = TIME; started = false; failed = false; flash = 0; cur = { x: 0, y: 0 }; round(); }
  reset();
  function glyph(c, x, y, r, isOdd) {
    c.save(); c.translate(x, y); c.rotate(base.rot + (isOdd ? ROT : 0)); if (isOdd && SQUASH) c.scale(1, 1 - SQUASH);
    c.fillStyle = `hsl(${base.hue},70%,${isOdd && SHADE ? 60 - SHADE * 40 : 60}%)`;
    c.beginPath();
    if (base.kind === 0) { c.moveTo(0, -r); c.lineTo(r * 0.8, r * 0.7); c.lineTo(0, r * 0.3); c.lineTo(-r * 0.8, r * 0.7); c.closePath(); }
    else if (base.kind === 1) { c.moveTo(-r, -r * 0.3); c.lineTo(r * 0.2, -r * 0.3); c.lineTo(r * 0.2, -r); c.lineTo(r, 0); c.lineTo(r * 0.2, r); c.lineTo(r * 0.2, r * 0.3); c.lineTo(-r, r * 0.3); c.closePath(); }
    else { c.arc(0, 0, r, 0.4, Math.PI * 2 - 0.4); c.lineTo(0, 0); c.closePath(); }
    c.fill(); c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, odd, cur }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 3);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { if (pressed.action) { died(); reset(); } return; }
      if (started) { timeLeft -= dt; if (timeLeft <= 0) { failed = true; return; } }
      const d = rep(dt); if (d) { started = true; cur.x = clamp(cur.x + d[0], 0, CWN - 1); cur.y = clamp(cur.y + d[1], 0, CHN - 1); }
      if (pressed.action) {
        started = true;
        if (cur.x === odd.x && cur.y === odd.y) { score++; flash = 1; flashCol = '#ffffff'; Klang.tone(740, 0.2); if (score >= NEED) { finale.start(); return; } round(); }
        else { timeLeft -= 4; flash = 1; flashCol = '#ff4d6d'; }
      }
    },
    draw(c) {
      c.fillStyle = '#0e1622'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < CHN; y++) for (let x = 0; x < CWN; x++) {
        const cx = X0 + x * CELL + CELL / 2, cy = Y0 + y * CELL + CELL / 2;
        c.fillStyle = 'rgba(255,255,255,0.03)'; c.beginPath(); c.arc(cx, cy, CELL * 0.45, 0, 7); c.fill();
        glyph(c, cx, cy, CELL * 0.3, x === odd.x && y === odd.y);
      }
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(X0 + cur.x * CELL + CELL / 2, Y0 + cur.y * CELL + CELL / 2, CELL * 0.46, 0, 7); c.stroke();
      label(c, `Gefunden ${score} / ${NEED}`, 16, 26, '#dfe9f5');
      label(c, started ? `${Math.ceil(Math.max(0, timeLeft))} s` : 'Die Zeit läuft ab dem ersten Schritt', W - 16, 26, '#dfe9f5', 'right');
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 14, W - 32, 5);
      c.fillStyle = timeLeft < 10 ? '#ff4d6d' : '#7ac8ff'; c.fillRect(16, H - 14, (W - 32) * clamp(timeLeft / TIME, 0, 1), 5);
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.12; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (failed) { c.fillStyle = 'rgba(14,22,34,0.9)'; c.fillRect(0, 160, W, 80); label(c, `Zeit abgelaufen: ${score} von ${NEED}. Leertaste: neuer Versuch`, W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#dfe9f5', '#1a2638');
    }
  };
  return self;
}
