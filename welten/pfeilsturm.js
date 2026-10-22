/* =====================================================================
   WELT – Pfeilsturm: Reihen aus Pfeilen ziehen im Gewitter heran. Tipp sie so schnell wie möglich
   von links nach rechts ab. Ab Level 5 gibt es rote Pfeile: dort gilt die Gegenrichtung.
   ===================================================================== */
function makePfeilsturm(next, level = 0) {
  const LEN = [3, 3, 4, 4, 5, 5, 5, 6, 6, 7][level], ROWS = [5, 6, 6, 7, 7, 8, 8, 8, 9, 9][level];
  const RED = [0, 0, 0, 0, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45][level], PER = [1, 0.9, 0.8, 0.72, 0.7, 0.65, 0.6, 0.56, 0.52, 0.48][level];
  const TIME = Math.round(LEN * ROWS * PER + ROWS * 0.6);
  const DIRN = ['up', 'right', 'down', 'left'], OPP = { up: 'down', down: 'up', left: 'right', right: 'left' }, ROT = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: Math.PI };
  const finale = makeFinale(next);
  const ri = n => Math.floor(Math.random() * n);
  const drops = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 380 + Math.random() * 260 }));
  let row, queue, pos, rowI, timeLeft, started, failed, failT, shake, bolt, slide, t = 0, boltX = W / 2;
  const mkRow = () => Array.from({ length: LEN }, () => ({ d: DIRN[ri(4)], red: Math.random() < RED }));
  function reset() { rowI = 0; timeLeft = TIME; started = false; failed = false; shake = 0; bolt = 0; slide = 0; row = mkRow(); queue = mkRow(); pos = 0; }
  reset();
  const want = () => row[pos].red ? OPP[row[pos].d] : row[pos].d;
  function arrow(c, x, y, d, s, col) {
    c.save(); c.translate(x, y); c.rotate(ROT[d]); c.fillStyle = col;
    c.beginPath(); c.moveTo(s, 0); c.lineTo(s * 0.05, -s * 0.8); c.lineTo(s * 0.05, -s * 0.32); c.lineTo(-s * 0.85, -s * 0.32);
    c.lineTo(-s * 0.85, s * 0.32); c.lineTo(s * 0.05, s * 0.32); c.lineTo(s * 0.05, s * 0.8); c.closePath(); c.fill(); c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, want: failed || pos >= LEN ? null : want(), pos, rowI }), // für Testprogramme
    update(dt) {
      t += dt; shake = Math.max(0, shake - dt * 4); bolt = Math.max(0, bolt - dt * 2.5); slide = Math.max(0, slide - dt * 6);
      for (const d of drops) { d.y += d.v * dt; d.x -= d.v * 0.25 * dt; if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 100); } }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.6 && pressed.action) { died(); reset(); } return; }
      if (started) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; failed = true; failT = 0; Klang.tone(90, 0.5); return; } }
      const k = DIRN.find(d => pressed[d]);
      if (!k) return;
      started = true;
      if (k === want()) {
        Klang.tone(420 + pos * 40, 0.08); pos++;
        if (pos >= LEN) {
          rowI++; bolt = 1; boltX = 120 + Math.random() * (W - 240); Klang.tone(880, 0.15);
          if (rowI >= ROWS) { finale.start(); return; }
          row = queue; queue = mkRow(); pos = 0; slide = 1;
        }
      } else { timeLeft = Math.max(0, timeLeft - 1); shake = 1; Klang.tone(110, 0.15); }
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0b0820'); sky.addColorStop(0.55, '#231446'); sky.addColorStop(1, '#3a1d5c');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      // Wolkenbänke
      for (let i = 0; i < 9; i++) {
        const x = ((i * 97 + t * 14) % (W + 200)) - 100, y = 40 + (i % 3) * 22;
        c.fillStyle = `rgba(${70 + i * 6},${50 + i * 4},${120 + i * 5},0.55)`; c.beginPath(); c.ellipse(x, y, 110, 30, 0, 0, 7); c.fill();
      }
      if (bolt > 0) {
        c.fillStyle = `rgba(200,190,255,${bolt * 0.25})`; c.fillRect(0, 0, W, H);
        c.strokeStyle = `rgba(255,255,255,${bolt})`; c.lineWidth = 3; c.beginPath(); let x = boltX; c.moveTo(x, 50);
        for (let y = 50; y < 150; y += 20) { x += (Math.sin(y * 7.3 + boltX) * 18); c.lineTo(x, y + 20); } c.stroke();
      }
      c.strokeStyle = 'rgba(170,190,255,0.35)'; c.lineWidth = 1; c.beginPath();
      for (const d of drops) { c.moveTo(d.x, d.y); c.lineTo(d.x - 4, d.y + 14); } c.stroke();
      // aktuelle Reihe
      const gap = 78, x0 = W / 2 - (LEN - 1) * gap / 2, sx = Math.sin(t * 60) * 7 * shake, ry = 200 + slide * 70;
      row.forEach((a, i) => {
        const x = x0 + i * gap + (i === pos ? sx : 0);
        if (i < pos) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x - 30, ry - 30, 60, 60); return; }
        const cur = i === pos;
        c.save(); if (cur) { c.shadowColor = a.red ? '#ff4a5a' : '#8fe8ff'; c.shadowBlur = 22; }
        c.fillStyle = cur ? 'rgba(40,30,80,0.95)' : 'rgba(30,22,60,0.8)'; c.fillRect(x - 32, ry - 32, 64, 64); c.restore();
        c.strokeStyle = a.red ? '#ff4a5a' : cur ? '#8fe8ff' : 'rgba(143,232,255,0.4)'; c.lineWidth = cur ? 3 : 1.5; c.strokeRect(x - 32, ry - 32, 64, 64);
        arrow(c, x, ry, a.d, cur ? 22 : 18, a.red ? '#ff5a68' : cur ? '#e8fbff' : '#a9c8ff');
      });
      // nächste Reihe als Vorschau
      if (rowI + 1 < ROWS) queue.forEach((a, i) => { c.globalAlpha = 0.35; arrow(c, W / 2 - (LEN - 1) * 40 / 2 + i * 40, 300, a.d, 11, a.red ? '#ff5a68' : '#a9c8ff'); c.globalAlpha = 1; });
      label(c, `Reihe ${Math.min(rowI + 1, ROWS)} / ${ROWS}`, 16, 26, '#d8d0ff');
      label(c, started ? `${Math.ceil(timeLeft)} s` : 'Die Zeit läuft ab dem ersten Pfeil', W - 16, 26, '#d8d0ff', 'right');
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 14, W - 32, 5);
      c.fillStyle = timeLeft < 6 ? '#ff4a5a' : '#8fe8ff'; c.fillRect(16, H - 14, (W - 32) * clamp(timeLeft / TIME, 0, 1), 5);
      label(c, RED > 0 ? 'Pfeile abtippen · rote Pfeile: Gegenrichtung!' : 'Pfeile von links nach rechts abtippen', W / 2, 360, '#b8a8ff', 'center');
      if (failed) { c.fillStyle = 'rgba(11,8,32,0.9)'; c.fillRect(0, 160, W, 80); label(c, `Der Sturm war schneller: Reihe ${rowI + 1} von ${ROWS}. Leertaste: neuer Versuch`, W / 2, 205, '#ffb0c0', 'center', 13); }
      finale.draw(c, '#d8d0ff', '#231446');
    }
  };
  return self;
}
