/* =====================================================================
   WELT – Ausbrechen: Breakout. Hinter der Steinmauer wartet die Tür. Triff sie mit dem Ball.
   ===================================================================== */
function makeAusbrechen(next, level = 0) {
  // Level 2: sieben Reihen, die oberen zwei brauchen zwei Treffer. Level 3: dazu eine Stahlreihe mit zwei Lücken.
  const COLS = ['#ff4d2e', '#ff8a1f', '#ffc21a', '#7ed957', '#36c3ff', '#a77bff', '#ff6fb5'];
  const ROWS = level === 0 ? 5 : 7, TOUGH = [0, 2, 2, 4, 7, 7, 7, 7, 7, 7][level]; // Reihen mit zwei Treffern
  const GAPS = [[], [], [2, 9], [5], [6], [3, 8], [4], [7], [2], [9]][level], HARD = [0, 0, 0, 0, 0, 2, 3, 4, 5, 7][level]; // Reihen mit drei Treffern
  const bricks = [];
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < 12; k++) bricks.push({ x: 20 + k * 50, y: 96 + r * 18, w: 48, h: 16, r: r % COLS.length, hp: r < HARD ? 3 : r < TOUGH ? 2 : 1, alive: true });
  if (GAPS.length) for (let k = 0; k < 12; k++) if (!GAPS.includes(k)) bricks.push({ x: 20 + k * 50, y: 84, w: 48, h: 10, r: 0, steel: true, alive: true });
  const door = { x: 296, y: 18, w: 48, h: 62 };
  const pad = { x: 280, y: 366, w: [84, 74, 66, 62, 58, 56, 54, 52, 50, 48][level], h: 10 };
  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 6, stuck: true };
  const SPEED = [340, 375, 405, 425, 440, 455, 470, 480, 490, 500][level];
  let score = 0, lost = 0, t = 0, flash = 0;
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      pad.x = clamp(pad.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 430 * dt, 8, W - 8 - pad.w);
      if (ball.stuck) {
        ball.x = pad.x + pad.w / 2; ball.y = pad.y - ball.r - 1;
        if (pressed.action || pressed.up) { ball.stuck = false; const a = (Math.random() - 0.5) * 0.8; ball.vx = Math.sin(a) * SPEED; ball.vy = -Math.cos(a) * SPEED; }
        return;
      }
      const N = 4;
      for (let s = 0; s < N; s++) {
        const px = ball.x, py = ball.y;
        ball.x += ball.vx * dt / N; ball.y += ball.vy * dt / N;
        if (ball.x < ball.r + 8) { ball.x = ball.r + 8; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - 8 - ball.r) { ball.x = W - 8 - ball.r; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < ball.r + 8) { ball.y = ball.r + 8; ball.vy = Math.abs(ball.vy); }
        if (ball.y > H + 20) { died(); lost++; flash = 0.4; ball.stuck = true; return; }
        if (ball.vy > 0 && circleRect(ball.x, ball.y, ball.r, pad)) {
          const off = clamp((ball.x - (pad.x + pad.w / 2)) / (pad.w / 2), -1, 1), a = off * 1.05;
          ball.vx = Math.sin(a) * SPEED; ball.vy = -Math.cos(a) * SPEED;
        }
        for (const b of bricks) {
          if (!b.alive || !circleRect(ball.x, ball.y, ball.r, b)) continue;
          if (!b.steel && --b.hp <= 0) { b.alive = false; score += 10 * (7 - b.r); }
          if (px > b.x - ball.r && px < b.x + b.w + ball.r) ball.vy = -ball.vy; else ball.vx = -ball.vx;
          break;
        }
        if (circleRect(ball.x, ball.y, ball.r, door)) { self.done = true; return; }
      }
    },
    draw(c) {
      c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#2a2a33'; c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H); c.fillRect(0, 0, W, 8);
      paintDoor(c, door, { frame: '#ffb347', panel: '#3a2210', knob: '#ffd27a', light: next, glow: '#ff8a1f', open: clamp(1 - (ball.y - 80) / 160, 0, 1) });
      for (const b of bricks) {
        if (!b.alive) continue;
        if (b.steel) { c.fillStyle = '#8b93a3'; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = '#c9d0dc'; c.fillRect(b.x, b.y, b.w, 2); c.fillStyle = '#5b6273'; for (const rx of [6, b.w - 8]) c.fillRect(b.x + rx, b.y + 4, 2, 2); continue; }
        c.fillStyle = COLS[b.r]; c.fillRect(b.x, b.y, b.w, b.h);
        if (b.hp > 1) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8); }
        if (b.hp > 2) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(b.x + b.w / 2 - 2, b.y + 5, 4, b.h - 10); }
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(b.x, b.y, b.w, 3);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(b.x, b.y + b.h - 3, b.w, 3);
      }
      c.fillStyle = '#e8e8f0'; c.fillRect(pad.x, pad.y, pad.w, pad.h);
      c.fillStyle = '#ff8a1f'; c.fillRect(pad.x, pad.y, 8, pad.h); c.fillRect(pad.x + pad.w - 8, pad.y, 8, pad.h);
      c.save(); c.shadowColor = '#fff'; c.shadowBlur = 10; c.fillStyle = '#fff'; c.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2); c.restore();
      label(c, String(score).padStart(5, '0'), 20, 34, '#ffb347', 'left', 20);
      label(c, `Bälle verloren ${lost}`, W - 20, 30, '#ffb347', 'right');
      if (ball.stuck) label(c, 'Leertaste / ↑: Ball abschießen', W / 2, 330, '#ffd27a', 'center');
      c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
      flashOverlay(c, flash);
    }
  };
  return self;
}
