/* =====================================================================
   WELT – Zwillinge: zwei Figuren, eine Eingabe, die rechte läuft gespiegelt.
   Beide Karten sind in "Eingabe-Richtung" notiert; die rechte wird gespiegelt gezeichnet.
   Ab Level 9 ist die rechte Seite zusätzlich oben/unten gespiegelt.
   ===================================================================== */
function makeZwillinge(next, level = 0) {
  // Kürzeste Lösungen (per Suche geprüft): Level 1: 17 Züge, Level 2: 25, Level 3: 36, Level 4: 44, Level 5: 46,
  // Level 6: 50, Level 7: 55, Level 8: 60, Level 9: 63, Level 10: 68 (ab Level 6 größere Karten, per Generator).
  const A = [[
    '##########',
    '#S.......#',
    '#.....#..#',
    '#..#.....#',
    '#......#.#',
    '#.#......#',
    '#....#..D#',
    '#........#',
    '##########'
  ], [
    '##########',
    '#...##.###',
    '#.....#..#',
    '#..D..#..#',
    '#........#',
    '#.#......#',
    '#......#.#',
    '#S....#..#',
    '##########'
  ], [
    '##########',
    '#.#.S.o.##',
    '#...#...##',
    '#.oo...#.#',
    '#........#',
    '##....##.#',
    '#.o....#.#',
    '#..D.o#..#',
    '##########'
  ], [
    '##########',
    '#....oS#.#',
    '#.......o#',
    '#....#.#.#',
    '#.....#..#',
    '###.#...D#',
    '#..#..#..#',
    '#ooo..#..#',
    '##########'
  ], [
    '##########',
    '#.#....D.#',
    '#......o.#',
    '#.#......#',
    '#.##.....#',
    '#.S.#.o..#',
    '##.o....##',
    '#.....#o.#',
    '##########'
  ], [
    '###########',
    '##o.#.o...#',
    '#......ooD#',
    '#..#..#...#',
    '#..#.##oS.#',
    '#...#.....#',
    '#........##',
    '##..o..####',
    '###########'
  ], [
    '###########',
    '#o.D#.....#',
    '#...#.#...#',
    '##o.o..#o.#',
    '#.#....#..#',
    '#..#.#.#..#',
    '#...o##...#',
    '#.o..#....#',
    '#S##....o.#',
    '###########'
  ], [
    '############',
    '#...##.....#',
    '#..o.....o.#',
    '#.#..#..o.D#',
    '#...###o..o#',
    '#.o#o#.....#',
    '#.#.#....#.#',
    '#...#..#..##',
    '#S..#.o...##',
    '############'
  ], [
    '############',
    '#.#....o#..#',
    '###.#.o..#.#',
    '#..o.o.....#',
    '#..##......#',
    '##.o.......#',
    '##....D#.#.#',
    '##..o###...#',
    '#.oS.#.o...#',
    '############'
  ], [
    '############',
    '##.o.#..#..#',
    '#.S.##o....#',
    '#...#...oo.#',
    '#.#.o#.o...#',
    '##.....#...#',
    '#.#...o....#',
    '#.##.#.....#',
    '#.#..#.o...#',
    '#..#oD..#..#',
    '############'
  ]][level];
  const B = [[
    '##########',
    '#...S....#',
    '#........#',
    '#.o...#..#',
    '#....o...#',
    '#.#....o.#',
    '#..#.....#',
    '#.D......#',
    '##########'
  ], [
    '##########',
    '##.....S.#',
    '##.......#',
    '#.....#..#',
    '#..oo.o..#',
    '#........#',
    '#.#....D##',
    '#.....oo##',
    '##########'
  ], [
    '##########',
    '#....#...#',
    '#.o....Do#',
    '#...ooo..#',
    '#o...#.#.#',
    '#........#',
    '#o....o.o#',
    '#.So#.o..#',
    '##########'
  ], [
    '##########',
    '##....o.o#',
    '#..#o..###',
    '#...##..##',
    '##..o.oS.#',
    '#D.o#...o#',
    '#..o..##.#',
    '#..o.....#',
    '##########'
  ], [
    '##########',
    '##.#..o..#',
    '#D.o.....#',
    '#.o....#.#',
    '#....#...#',
    '#o.....S.#',
    '##..o..o.#',
    '#....#...#',
    '##########'
  ], [
    '###########',
    '##.##.....#',
    '##....#.#.#',
    '#.o#...o..#',
    '#.#...#.o.#',
    '#D#.oo..#S#',
    '#........o#',
    '#......#.##',
    '###########'
  ], [
    '###########',
    '#....o....#',
    '#.....#...#',
    '##D##.#.#.#',
    '#o.#..o...#',
    '#.###..#..#',
    '#....#...o#',
    '#.#.o##.oS#',
    '#....o....#',
    '###########'
  ], [
    '############',
    '#.S..o.#...#',
    '##..##...#.#',
    '#.......o.##',
    '#.##.#...o.#',
    '##.o.#.....#',
    '#...o#oo...#',
    '##..D...#.##',
    '#o##.......#',
    '############'
  ], [
    '############',
    '###..o.#.#.#',
    '#...#D#....#',
    '#.##.......#',
    '##....oo...#',
    '#...ooS.o..#',
    '#..o....##.#',
    '#.o....#.#.#',
    '#.....#...##',
    '############'
  ], [
    '############',
    '##..#.o.oD.#',
    '#.#....###.#',
    '#..##o.#...#',
    '#....##o...#',
    '##..#......#',
    '#..o#o.o...#',
    '##.....o...#',
    '#S.#o.##...#',
    '#....#.....#',
    '############'
  ]][level];
  const COLS = A[0].length, ROWS = A.length, VFLIP = level >= 8, INK = ['#ff4f7b', '#2f5bff'];
  const S = COLS <= 10 ? 32 : Math.floor(308 / COLS), f = S / 32, OX = (320 - COLS * S) / 2, OY = 44 + Math.floor((288 - ROWS * S) / 2);
  const find = (m, ch) => { for (let y = 0; y < m.length; y++) { const x = m[y].indexOf(ch); if (x >= 0) return { x, y }; } };
  const sa = find(A, 'S'), sb = find(B, 'S'), da = find(A, 'D'), db = find(B, 'D');
  let a, b, moves, rep = 0, flash = 0;
  const va = {}, vb = {};
  function reset() { a = { ...sa }; b = { ...sb }; moves = 0; Object.assign(va, a); Object.assign(vb, b); }
  reset();
  // Bildschirmposition einer Zelle: links normal, rechts gespiegelt (ab Level 9 auch oben/unten)
  const scr = (side, x, y) => ({ x: side === 0 ? OX + x * S : W - OX - (x + 1) * S, y: OY + (side === 1 && VFLIP ? ROWS - 1 - y : y) * S });
  const grain = Array.from({ length: 260 }, () => [Math.random() * W, Math.random() * H]);
  const mv = (m, p, dx, dy) => { const c = m[p.y + dy][p.x + dx]; return c === '#' ? { ...p } : c === 'o' ? null : { x: p.x + dx, y: p.y + dy }; };
  const self = {
    done: false,
    door: () => { const s = scr(0, da.x, da.y); return { x: s.x + 5 * f, y: s.y + 2 * f, w: S - 10 * f, h: S - 2 * f }; },
    test: () => ({ a: { ...a }, b: { ...b }, moves }), // für Testprogramme
    step(dx, dy) {
      const na = mv(A, a, dx, dy), nb = mv(B, b, dx, dy);
      if (!na || !nb) { died(); flash = 0.4; reset(); return; }
      a = na; b = nb; moves++;
      if (a.x === da.x && a.y === da.y && b.x === db.x && b.y === db.y) self.done = true;
    },
    update(dt) {
      flash = Math.max(0, flash - dt);
      const dirOf = src => src.left ? [-1, 0] : src.right ? [1, 0] : src.up ? [0, -1] : src.down ? [0, 1] : null;
      const d = dirOf(pressed);
      if (d) { self.step(...d); rep = 0.24; }
      else { rep -= dt; const h = dirOf(keys); if (h && rep <= 0) { self.step(...h); rep = 0.12; } }
      for (const [v, p] of [[va, a], [vb, b]]) { v.x += (p.x - v.x) * Math.min(1, dt * 20); v.y += (p.y - v.y) * Math.min(1, dt * 20); }
    },
    draw(c) {
      c.fillStyle = '#eef0ee'; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'multiply';
      [A, B].forEach((m, side) => {
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const ch = m[y][x], s = scr(side, x, y);
          if (ch === '#') {
            c.fillStyle = INK[side]; c.globalAlpha = 0.75; c.fillRect(s.x, s.y, S, S);
            c.globalAlpha = 0.35; c.fillRect(s.x + 3 * f, s.y + 3 * f, S, S);
          } else if (ch === 'o') {
            c.globalAlpha = 1; c.fillStyle = '#2b2233'; c.beginPath(); c.arc(s.x + S / 2, s.y + S / 2, 11 * f, 0, 7); c.fill();
            c.strokeStyle = INK[side]; c.lineWidth = 2; c.beginPath(); c.arc(s.x + S / 2, s.y + S / 2, 7 * f, 0, 7); c.stroke();
          }
        }
      });
      c.restore();
      const doorAt = (side, d, onIt) => {
        const s = scr(side, d.x, d.y);
        paintDoor(c, { x: s.x + 5 * f, y: s.y + 2 * f, w: S - 10 * f, h: S - 2 * f }, { frame: '#2b2233', panel: INK[side], knob: '#fff', light: next, open: onIt ? 0.9 : 0.15 });
      };
      doorAt(0, da, a.x === da.x && a.y === da.y);
      doorAt(1, db, b.x === db.x && b.y === db.y);
      c.strokeStyle = '#2b2233'; c.setLineDash([4, 6]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(W / 2, VFLIP ? Math.max(OY - 14, 42) : OY - 14); c.lineTo(W / 2, OY + ROWS * S + 14); c.stroke(); c.setLineDash([]);
      [[va, 0], [vb, 1]].forEach(([v, side]) => {
        const s = scr(side, v.x, v.y), cx = s.x + S / 2, cy = s.y + S / 2;
        c.fillStyle = '#2b2233'; c.beginPath(); c.arc(cx, cy + f, 10 * f, 0, 7); c.fill();
        c.fillStyle = INK[side]; c.beginPath(); c.arc(cx, cy - f, 9 * f, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.fillRect(cx - 4 * f, cy - 3 * f, 3 * f, 3 * f); c.fillRect(cx + f, cy - 3 * f, 3 * f, 3 * f);
      });
      c.fillStyle = 'rgba(43,34,51,0.08)'; for (const [gx, gy] of grain) c.fillRect(gx, gy, 1.5, 1.5);
      c.font = '600 12px "IBM Plex Mono", monospace'; c.fillStyle = '#2b2233'; c.textAlign = 'center';
      c.fillText('Beide müssen gleichzeitig auf ihrer Tür stehen', W / 2, VFLIP ? 20 : 26);
      if (VFLIP) { c.fillStyle = INK[1]; c.fillText('Achtung: Rechts ist auch oben und unten vertauscht!', W / 2, 36); c.fillStyle = '#2b2233'; }
      c.fillText(`Züge ${moves}   ·   Löcher = zurück an den Start   ·   [R] neu`, W / 2, H - 24);
      c.textAlign = 'left';
      if (flash > 0) { c.fillStyle = `rgba(43,34,51,${flash})`; c.fillRect(0, 0, W, H); }
    }
  };
  return self;
}
