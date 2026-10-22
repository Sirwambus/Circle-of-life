/* =====================================================================
   WELT – Mondlandung: Setz die Fähre sanft auf der Landefläche auf, dort steht die Tür.
   ↑ Hauptdüse, ← → Seitendüsen. Treibstoff ist knapp, später Wind und Berge.
   ===================================================================== */
function makeMondlandung(next, level = 0) {
  // Je Level: schmalere Landefläche, weniger Treibstoff, strengeres Tempolimit, mehr Wind, höhere Berge; ab Level 6 ein Tal.
  const PADW = [150, 130, 115, 102, 92, 84, 76, 70, 64, 60][level], FUEL = [30, 27, 25, 23, 21, 20, 19, 18, 17, 16][level];
  const VMAX = [70, 64, 58, 54, 50, 47, 45, 43, 41, 40][level], WIND = [0, 0, 0, 5, 7, 9, 11, 13, 15, 17][level];
  const MH = [0, 50, 80, 105, 125, 145, 160, 175, 190, 205][level], NM = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3][level], VAL = [0, 0, 0, 0, 0, 0, 55, 75, 95, 115][level];
  const G = 32, THRUST = 86, SIDE = 42, R = rng(31 + level * 7);
  const padC = 440 + level * 10, x0 = Math.round(padC - PADW / 2), x1 = Math.round(padC + PADW / 2) + 26;
  // Gelände als Höhenliste alle 4 px
  const ground = [], bump = (x, c, w, h) => Math.abs(x - c) < w ? h * Math.cos((x - c) / w * Math.PI / 2) ** 2 : 0;
  const mounts = Array.from({ length: NM }, (_, i) => ({ c: 170 + (i + 0.5) * (x0 - 240) / NM + (R() - 0.5) * 30, w: 45 + R() * 30, h: MH * (0.75 + R() * 0.25) }));
  const ph1 = R() * 6, ph2 = R() * 6;
  for (let x = 0; x <= W; x += 4) {
    let y = 350 + Math.sin(x * 0.03 + ph1) * 8 + Math.sin(x * 0.011 + ph2) * 10;
    for (const m of mounts) y -= bump(x, m.c, m.w, m.h);
    if (VAL) y -= bump(x, x0 - 34, 40, VAL) + bump(x, x1 + 34, 40, VAL * 0.8);
    ground.push(y);
  }
  let padY = 0; for (let x = x0; x <= x1; x += 4) padY = Math.max(padY, ground[x / 4 | 0]);
  padY = Math.min(padY, 352);
  for (let i = 0; i < ground.length; i++) if (i * 4 >= x0 - 2 && i * 4 <= x1 + 2) ground[i] = padY;
  const gy = x => { const i = clamp(x / 4, 0, ground.length - 1.001), a = Math.floor(i); return ground[a] + (ground[a + 1] - ground[a]) * (i - a); };
  const door = { x: x1 - 24, y: padY - 40, w: 20, h: 40 };
  const stars = Array.from({ length: 80 }, () => ({ x: R() * W, y: R() * 300, s: R() < 0.2 ? 1.6 : 0.8 }));
  const craters = Array.from({ length: 14 }, () => ({ x: R() * W, r: 4 + R() * 9 }));
  const windDir = R() < 0.5 ? -1 : 1;
  let s, fuel, state, timer, t = 0, wind = 0, msg = '', flash = 0, walk = 0, parts = [];
  function reset() { s = { x: 70, y: 50, vx: 25, vy: 0, tilt: 0 }; fuel = FUEL; state = 'fly'; timer = 0; walk = 0; parts = []; }
  reset();
  const feet = () => [[s.x - 13, s.y + 13], [s.x + 13, s.y + 13], [s.x - 10, s.y - 10], [s.x + 10, s.y - 10], [s.x, s.y + 6]];
  const self = {
    done: false, door: () => door,
    test: () => ({ x: s.x, y: s.y, vx: s.vx, vy: s.vy, fuel, state, zone: [x0, x1], padY, vmax: VMAX, gy }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += G * dt; p.life -= dt; }
      parts = parts.filter(p => p.life > 0);
      if (state === 'landed') { // Astronaut geht zur Tür
        walk += dt * 26; if (s.x + 8 + walk >= door.x + 6) self.done = true; return;
      }
      if (state === 'crash') { timer -= dt; if (timer <= 0) { died(); reset(); } return; }
      wind = WIND * windDir * (0.7 + 0.5 * Math.sin(t * 0.7) + 0.25 * Math.sin(t * 2.3));
      const up = keys.up && fuel > 0, side = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * (fuel > 0 ? 1 : 0);
      s.vy += (G - (up ? THRUST : 0)) * dt; s.vx += (side * SIDE + wind) * dt;
      fuel = Math.max(0, fuel - ((up ? 1 : 0) + Math.abs(side) * 0.5) * dt);
      s.tilt += (side * 0.25 - s.tilt) * Math.min(1, dt * 6);
      if (up && Math.random() < 0.8) parts.push({ x: s.x + (Math.random() - 0.5) * 6, y: s.y + 14, vx: (Math.random() - 0.5) * 30, vy: 90 + Math.random() * 40, life: 0.35, flame: 1 });
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 14 || s.x > W - 14) { s.x = clamp(s.x, 14, W - 14); s.vx = 0; }
      if (s.y < 16) { s.y = 16; s.vy = Math.max(0, s.vy); }
      if (feet().some(([px, py]) => py >= gy(px))) {
        const onPad = s.x - 13 >= x0 && s.x + 13 <= x1 && Math.abs(gy(s.x) - padY) < 1;
        if (onPad && s.vy <= VMAX && Math.abs(s.vx) <= VMAX * 0.6) {
          state = 'landed'; s.y = padY - 13; s.vx = s.vy = 0; s.tilt = 0; Klang.tone(660, 0.2);
        } else {
          state = 'crash'; timer = 1.5; flash = 0.5;
          msg = !onPad ? 'Bruchlandung! Daneben.' : s.vy > VMAX ? 'Bruchlandung! Zu schnell gesunken.' : 'Bruchlandung! Zu viel Seitentempo.';
          for (let i = 0; i < 30; i++) { const a = Math.random() * 7, v = 30 + Math.random() * 90; parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 1.2 }); }
        }
      }
    },
    draw(c) {
      c.fillStyle = '#05040c'; c.fillRect(0, 0, W, H);
      for (const st of stars) { c.fillStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 2 + st.x)})`; c.fillRect(st.x, st.y, st.s, st.s); }
      // Erde am Himmel
      c.fillStyle = '#2a6fd6'; c.beginPath(); c.arc(560, 70, 26, 0, 7); c.fill();
      c.fillStyle = '#4fbf6a'; c.beginPath(); c.ellipse(552, 62, 9, 6, 0.5, 0, 7); c.ellipse(570, 80, 7, 4, -0.3, 0, 7); c.fill();
      c.fillStyle = 'rgba(5,4,12,0.55)'; c.beginPath(); c.arc(572, 70, 26, -1.2, 1.2); c.fill();
      // Gelände
      const gr = c.createLinearGradient(0, 150, 0, H); gr.addColorStop(0, '#a9a6b8'); gr.addColorStop(1, '#4a4858');
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, H);
      for (let i = 0; i < ground.length; i++) c.lineTo(i * 4, ground[i]);
      c.lineTo(W, H); c.fill();
      c.strokeStyle = '#d8d6e6'; c.lineWidth = 1.5; c.beginPath();
      for (let i = 0; i < ground.length; i++) c.lineTo(i * 4, ground[i]); c.stroke();
      c.fillStyle = 'rgba(40,38,52,0.5)';
      for (const k of craters) if (k.x < x0 - 10 || k.x > x1 + 10) { c.beginPath(); c.ellipse(k.x, gy(k.x) + 10 + k.r, k.r * 1.6, k.r * 0.5, 0, 0, 7); c.fill(); }
      // Landefläche mit Lichtern und Tür
      c.fillStyle = '#3c3a48'; c.fillRect(x0, padY, x1 - x0, 6);
      for (let x = x0 + 4; x < x1; x += 12) { c.fillStyle = (Math.floor(t * 4) + x / 12 | 0) % 3 ? '#5a5866' : next; c.fillRect(x, padY + 1, 5, 3); }
      paintDoor(c, door, { frame: '#d8d6e6', panel: '#6a6880', knob: next, light: next, glow: next, open: state === 'landed' ? clamp(0.3 + walk / 30, 0, 1) : 0.1 });
      // Fähre
      if (state !== 'crash') {
        if (state === 'landed') { // Astronaut
          const ax = s.x + 8 + walk;
          c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ax, padY - 11, 4, 0, 7); c.fill(); c.fillRect(ax - 3, padY - 8, 6, 6);
          c.fillRect(ax - 3 + Math.sin(walk) * 2, padY - 2, 2, 2); c.fillRect(ax + 1 - Math.sin(walk) * 2, padY - 2, 2, 2);
        }
        c.save(); c.translate(s.x, s.y); c.rotate(s.tilt);
        c.strokeStyle = '#c9c6d8'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, 4); c.lineTo(-13, 13); c.moveTo(8, 4); c.lineTo(13, 13); c.stroke();
        c.fillStyle = '#c9c6d8'; c.fillRect(-16, 12, 6, 2); c.fillRect(10, 12, 6, 2);
        c.fillStyle = '#d9a43a'; c.fillRect(-10, -2, 20, 9);
        c.fillStyle = '#e8e6f2'; c.beginPath(); c.moveTo(-8, -2); c.lineTo(-6, -12); c.lineTo(6, -12); c.lineTo(8, -2); c.fill();
        c.fillStyle = '#1a2a50'; c.fillRect(-3, -10, 6, 4);
        if (keys.left && fuel > 0 && state === 'fly') { c.fillStyle = '#ffd27a'; c.fillRect(10, 0, 6, 2); }
        if (keys.right && fuel > 0 && state === 'fly') { c.fillStyle = '#ffd27a'; c.fillRect(-16, 0, 6, 2); }
        c.restore();
      }
      for (const p of parts) { c.fillStyle = p.flame ? `rgba(255,${150 + p.life * 300 | 0},80,${p.life * 2.5})` : `rgba(220,215,235,${p.life})`; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
      // Anzeigen
      label(c, 'Treibstoff', 16, 24, '#d8d6e6');
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(100, 15, 110, 10);
      c.fillStyle = fuel / FUEL < 0.25 ? '#ff5a4a' : '#ffd23f'; c.fillRect(100, 15, 110 * fuel / FUEL, 10);
      const ok = s.vy <= VMAX;
      label(c, `Sinken ${Math.max(0, Math.round(s.vy))} / ${VMAX}`, 16, 44, ok ? '#7dff9a' : '#ff6a5a');
      if (WIND) label(c, (windDir > 0 ? 'Wind →' : '← Wind'), 16, 62, 'rgba(216,214,230,0.8)');
      label(c, state === 'crash' ? msg : state === 'landed' ? 'Gelandet! Auf zur Tür.' : fuel <= 0 ? 'Treibstoff leer!' : '↑ Hauptdüse · ← → Seitendüsen · sanft auf der Fläche landen', W / 2, H - 14, '#ffffff', 'center');
      flashOverlay(c, flash, '255,140,60');
    }
  };
  return self;
}
