/* =====================================================================
   WELT – Schlange: Snake auf dem Gameboy-Bildschirm. Erst satt, dann Tür.
   ===================================================================== */
function makeSchlange(next, level = 0) {
  // Je Level: mehr Äpfel, mehr Mauern, höheres Grundtempo. Reihe 6 bleibt frei (Start und Tür).
  const S = 32, CW = 20, CH = 12, GOAL = [6, 10, 14, 18, 22, 24, 26, 28, 30, 32][level], BASE = [0.16, 0.14, 0.13, 0.12, 0.11, 0.105, 0.1, 0.095, 0.09, 0.085][level];
  const LCD = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
  const line = (x0, y0, x1, y1) => { const out = []; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([x, y]); return out; };
  const blocks = [
    [[6, 3], [6, 4], [13, 7], [13, 8], [9, 9], [10, 2]],
    [[6, 3], [6, 4], [13, 7], [13, 8], [9, 9], [10, 2], [4, 9], [5, 9], [15, 3], [16, 3], [11, 4], [11, 5]],
    [...line(4, 3, 8, 3), ...line(11, 8, 15, 8), ...line(16, 2, 16, 4), ...line(3, 8, 3, 10), ...line(9, 4, 9, 5), [13, 2], [6, 9], [17, 9]],
    [...line(3, 2, 3, 4), ...line(7, 8, 12, 8), ...line(15, 2, 15, 4), ...line(5, 9, 5, 10), ...line(14, 8, 14, 10), ...line(9, 2, 12, 2), [8, 4], [11, 4], [17, 8]],
    [...line(2, 2, 6, 2), ...line(9, 3, 9, 5), ...line(13, 2, 17, 2), ...line(2, 9, 6, 9), ...line(13, 9, 17, 9), ...line(9, 7, 9, 9), [4, 4], [15, 4], [6, 8], [12, 4], [12, 8]]
  ][Math.min(level, 4)];
  const doorCell = { x: 19, y: 6 };
  let snake, dir, queue, tick, eaten, apple, started, flash = 0;
  const isBlock = (x, y) => blocks.some(b => b[0] === x && b[1] === y);
  const isDoor = (x, y) => x === doorCell.x && y === doorCell.y;
  const wallAt = (x, y) => x <= 0 || y <= 0 || x >= CW - 1 || y >= CH - 1 || isBlock(x, y);
  function place() {
    for (;;) {
      const x = 1 + Math.floor(Math.random() * (CW - 2)), y = 1 + Math.floor(Math.random() * (CH - 2));
      if (!isBlock(x, y) && !snake.some(s => s.x === x && s.y === y)) return { x, y };
    }
  }
  function reset() {
    snake = [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }];
    dir = [1, 0]; queue = []; tick = 0; eaten = 0; started = false; apple = place();
  }
  reset();
  function step() {
    if (queue.length) { const q = queue.shift(); if (q[0] !== -dir[0] || q[1] !== -dir[1]) dir = q; }
    const h = { x: snake[0].x + dir[0], y: snake[0].y + dir[1] };
    if (eaten >= GOAL && isDoor(h.x, h.y)) { snake.unshift(h); snake.pop(); self.done = true; return; }
    if (wallAt(h.x, h.y) || snake.some((s, i) => i < snake.length - 1 && s.x === h.x && s.y === h.y)) { died(); flash = 0.4; reset(); return; }
    snake.unshift(h);
    if (apple && h.x === apple.x && h.y === apple.y) { eaten++; apple = eaten < GOAL ? place() : null; }
    else snake.pop();
  }
  const self = {
    done: false,
    door: () => ({ x: doorCell.x * S + 4, y: doorCell.y * S + 1, w: S - 8, h: S - 1 }),
    update(dt) {
      flash = Math.max(0, flash - dt);
      const turn = pressed.up ? [0, -1] : pressed.down ? [0, 1] : pressed.left ? [-1, 0] : pressed.right ? [1, 0] : null;
      if (turn) { if (!started && turn[0] === -1) turn[0] = 1; started = true; if (queue.length < 2) queue.push(turn); }
      if (!started) return;
      tick += dt;
      const iv = Math.max(level >= 5 ? 0.062 : level >= 3 ? 0.07 : 0.075, BASE - eaten * 0.005);
      while (tick >= iv && !self.done && started) { tick -= iv; step(); }
    },
    draw(c) {
      c.fillStyle = LCD[3]; c.fillRect(0, 0, W, H);
      c.fillStyle = LCD[2];
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) c.fillRect(x * S + 15, y * S + 15, 2, 2);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        if (!wallAt(x, y) || isDoor(x, y)) continue;
        c.fillStyle = LCD[1]; c.fillRect(x * S, y * S, S, S);
        c.fillStyle = LCD[0]; c.fillRect(x * S, y * S + 15, S, 2); c.fillRect(x * S + (y % 2 ? 8 : 22), y * S, 2, 15); c.fillRect(x * S + (y % 2 ? 22 : 8), y * S + 17, 2, 15);
      }
      const open = eaten >= GOAL;
      const dr = self.door();
      c.fillStyle = LCD[1]; c.fillRect(doorCell.x * S, doorCell.y * S, S, S);
      paintDoor(c, dr, { frame: LCD[0], panel: open ? LCD[2] : LCD[1], knob: LCD[3], light: open ? next : LCD[0],
        open: open ? doorOpenness({ x: snake[0].x * S, y: snake[0].y * S, w: S, h: S }, dr, 140) : 0 });
      if (apple) {
        const ax = apple.x * S + 16, ay = apple.y * S + 17;
        c.fillStyle = LCD[0]; c.beginPath(); c.arc(ax, ay, 9, 0, 7); c.fill();
        c.fillStyle = LCD[2]; c.fillRect(ax - 4, ay - 5, 3, 3);
        c.fillStyle = LCD[1]; c.fillRect(ax, ay - 14, 2, 6); c.fillRect(ax + 2, ay - 13, 5, 3);
      }
      snake.forEach((s, i) => {
        c.fillStyle = i === 0 ? LCD[0] : i % 2 ? LCD[1] : LCD[0];
        c.fillRect(s.x * S + 3, s.y * S + 3, S - 6, S - 6);
      });
      const h = snake[0];
      c.fillStyle = LCD[3];
      const ex = dir[1] !== 0 ? 6 : 0, ey = dir[0] !== 0 ? 6 : 0;
      for (const sg of [-1, 1]) c.fillRect(h.x * S + 14 + dir[0] * 6 + ex * sg, h.y * S + 14 + dir[1] * 6 + ey * sg, 4, 4);
      c.fillStyle = 'rgba(15,56,15,0.07)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
      c.fillStyle = LCD[0]; c.font = '600 12px "IBM Plex Mono", monospace'; c.textAlign = 'left';
      const msg = !started ? 'Drück eine Richtung zum Losfahren' : open ? 'Satt! Die Tür ist offen' : '';
      c.fillText(`ÄPFEL ${eaten}/${GOAL}    ${msg}`, 8, 395);
      if (flash > 0) { c.fillStyle = `rgba(15,56,15,${flash})`; c.fillRect(0, 0, W, H); }
    }
  };
  return self;
}
