/* =====================================================================
   WELT – Lichter: Jeder Schalter kippt sich selbst und seine vier Nachbarn.
   Sind alle Lichter aus, geht das Licht hinter der Tür an.
   ===================================================================== */
function makeLichter(next, level = 0) {
  // Level 1: 5×5, 6 Startzüge. Level 2: 5×5, 9 Startzüge. Level 3: 6×6, 12 Startzüge.
  const N = [5, 5, 6, 6, 7, 7, 7, 8, 8, 8][level], S = { 5: 56, 6: 46, 7: 38, 8: 32 }[N], G = N === 5 ? 8 : 7, X0 = 96, Y0 = 44, PRESSES = [6, 9, 12, 16, 20, 22, 25, 28, 32, 36][level];
  const R = rng(42 + level), start = Array(N * N).fill(false);
  const toggle = (b, x, y) => { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) b[ny * N + nx] = !b[ny * N + nx]; } };
  const picks = new Set(); while (picks.size < PRESSES) picks.add(Math.floor(R() * N * N));
  for (const i of picks) toggle(start, i % N, Math.floor(i / N));
  // Jeder Schalter zweimal gedrückt hebt sich auf. Die Lösung sind also genau die Startfelder,
  // die noch nicht (oder doppelt) gedrückt wurden. Daraus wird der Tipp berechnet.
  const odd = Array(N * N).fill(false), HINT_AFTER = 8;
  const hintCell = () => { for (let i = 0; i < N * N; i++) if (picks.has(i) !== odd[i]) return i; return -1; };
  let board = start.slice(), cur = { x: 2, y: 2 }, moves = 0, solvedT = -1, t = 0;
  const rep = makeRepeater();
  const door = { x: 470, y: 120, w: 70, h: 130 };
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt;
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 1.4) self.done = true; return; }
      const d = rep(dt);
      if (d) { cur.x = clamp(cur.x + d[0], 0, N - 1); cur.y = clamp(cur.y + d[1], 0, N - 1); }
      if (pressed.action) { toggle(board, cur.x, cur.y); odd[cur.y * N + cur.x] = !odd[cur.y * N + cur.x]; moves++; if (board.every(v => !v)) solvedT = 0; }
    },
    draw(c) {
      c.fillStyle = '#0e0d0b'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(212,175,55,0.15)'; c.lineWidth = 1;
      for (let i = 0; i < 24; i++) { const a = Math.PI + i / 23 * Math.PI; c.beginPath(); c.moveTo(W / 2, H + 40); c.lineTo(W / 2 + Math.cos(a) * 700, H + 40 + Math.sin(a) * 700); c.stroke(); }
      const gold = '#d4af37';
      c.strokeStyle = gold; c.lineWidth = 2;
      const bw = N * S + (N - 1) * G;
      c.strokeRect(X0 - 14, Y0 - 14, bw + 28, bw + 28); c.strokeRect(X0 - 8, Y0 - 8, bw + 16, bw + 16);
      for (const [x, y] of [[X0 - 14, Y0 - 14], [X0 + bw + 14, Y0 - 14], [X0 - 14, Y0 + bw + 14], [X0 + bw + 14, Y0 + bw + 14]]) { c.fillStyle = gold; c.fillRect(x - 5, y - 5, 10, 10); }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const on = board[y * N + x], cx = X0 + x * (S + G) + S / 2, cy = Y0 + y * (S + G) + S / 2;
        c.fillStyle = '#1a1813'; c.fillRect(cx - S / 2, cy - S / 2, S, S);
        c.strokeStyle = 'rgba(212,175,55,0.5)'; c.strokeRect(cx - S / 2 + 0.5, cy - S / 2 + 0.5, S - 1, S - 1);
        if (on) {
          c.save(); c.shadowColor = '#ffcf6b'; c.shadowBlur = 24; c.fillStyle = '#ffd36b';
          c.beginPath(); c.arc(cx, cy, 15, 0, 7); c.fill(); c.restore();
          c.fillStyle = '#fff6d6'; c.beginPath(); c.arc(cx - 4, cy - 4, 5, 0, 7); c.fill();
        } else { c.fillStyle = '#2a2620'; c.beginPath(); c.arc(cx, cy, 15, 0, 7); c.fill(); c.strokeStyle = 'rgba(212,175,55,0.6)'; c.stroke(); }
        if (x === cur.x && y === cur.y && solvedT < 0) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(cx - S / 2 - 3, cy - S / 2 - 3, S + 6, S + 6); c.lineWidth = 2; }
      }
      // Art-déco-Tür mit Sonnenfächer
      const lit = solvedT >= 0 ? clamp(solvedT / 0.8, 0, 1) : 0;
      paintDoor(c, door, { frame: gold, panel: '#1a1813', knob: gold, light: lit > 0 ? next : '#0e0d0b', glow: lit > 0 ? '#ffd36b' : null, open: lit * 0.8 });
      c.strokeStyle = gold; c.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI; c.beginPath(); c.moveTo(door.x + door.w / 2, door.y - 4); c.lineTo(door.x + door.w / 2 + Math.cos(a) * 30, door.y - 4 + Math.sin(a) * 30); c.stroke(); }
      label(c, `Züge ${moves}`, door.x + door.w / 2, door.y + door.h + 34, gold, 'center');
      label(c, `Lichter an: ${board.filter(Boolean).length}`, door.x + door.w / 2, door.y + door.h + 54, '#a08a40', 'center');
      const h = hintCell();
      if (solvedT < 0 && h >= 0) {
        if (moves >= HINT_AFTER) {
          const hx = X0 + (h % N) * (S + G) + S / 2, hy = Y0 + Math.floor(h / N) * (S + G) + S / 2;
          c.save(); c.strokeStyle = '#7cf0ff'; c.lineWidth = 2; c.setLineDash([4, 4]); c.lineDashOffset = -t * 20;
          c.beginPath(); c.arc(hx, hy, 24 + Math.sin(t * 5) * 2, 0, 7); c.stroke(); c.restore();
          label(c, 'Tipp: das blau markierte Feld', X0 + bw / 2, Y0 + bw + 34, '#7cf0ff', 'center');
        } else label(c, `Nach ${HINT_AFTER} Zügen gibt es einen Tipp · R setzt zurück`, X0 + bw / 2, Y0 + bw + 34, '#a08a40', 'center');
      }
    }
  };
  return self;
}
