/* =====================================================================
   WELT – Schiebepuzzle: Setz das Bild wieder zusammen. Es zeigt die Tür, durch die du gehst.
   ===================================================================== */
function makeSchiebepuzzle(next, level = 0) {
  // Level 1: 3×3 leicht gemischt, Level 2: 3×3 stark gemischt, Level 3: 4×4 (15 Kacheln)
  const N = [3, 3, 4, 4, 5, 5, 5, 6, 6, 6][level], T = { 3: 110, 4: 82, 5: 64, 6: 52 }[N], G = 4, X0 = 70, Y0 = 31, BLANK = N * N - 1, SRC = 660 / N;
  // Bild einmal auf ein eigenes Canvas malen und dann in Kacheln schneiden
  const img = document.createElement('canvas'); img.width = img.height = 660;
  const g = img.getContext('2d'); g.scale(2, 2);
  const sky = g.createLinearGradient(0, 0, 0, 330); sky.addColorStop(0, '#9fd3f0'); sky.addColorStop(1, '#f6d7a7');
  g.fillStyle = sky; g.fillRect(0, 0, 330, 330);
  g.fillStyle = '#b5523b'; g.fillRect(30, 60, 270, 270);
  g.fillStyle = '#9c4430'; for (let y = 60; y < 330; y += 18) for (let x = 30 + ((y / 18) % 2) * 18; x < 300; x += 36) g.fillRect(x, y, 34, 16);
  g.fillStyle = '#5c3a21'; g.beginPath(); g.moveTo(105, 330); g.lineTo(105, 150); g.arc(165, 150, 60, Math.PI, 0); g.lineTo(225, 330); g.fill();
  g.fillStyle = next; g.beginPath(); g.moveTo(115, 330); g.lineTo(115, 152); g.arc(165, 152, 50, Math.PI, 0); g.lineTo(215, 330); g.fill();
  g.fillStyle = '#8a5a34'; g.fillRect(115, 160, 60, 170);
  g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(165, 250, 5, 0, 7); g.fill();
  g.fillStyle = '#3c7a3c'; for (const [x, r] of [[40, 30], [75, 22], [262, 28], [295, 20]]) { g.beginPath(); g.arc(x, 320, r, Math.PI, 0); g.fill(); }
  g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(270, 40, 18, 0, 7); g.fill();

  let tiles = Array.from({ length: N * N }, (_, i) => i); // BLANK = Lücke
  const R = rng(17 + level);
  let last = -1;
  for (let k = 0; k < [40, 90, 120, 200, 260, 300, 340, 380, 420, 480][level]; k++) {
    const b = tiles.indexOf(BLANK), bx = b % N, by = Math.floor(b / N);
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [bx + dx, by + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N && y * N + x !== last);
    const [x, y] = opts[Math.floor(R() * opts.length)];
    last = b; tiles[b] = tiles[y * N + x]; tiles[y * N + x] = BLANK;
  }
  const vis = tiles.map((v, i) => ({ x: i % N, y: Math.floor(i / N) }));
  let moves = 0, solvedT = -1, t = 0;
  const visOf = v => vis[v];
  const self = {
    done: false,
    door: () => ({ x: X0 + 105, y: Y0 + 150, w: 120, h: 180 }),
    update(dt) {
      t += dt;
      tiles.forEach((v, i) => { const tv = visOf(v); tv.x += (i % N - tv.x) * Math.min(1, dt * 18); tv.y += (Math.floor(i / N) - tv.y) * Math.min(1, dt * 18); });
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 1.2 && (pressed.action || solvedT > 2.4)) self.done = true; return; }
      const d = dirOf(pressed);
      if (!d) return;
      // Pfeil = Richtung, in die eine Kachel in die Lücke rutscht
      const b = tiles.indexOf(BLANK), bx = b % N, by = Math.floor(b / N), sx = bx - d[0], sy = by - d[1];
      if (sx < 0 || sy < 0 || sx >= N || sy >= N) return;
      tiles[b] = tiles[sy * N + sx]; tiles[sy * N + sx] = BLANK; moves++;
      if (tiles.every((v, i) => v === i)) solvedT = 0;
    },
    draw(c) {
      c.fillStyle = '#3b2414'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#7a4a26'; c.fillRect(X0 - 16, Y0 - 16, N * T + 2 * G + 32, N * T + 2 * G + 32);
      c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1;
      for (let y = Y0 - 12; y < Y0 + N * T + 20; y += 7) { c.beginPath(); c.moveTo(X0 - 16, y); c.bezierCurveTo(X0 + 100, y + 4, X0 + 200, y - 4, X0 + N * T + 24, y + 2); c.stroke(); }
      c.fillStyle = '#2a190d'; c.fillRect(X0 - 4, Y0 - 4, N * T + 2 * G + 8, N * T + 2 * G + 8);
      tiles.forEach(v => {
        if (v === BLANK && solvedT < 0) return;
        const tv = visOf(v), x = X0 + tv.x * (T + G), y = Y0 + tv.y * (T + G);
        c.drawImage(img, (v % N) * SRC, Math.floor(v / N) * SRC, SRC, SRC, x, y, T, T);
        if (solvedT < 0) {
          c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, T, 3); c.fillRect(x, y, 3, T);
          c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, y + T - 3, T, 3); c.fillRect(x + T - 3, y, 3, T);
        }
      });
      // Vorlage
      const px = 450, py = 60;
      c.fillStyle = '#7a4a26'; c.fillRect(px - 8, py - 8, 146, 146);
      c.drawImage(img, px, py, 130, 130);
      label(c, 'Vorlage', px + 65, py + 160, '#e8c9a0', 'center');
      label(c, `Züge ${moves}`, px + 65, py + 190, '#e8c9a0', 'center', 16);
      label(c, solvedT >= 0 ? 'Fertig!' : 'Pfeile schieben Kacheln', px + 65, py + 216, '#b08a60', 'center');
      if (solvedT >= 0) { c.save(); c.globalAlpha = clamp(solvedT, 0, 1) * 0.35; c.fillStyle = next; c.fillRect(X0 + 115, Y0 + 100, 100, 230); c.restore(); }
    }
  };
  return self;
}
