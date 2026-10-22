/* =====================================================================
   WELT – Zeitschleife: Jede Runde dauert ein paar Sekunden. Danach spult das Band zurück
   und ein Klon wiederholt genau, was du getan hast. Platten öffnen Durchgänge nur,
   solange jemand darauf steht. Grafik: VHS-Kassette.
   ===================================================================== */
function makeZeitschleife(next, level = 0) {
  const B = 16, STEP = 0.05;
  const wall = (x, y, w, h) => ({ x, y, w, h });
  const gate = (x, y, w, h, pl, inv) => ({ x, y, w, h, pl, inv }); // Gitter einer anderen Platte (pl), inv = umgekehrt
  // Gitter öffnen sich, solange jemand auf ihrer Platte steht. Die letzte Platte öffnet die Tür.
  // Level 1: 2 Platten, Level 2: 3 Platten, Level 3: 3 Platten, weitere Wege, kürzere Runde.
  // (Lösbarkeit mit einem Bot geprüft, der die Runden nacheinander abläuft.)
  const LV = [
    { loop: 8, start: { x: 52, y: 330 }, door: { x: 584, y: 40, w: 32, h: 56 },
      walls: [wall(300, B, 16, 184), wall(300, 300, 16, H - 300 - B), wall(316, 180, 180, 16)],
      gates: [wall(300, 200, 16, 100)], plates: [{ x: 110, y: 70 }, { x: 540, y: 330 }] },
    { loop: 8, start: { x: 52, y: 330 }, door: { x: 584, y: 40, w: 32, h: 56 },
      walls: [wall(220, B, 16, 184), wall(220, 300, 16, H - 300 - B), wall(430, B, 16, 44), wall(430, 160, 16, H - 160 - B)],
      gates: [wall(220, 200, 16, 100), wall(430, 60, 16, 100)], plates: [{ x: 110, y: 70 }, { x: 330, y: 340 }, { x: 540, y: 330 }] },
    { loop: 7, start: { x: 52, y: 340 }, door: { x: 584, y: 40, w: 32, h: 56 },
      walls: [wall(220, B, 16, 184), wall(220, 300, 16, H - 300 - B), wall(430, B, 16, 264)],
      gates: [wall(220, 200, 16, 100), wall(430, 280, 16, H - 280 - B)], plates: [{ x: 60, y: 60 }, { x: 300, y: 60 }, { x: 590, y: 350 }] },
    { loop: 7, start: { x: 52, y: 330 }, door: { x: 584, y: 40, w: 32, h: 56 },
      walls: [wall(220, B, 16, 184), wall(220, 300, 16, H - 300 - B), wall(430, B, 16, 44), wall(430, 160, 16, H - 160 - B)],
      gates: [wall(220, 200, 16, 100), wall(430, 60, 16, 100)], plates: [{ x: 60, y: 60 }, { x: 330, y: 350 }, { x: 600, y: 350 }] },
    { loop: 8, start: { x: 52, y: 330 }, door: { x: 584, y: 40, w: 32, h: 56 }, clones: 4,
      walls: [wall(170, B, 16, 184), wall(170, 300, 16, H - 300 - B), wall(330, B, 16, 44), wall(330, 160, 16, H - 160 - B), wall(490, B, 16, 224), wall(490, 340, 16, H - 340 - B)],
      gates: [wall(170, 200, 16, 100), wall(330, 60, 16, 100), wall(490, 240, 16, 100)], plates: [{ x: 60, y: 60 }, { x: 250, y: 350 }, { x: 410, y: 60 }, { x: 590, y: 360 }] },
    // ab Level 6: weniger Klone als Platten – ein Klon muss nacheinander zwei Platten halten
    { loop: 8, start: { x: 52, y: 330 }, door: { x: 584, y: 40, w: 32, h: 56 }, clones: 3,
      walls: [wall(200, B, 16, 184), wall(200, 300, 16, H - 300 - B), wall(400, B, 16, 44), wall(400, 160, 16, H - 160 - B), wall(520, B, 16, 224), wall(520, 340, 16, H - 340 - B)],
      gates: [wall(200, 200, 16, 100), wall(400, 60, 16, 100), wall(520, 240, 16, 100)], plates: [{ x: 110, y: 330 }, { x: 300, y: 60 }, { x: 100, y: 60 }, { x: 600, y: 360 }] },
    { loop: 8, start: { x: 40, y: 340 }, door: { x: 584, y: 40, w: 32, h: 56 }, clones: 3,
      walls: [wall(170, B, 16, 224), wall(170, 330, 16, H - 330 - B), wall(330, B, 16, 44), wall(330, 150, 16, H - 150 - B), wall(490, B, 16, 224), wall(490, 330, 16, H - 330 - B), wall(506, 190, 60, 16)],
      gates: [wall(170, 240, 16, 90), wall(330, 60, 16, 90), wall(490, 240, 16, 90), wall(566, 190, W - 566 - B, 16)],
      plates: [{ x: 110, y: 300 }, { x: 260, y: 350 }, { x: 80, y: 60 }, { x: 260, y: 60 }, { x: 560, y: 350 }] },
    // ab Level 8: türkise Gitter schließen sich, solange jemand auf ihrer Platte steht
    { loop: 7, start: { x: 52, y: 330 }, door: { x: 584, y: 40, w: 32, h: 56 }, clones: 3,
      walls: [wall(200, B, 16, 184), wall(200, 300, 16, H - 300 - B), wall(216, 150, 90, 16), wall(366, 150, 54, 16), wall(420, B, 16, 224), wall(420, 340, 16, H - 340 - B)],
      gates: [wall(200, 200, 16, 100), wall(420, 240, 16, 100), gate(306, 150, 60, 16, 0, true)], plates: [{ x: 110, y: 330 }, { x: 300, y: 70 }, { x: 560, y: 350 }] },
    { loop: 8, start: { x: 40, y: 340 }, door: { x: 584, y: 40, w: 32, h: 56 }, clones: 3,
      walls: [wall(160, B, 16, 224), wall(160, 330, 16, H - 330 - B), wall(B, 120, 90, 16), wall(330, B, 16, 44), wall(330, 150, 16, H - 150 - B),
        wall(346, 190, 60, 16), wall(480, B, 16, 224), wall(480, 330, 16, H - 330 - B), wall(496, 190, 70, 16)],
      gates: [wall(160, 240, 16, 90), wall(330, 60, 16, 90), wall(480, 240, 16, 90), wall(566, 190, W - 566 - B, 16), gate(106, 120, 54, 16, 0, true), gate(406, 190, 74, 16, 1, true)],
      plates: [{ x: 100, y: 300 }, { x: 250, y: 350 }, { x: 70, y: 60 }, { x: 250, y: 60 }, { x: 560, y: 350 }] },
    { loop: 9, start: { x: 30, y: 40 }, door: { x: 24, y: 316, w: 32, h: 56 }, clones: 4,
      walls: [wall(B, 100, 204, 16), wall(300, 100, W - 300 - B, 16), wall(B, 196, 424, 16), wall(520, 196, W - 520 - B, 16), wall(B, 292, 204, 16), wall(300, 292, W - 300 - B, 16)],
      gates: [wall(220, 100, 80, 16), wall(440, 196, 80, 16), wall(220, 292, 80, 16), wall(340, 116, 16, 80), wall(380, 212, 16, 80), gate(160, 308, 16, 76, 5, true)],
      plates: [{ x: 110, y: 50 }, { x: 500, y: 140 }, { x: 420, y: 60 }, { x: 280, y: 160 }, { x: 180, y: 160 }, { x: 300, y: 350 }] }
  ][level];
  const MAXCL = LV.clones || 3, LOOP = LV.loop, start = LV.start, door = LV.door, gates = LV.gates, plates = LV.plates;
  const walls = [wall(0, 0, W, B), wall(0, H - B, W, B), wall(0, 0, B, H), wall(W - B, 0, B, H), ...LV.walls];
  const NAMES = 'ABCDEF';
  const gp = (g, i) => g.pl ?? i, shut = (g, i, on) => g.inv ? on[gp(g, i)] : !on[gp(g, i)]; // Gitter zu? (türkis = umgekehrt)
  let clones = [], rec, loopT, rewind, t = 0;
  const p = { x: 0, y: 0, w: 18, h: 18 };
  function newLoop() { Object.assign(p, start); rec = []; loopT = 0; }
  newLoop(); rewind = 0;
  const clonePos = cl => cl[Math.min(cl.length - 1, Math.floor(loopT / STEP))];
  const bodies = () => [center(p), ...clones.map(cl => { const q = clonePos(cl); return { x: q[0] + 9, y: q[1] + 9 }; })];
  const pressedPlate = pl => bodies().some(b => Math.hypot(b.x - pl.x, b.y - pl.y) < 20);
  function endLoop() { if (clones.length < MAXCL) clones.push(rec); else clones = [...clones.slice(1), rec]; rewind = 0.6; newLoop(); }
  const self = {
    done: false, door: () => door, p, clones: () => clones, // für Testprogramme
    update(dt) {
      t += dt;
      if (rewind > 0) { rewind -= dt; return; }
      if (pressed.reset) return;
      const on = plates.map(pressedPlate), doorOpen = on[plates.length - 1];
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); const l = Math.hypot(dx, dy) || 1;
      const solids = walls.concat(gates.filter((g, i) => shut(g, i, on) && !overlap(p, g)));
      moveAndCollide(p, dx / l * 140 * dt, dy / l * 140 * dt, solids);
      loopT += dt;
      while (rec.length <= loopT / STEP) rec.push([p.x, p.y]);
      if (doorOpen && overlap(p, door)) { self.done = true; return; }
      if (pressed.action || loopT >= LOOP) endLoop();
    },
    draw(c) {
      c.fillStyle = '#0d0b1a'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(160,120,255,0.08)'; c.lineWidth = 1;
      for (let x = 0; x < W; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const on = plates.map(pressedPlate), doorOpen = on[plates.length - 1];
      const ab = (draw) => { c.save(); c.translate(-1.5, 0); c.globalAlpha = 0.6; draw('#ff3b6b'); c.translate(3, 0); draw('#3bd5ff'); c.restore(); draw(null); };
      ab(col => { for (const s of walls) { c.strokeStyle = col || '#e8e0ff'; c.lineWidth = 1.5; c.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1); } });
      for (const s of walls) { c.fillStyle = 'rgba(60,50,110,0.6)'; c.fillRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4); }
      gates.forEach((gate, i) => {
        const gc = gate.inv ? '#3bf0e0' : '#ff6ad5', vert = gate.h > gate.w;
        if (shut(gate, i, on)) { c.fillStyle = gate.inv ? 'rgba(59,240,224,0.45)' : 'rgba(255,106,213,0.5)'; c.fillRect(gate.x, gate.y, gate.w, gate.h); c.fillStyle = gc; if (vert) for (let y = gate.y; y < gate.y + gate.h; y += 8) c.fillRect(gate.x, y, gate.w, 2); else for (let x = gate.x; x < gate.x + gate.w; x += 8) c.fillRect(x, gate.y, 2, gate.h); }
        else { c.strokeStyle = gate.inv ? 'rgba(59,240,224,0.4)' : 'rgba(255,106,213,0.4)'; c.setLineDash([3, 4]); c.strokeRect(gate.x + 0.5, gate.y + 0.5, gate.w - 1, gate.h - 1); c.setLineDash([]); }
        label(c, NAMES[gp(gate, i)], vert ? gate.x + gate.w / 2 : gate.x - 8, vert ? gate.y - 6 : gate.y + gate.h / 2 + 4, gc, 'center', 10);
      });
      plates.forEach((pl, i) => {
        c.fillStyle = on[i] ? '#ff6ad5' : '#3a2f66'; c.beginPath(); c.arc(pl.x, pl.y, 18, 0, 7); c.fill();
        c.strokeStyle = '#ff6ad5'; c.lineWidth = 2; c.stroke(); label(c, NAMES[i], pl.x, pl.y + 5, on[i] ? '#0d0b1a' : '#ff6ad5', 'center', 13);
        const mine = gates.filter((g, k) => gp(g, k) === i), nor = mine.some(g => !g.inv), inv = mine.some(g => g.inv);
        label(c, i === plates.length - 1 ? 'öffnet die Tür' : nor && inv ? `öffnet rosa ${NAMES[i]}, schließt türkis ${NAMES[i]}` : inv ? `schließt Gitter ${NAMES[i]}` : `öffnet Gitter ${NAMES[i]}`, pl.x, pl.y + (pl.y > 200 ? -26 : 36), 'rgba(232,224,255,0.6)', 'center', 10);
      });
      paintDoor(c, door, { frame: '#e8e0ff', panel: '#3a2f66', knob: '#ff6ad5', light: doorOpen ? next : '#0d0b1a', glow: doorOpen ? '#ff6ad5' : null, open: doorOpen ? 0.8 : 0 });
      clones.forEach((cl, i) => {
        const q = clonePos(cl);
        ab(col => { c.fillStyle = col || 'rgba(232,224,255,0.45)'; c.fillRect(q[0], q[1], 18, 18); });
        label(c, String(i + 1), q[0] + 9, q[1] - 4, '#e8e0ff', 'center', 9);
      });
      ab(col => { c.fillStyle = col || '#ffffff'; c.fillRect(p.x, p.y, 18, 18); });
      // VHS-Einblendungen
      const band = (t * 60) % (H + 60) - 30;
      c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, band, W, 14);
      c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
      if (rewind > 0) {
        c.fillStyle = 'rgba(13,11,26,0.6)'; c.fillRect(0, 0, W, H);
        label(c, '◀◀ ZURÜCKSPULEN', W / 2, H / 2, '#e8e0ff', 'center', 22);
      } else {
        label(c, `▶ PLAY  00:0${Math.floor(loopT)} / 00:0${LOOP}`, 24, 40, '#e8e0ff', 'left', 14);
        c.fillStyle = Math.floor(t * 2) % 2 ? '#ff3b6b' : 'transparent'; c.beginPath(); c.arc(W - 120, 34, 5, 0, 7); c.fill();
        label(c, `KLONE ${clones.length}/${MAXCL}`, W - 108, 40, '#e8e0ff');
        label(c, 'Leertaste: Runde beenden und Klon erzeugen · R: alle Klone löschen', W / 2, H - 22, 'rgba(232,224,255,0.7)', 'center', 10);
        if (gates.some(g => g.inv)) label(c, 'Türkise Gitter schließen sich, solange jemand auf ihrer Platte steht', W / 2, H - 34, 'rgba(59,240,224,0.75)', 'center', 10);
      }
    }
  };
  return self;
}
