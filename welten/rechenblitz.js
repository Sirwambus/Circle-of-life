/* =====================================================================
   WELT – Rechenblitz: Kopfrechnen unter Zeitdruck. Die richtige Antwort liegt an einer der vier Pfeilrichtungen.
   ===================================================================== */
function makeRechenblitz(next, level = 0) {
  const NEED = [10, 12, 12, 14, 15, 15, 16, 16, 17, 18][level], TIME = [50, 50, 55, 60, 65, 60, 60, 58, 58, 55][level];
  const DIRS4 = ['up', 'right', 'down', 'left'], POS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const finale = makeFinale(next);
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  let task, answer, opts, score, timeLeft, started, failed, flash, flashCol, t = 0;
  function makeTask() {
    if (level === 0) { if (Math.random() < 0.5) { const a = ri(2, 12), b = ri(2, 9); return [`${a} + ${b}`, a + b]; } const a = ri(6, 20), b = ri(1, a - 1); return [`${a} − ${b}`, a - b]; }
    if (level === 1) { if (Math.random() < 0.6) { const a = ri(3, 10), b = ri(3, 10); return [`${a} × ${b}`, a * b]; } const a = ri(14, 69), b = ri(12, 29); return [`${a} + ${b}`, a + b]; }
    if (level === 3) { if (Math.random() < 0.5) { const a = ri(12, 29), b = ri(3, 8); return [`${a} × ${b}`, a * b]; } const a = ri(120, 480), b = ri(35, 99); return [`${a} − ${b}`, a - b]; }
    if (level === 4) { const a = ri(2, 9), b = ri(2, 9), c3 = ri(2, 6); return Math.random() < 0.5 ? [`(${a} + ${b}) × ${c3}`, (a + b) * c3] : [`${a * c3} : ${c3} + ${b}`, a + b]; }
    if (level === 2) { const a = ri(3, 9), b = ri(3, 9), c2 = ri(2, Math.min(19, a * b)); return Math.random() < 0.5 ? [`${a} × ${b} + ${c2}`, a * b + c2] : [`${a} × ${b} − ${c2}`, a * b - c2]; }
    if (level === 5) { if (Math.random() < 0.5) { const a = ri(11, 20); return [`${a}²`, a * a]; } const a = ri(6, 19); return [`√${a * a}`, a]; }
    if (level === 6) { const a = ri(4, 9), b = ri(4, 9), c3 = ri(2, 6), d = ri(2, 6); return a * b >= c3 * d ? [`${a} × ${b} − ${c3} × ${d}`, a * b - c3 * d] : [`${c3} × ${d} − ${a} × ${b}`, c3 * d - a * b]; }
    if (level === 7) { const p = [10, 20, 25, 50, 75][ri(0, 4)], n = [40, 60, 80, 120, 160, 200, 240, 320, 400][ri(0, 8)]; return [`${p} % von ${n}`, p * n / 100]; }
    if (level === 8) { const k = ri(0, 2); if (k === 0) { const a = ri(12, 25), b = ri(4, 9); return [`${a * b} : ${b}`, a]; } if (k === 1) { const a = ri(13, 25); return [`${a}²`, a * a]; } const a = ri(11, 19), b = ri(11, 19); return [`${a} × ${b}`, a * b]; }
    const a = ri(6, 15), b = ri(6, 15), c3 = ri(3, 9), d = ri(10, Math.min(60, (a + b) * c3));
    return [`(${a} + ${b}) × ${c3} − ${d}`, (a + b) * c3 - d];
  }
  function round() {
    [task, answer] = makeTask();
    const set = new Set([answer]);
    while (set.size < 4) { const d = [1, 2, 3, 10, -1, -2, -10, 4][ri(0, 7)]; const v = answer + d; if (v >= 0 || answer < 0) set.add(v); }
    const vals = [...set].sort(() => Math.random() - 0.5);
    opts = {}; DIRS4.forEach((d, i) => opts[d] = vals[i]);
  }
  function reset() { score = 0; timeLeft = TIME; started = false; failed = false; flash = 0; round(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, answer, opts }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 3);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { if (pressed.action || dirOf(pressed)) { died(); reset(); } return; }
      const k = DIRS4.find(d => pressed[d]);
      if (!k) { if (started) timeLeft -= dt; if (timeLeft <= 0) failed = true; return; }
      started = true;
      if (opts[k] === answer) { score++; flash = 1; flashCol = '#4dffd2'; } else { timeLeft -= 3; flash = 1; flashCol = '#ff4d6d'; }
      if (score >= NEED) finale.start(); else round();
    },
    draw(c) {
      c.fillStyle = '#04222a'; c.fillRect(0, 0, W, H);
      // Metatrons Würfel, langsam drehend
      c.save(); c.translate(W / 2, H / 2); c.rotate(t * 0.04); c.strokeStyle = 'rgba(77,255,210,0.08)'; c.lineWidth = 1;
      const pts = [[0, 0]]; for (let r of [70, 140]) for (let i = 0; i < 6; i++) pts.push([Math.cos(i * Math.PI / 3) * r, Math.sin(i * Math.PI / 3) * r]);
      for (const a of pts) for (const b of pts) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      for (const [x, y] of pts) { c.beginPath(); c.arc(x, y, 35, 0, 7); c.stroke(); }
      c.restore();
      c.save(); c.shadowColor = '#4dffd2'; c.shadowBlur = 18;
      label(c, task + ' = ?', W / 2, H / 2 + 12, '#e6fff9', 'center', 30); c.restore();
      for (const d of DIRS4) {
        const [dx, dy] = POS[d], x = W / 2 + dx * 210, y = H / 2 + dy * 130;
        c.strokeStyle = 'rgba(77,255,210,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y - 5, 30, 0, 7); c.stroke();
        label(c, String(opts[d]), x, y + 3, '#4dffd2', 'center', 20);
        label(c, { up: '↑', right: '→', down: '↓', left: '←' }[d], x + dx * 46, y + dy * 44 + 2, 'rgba(230,255,249,0.5)', 'center', 12);
      }
      label(c, `Richtig ${score} / ${NEED}`, 16, 26, '#e6fff9');
      label(c, started ? `${Math.ceil(Math.max(0, timeLeft))} s` : 'Die Zeit läuft ab der ersten Antwort', W - 16, 26, '#e6fff9', 'right');
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 14, W - 32, 5);
      c.fillStyle = timeLeft < 10 ? '#ff4d6d' : '#4dffd2'; c.fillRect(16, H - 14, (W - 32) * clamp(timeLeft / TIME, 0, 1), 5);
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.15; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (failed) { c.fillStyle = 'rgba(4,34,42,0.9)'; c.fillRect(0, 160, W, 80); label(c, `Zeit abgelaufen: ${score} von ${NEED}. Taste: neuer Versuch`, W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#4dffd2', '#04222a');
    }
  };
  return self;
}
