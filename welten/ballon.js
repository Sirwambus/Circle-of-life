/* =====================================================================
   WELT – Ballon: Der Ballon steigt von allein. Lenke an Ästen und Vögeln vorbei nach oben.
   Grafik: Wachsmalstift auf Heftpapier, die Linien "zittern".
   ===================================================================== */
function makeBallon(next, level = 0) {
  // Je Level: mehr Hindernisse, dichter, mehr und schnellere Vögel, der Ballon steigt schneller.
  const COUNT = [14, 18, 22, 25, 28, 30, 32, 34, 36, 38][level], GAPY = [135, 125, 118, 112, 108, 104, 100, 97, 94, 92][level], RISE = [72, 80, 88, 94, 100, 104, 108, 112, 116, 120][level], BIRDSP = [1, 1.15, 1.3, 1.38, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7][level];
  const isBird = i => level === 0 ? i % 3 === 2 : level === 1 ? i % 2 === 1 : level < 4 ? i % 3 !== 0 : i % 4 !== 0;
  const R = rng(21 + level), TOP = -260 - COUNT * GAPY - 80;
  const obstacles = [];
  for (let i = 0; i < COUNT; i++) {
    const y = -260 - i * GAPY;
    if (isBird(i)) obstacles.push({ type: 'bird', cx: 120 + R() * 400, y, amp: 110 + R() * 90, sp: (1 + R() * 1.1) * BIRDSP, ph: R() * 6 });
    else { const len = 220 + R() * 150, left = R() < 0.5; obstacles.push({ type: 'branch', x: left ? 0 : W - len, y, w: len, h: 14, left }); }
  }
  const door = { x: 303, y: TOP, w: 34, h: 56 };
  const b = { x: 320, y: 0, vx: 0 };
  let started = false, cam = -280, t = 0, flash = 0;
  const wob = (i, k = 1.6) => Math.sin(i * 12.9898 + Math.floor(t * 6) * 3.1) * k;
  function die() { died(); flash = 0.4; Object.assign(b, { x: 320, y: 0, vx: 0 }); started = false; }
  const birdPos = o => ({ x: o.cx + Math.sin(t * o.sp + o.ph) * o.amp, y: o.y + Math.sin(t * 3 + o.ph) * 8 });
  function scribbleCircle(c, x, y, r, seed) {
    c.beginPath();
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; const rr = r + wob(seed + i, 1.4); c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  }
  const self = {
    done: false,
    door: () => ({ ...door, y: door.y - cam }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (ax || pressed.up || pressed.action) started = true;
      if (started) b.y = Math.max(TOP + 34, b.y - RISE * dt);
      b.vx += ax * 520 * dt; b.vx *= 1 - 2.2 * dt; b.x += b.vx * dt;
      if (b.x < 18 || b.x > W - 18) { b.x = clamp(b.x, 18, W - 18); b.vx *= -0.5; }
      cam += (b.y - 280 - cam) * Math.min(1, dt * 5);
      for (const o of obstacles) {
        if (o.type === 'branch') { if (circleRect(b.x, b.y, 15, o) || circleRect(b.x, b.y + 26, 7, o)) return die(); }
        else { const p = birdPos(o); if (Math.hypot(p.x - b.x, p.y - b.y) < 24) return die(); }
      }
      if (circleRect(b.x, b.y, 15, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#c9dcf0'; c.lineWidth = 1;
      const off = ((-cam) % 24 + 24) % 24;
      for (let y = off; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = '#f0a5a5'; c.beginPath(); c.moveTo(48, 0); c.lineTo(48, H); c.stroke();
      c.save(); c.translate(0, -cam); c.lineCap = 'round'; c.lineJoin = 'round';
      // Wolken
      c.strokeStyle = '#9aa7b8'; c.lineWidth = 2.5;
      for (let i = 0; i < COUNT; i++) { const y = -150 - i * 210, x = (i * 173) % 520 + 60; scribbleCircle(c, x, y, 18, i * 5); c.stroke(); scribbleCircle(c, x + 24, y + 4, 14, i * 5 + 2); c.stroke(); }
      for (const [i, o] of obstacles.entries()) {
        if (o.y - cam < -40 || o.y - cam > H + 40) continue;
        if (o.type === 'branch') {
          c.strokeStyle = '#7a4a24'; c.lineWidth = 7;
          c.beginPath(); c.moveTo(o.left ? 0 : W, o.y + 7 + wob(i)); c.lineTo(o.left ? o.w : W - o.w, o.y + 7 + wob(i + 1)); c.stroke();
          c.strokeStyle = '#2f7a3a'; c.lineWidth = 3;
          for (let k = 20; k < o.w; k += 26) { const x = o.left ? k : W - k; c.beginPath(); c.moveTo(x, o.y + 4); c.lineTo(x + 6, o.y - 6 + wob(i + k)); c.moveTo(x, o.y + 10); c.lineTo(x - 5, o.y + 20 + wob(k)); c.stroke(); }
        } else {
          const p = birdPos(o), f = Math.sin(t * 12 + i) * 8;
          c.strokeStyle = '#222'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(p.x - 16, p.y - f); c.quadraticCurveTo(p.x - 8, p.y - 6, p.x, p.y); c.quadraticCurveTo(p.x + 8, p.y - 6, p.x + 16, p.y - f); c.stroke();
        }
      }
      paintDoor(c, door, { frame: '#6b4a2a', panel: '#f2a24a', knob: '#ffffff', light: next, open: doorOpenness({ x: b.x - 10, y: b.y - 10, w: 20, h: 20 }, door, 140) });
      c.strokeStyle = '#9aa7b8'; c.lineWidth = 2.5; scribbleCircle(c, door.x + 4, door.y + door.h + 8, 18, 77); c.stroke(); scribbleCircle(c, door.x + 32, door.y + door.h + 8, 16, 79); c.stroke();
      // Ballon
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(b.x - 8, b.y + 12); c.lineTo(b.x - 5, b.y + 22); c.moveTo(b.x + 8, b.y + 12); c.lineTo(b.x + 5, b.y + 22); c.stroke();
      c.fillStyle = 'rgba(232,71,63,0.75)'; scribbleCircle(c, b.x, b.y, 16, 3); c.fill();
      c.strokeStyle = '#b52d27'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(b.x - 5, b.y - 5, 6, Math.PI, Math.PI * 1.5); c.stroke();
      c.fillStyle = '#c08a4a'; c.fillRect(b.x - 7, b.y + 22, 14, 10);
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.strokeRect(b.x - 7 + wob(9, 0.6), b.y + 22, 14, 10);
      c.restore();
      label(c, `Höhe ${Math.max(0, Math.round(-b.y / 10))} m von ${Math.round(-TOP / 10)} m`, 60, 26, '#3a4a6a');
      if (!started) label(c, '← → lenken, der Ballon steigt los', W / 2, 360, '#3a4a6a', 'center');
      flashOverlay(c, flash);
    }
  };
  return self;
}
