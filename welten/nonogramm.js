/* =====================================================================
   WELT – Nonogramm: Die Zahlen am Rand verraten, wie lange Blöcke gefüllter Felder in jeder
   Zeile und Spalte liegen. Füll die richtigen Felder, dann zeigt sich ein Bild.
   ↑ ↓ ← → Feld wählen, Leertaste füllen / Kreuz / leeren (gedrückt halten zum Malen).
   ===================================================================== */
function makeNonogramm(next, level = 0) {
  // Alle Bilder sind allein mit Zeilenlogik eindeutig lösbar (per Löser geprüft).
  const PICS = [
    ['ein Herz', ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..']],
    ['ein Haus', ['..r..', '.rrr.', 'rrrrr', '.yky.', '.yky.']],
    ['ein Pilz', ['.rrrr.', 'rrwrrr', 'rrrrwr', '..ww..', '..ww..', '.wwww.']],
    ['eine Katze', ['k.....k', 'kk...kk', 'kkkkkkk', 'k.kkk.k', 'kkkkkkk', '.kk.kk.', '..kkk..']],
    ['ein Baum', ['...gg...', '..gggg..', '.gggggg.', 'gggggggg', '.gggggg.', '...bb...', '...bb...', '.bbbbbb.']],
    ['ein Schlüssel', ['.yyy....', 'yy.yy...', 'y...y...', 'yy.yyyyy', '.yyy..y.', '......yy', '......y.', '......yy']],
    ['Mond und Stern', ['...yyy...', '..yy.....', '.yy......', '.yy....w.', '.yy...www', '.yy....w.', '.yyy.....', '..yyyy...', '....yyy..']],
    ['ein Vogel', ['..........', '...cc.....', '..cccc....', '.ckccc...c', 'ooccccc.cc', '..cccccccc', '...ccccccc', '....ccccc.', '.....y.y..', '....yy.yy.']],
    ['eine Lotusblüte', ['....pp....', '...pppp...', '.p.pppp.p.', 'pp.pppp.pp', 'ppp.pp.ppp', '.pppppppp.', '..pppppp..', 'gggggggggg', '.g.g..g.g.', 'gg.gg.gg.g']],
    ['eine Tür', ['...dddd...', '..dddddd..', '.dd....dd.', '.d......d.', '.d......d.', '.d.....kd.', '.d......d.', '.d......d.', '.d......d.', 'bbbbbbbbbb']]
  ];
  const COL = { r: '#e8485a', y: '#ffc93d', k: '#3a3046', w: '#f7f1e3', g: '#3fae5a', b: '#8a5a34', c: '#4fb6e8', o: '#ff8a2a', p: '#ff7ab8', d: next };
  const [NAME, PIC] = PICS[level], R = PIC.length, C = PIC[0].length;
  const sol = PIC.map(r => [...r].map(ch => ch !== '.'));
  const clue = line => { const out = []; let n = 0; for (const v of line) { if (v) n++; else if (n) { out.push(n); n = 0; } } if (n) out.push(n); return out.length ? out : [0]; };
  const rowC = sol.map(clue), colC = Array.from({ length: C }, (_, x) => clue(sol.map(r => r[x])));
  const MR = Math.max(...rowC.map(c => c.length)), MC = Math.max(...colC.map(c => c.length));
  const S = Math.min(34, Math.floor(260 / Math.max(R, C))), CLW = MR * 15 + 10, CLH = MC * 14 + 8;
  const GX = Math.round(250 - (CLW + C * S) / 2 + CLW), GY = Math.round(42 + CLH + (10 - R) * S / 4);
  const finale = makeFinale(next);
  let cell = Array.from({ length: R }, () => Array(C).fill(0)); // 0 leer, 1 voll, 2 Kreuz
  let cx = 0, cy = 0, paint = -1, t = 0, solvedT = -1;
  const rep = makeRepeater(0.24, 0.09);
  const lineDone = (cl, line) => { const c = clue(line.map(v => v === 1)); return c.length === cl.length && c.every((v, i) => v === cl[i]); };
  const isSolved = () => sol.every((r, y) => r.every((v, x) => v === (cell[y][x] === 1)));
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ R, C, rowC, colC, cell: cell.map(r => r.slice()), cx, cy, fin: finale.active, solved: solvedT >= 0 }), // für Testprogramme
    update(dt) {
      t += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 2) finale.start(); return; }
      const d = rep(dt);
      if (d) { cx = (cx + d[0] + C) % C; cy = (cy + d[1] + R) % R; if (keys.action && paint >= 0) cell[cy][cx] = paint; }
      if (pressed.action) { paint = (cell[cy][cx] + 1) % 3; cell[cy][cx] = paint; Klang.tone(paint === 1 ? 520 : paint === 2 ? 300 : 200, 0.06); }
      if (!keys.action) paint = -1;
      if (isSolved()) { solvedT = 0; Klang.tone(880, 0.4); }
    },
    draw(c) {
      // Webstube: Nachtblauer Stoff mit Webmuster
      c.fillStyle = '#0f2a33'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(80,190,170,0.07)'; c.lineWidth = 3;
      for (let i = -H; i < W; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); c.beginPath(); c.moveTo(i + H, 0); c.lineTo(i, H); c.stroke(); }
      const sv = solvedT >= 0 ? Math.min(1, solvedT / 0.8) : 0;
      c.fillStyle = '#f3ead8'; c.beginPath(); c.roundRect(GX - CLW - 6, GY - CLH - 6, CLW + C * S + 12, CLH + R * S + 12, 8); c.fill();
      // Hinweise
      for (let y = 0; y < R; y++) {
        const dn = lineDone(rowC[y], cell[y]), on = y === cy && !finale.active;
        if (on) { c.fillStyle = 'rgba(47,212,165,0.18)'; c.fillRect(GX - CLW, GY + y * S, CLW + C * S, S); }
        rowC[y].forEach((n, i) => label(c, String(n), GX - 8 - (rowC[y].length - 1 - i) * 15, GY + y * S + S / 2 + 4, dn ? 'rgba(42,47,79,0.3)' : '#2a2f4f', 'right', S < 26 ? 11 : 12));
      }
      for (let x = 0; x < C; x++) {
        const dn = lineDone(colC[x], cell.map(r => r[x])), on = x === cx && !finale.active;
        if (on) { c.fillStyle = 'rgba(47,212,165,0.18)'; c.fillRect(GX + x * S, GY - CLH, S, CLH + R * S); }
        colC[x].forEach((n, i) => label(c, String(n), GX + x * S + S / 2, GY - 6 - (colC[x].length - 1 - i) * 14, dn ? 'rgba(42,47,79,0.3)' : '#2a2f4f', 'center', S < 26 ? 11 : 12));
      }
      // Felder
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const px = GX + x * S, py = GY + y * S, v = cell[y][x];
        if (v === 1) {
          c.fillStyle = sv > 0 ? COL[PIC[y][x]] || '#2a2f4f' : '#2a2f4f'; c.globalAlpha = 1; c.fillRect(px + 1, py + 1, S - 2, S - 2);
          if (sv > 0) { c.fillStyle = `rgba(255,255,255,${0.25 * sv})`; c.fillRect(px + 2, py + 2, S - 4, 3); }
        } else if (v === 2) {
          c.strokeStyle = 'rgba(42,47,79,0.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px + S * 0.3, py + S * 0.3); c.lineTo(px + S * 0.7, py + S * 0.7); c.moveTo(px + S * 0.7, py + S * 0.3); c.lineTo(px + S * 0.3, py + S * 0.7); c.stroke();
        }
      }
      c.strokeStyle = 'rgba(42,47,79,0.35)'; c.lineWidth = 1;
      for (let x = 0; x <= C; x++) { c.lineWidth = x % 5 === 0 ? 2 : 1; c.beginPath(); c.moveTo(GX + x * S, GY); c.lineTo(GX + x * S, GY + R * S); c.stroke(); }
      for (let y = 0; y <= R; y++) { c.lineWidth = y % 5 === 0 ? 2 : 1; c.beginPath(); c.moveTo(GX, GY + y * S); c.lineTo(GX + C * S, GY + y * S); c.stroke(); }
      if (!finale.active && solvedT < 0) { c.strokeStyle = '#2fd4a5'; c.lineWidth = 3; c.strokeRect(GX + cx * S + 1.5, GY + cy * S + 1.5, S - 3, S - 3); }
      // Vorschau rechts
      const PS = Math.floor(120 / Math.max(R, C)), PX = 520 - C * PS / 2, PY = 110;
      c.fillStyle = 'rgba(243,234,216,0.12)'; c.fillRect(PX - 8, PY - 8, C * PS + 16, R * PS + 16);
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (cell[y][x] === 1) { c.fillStyle = sv > 0 ? COL[PIC[y][x]] || '#f3ead8' : '#f3ead8'; c.fillRect(PX + x * PS, PY + y * PS, PS, PS); }
      label(c, `${C}×${R} Felder`, 16, 24, '#bfeee0');
      if (solvedT >= 0) label(c, `Es ist ${NAME}!`, 520, PY + R * PS + 40, '#ffffff', 'center', 15);
      else {
        label(c, 'Zahlen = Blocklängen', 520, PY + R * PS + 36, 'rgba(191,238,224,0.8)', 'center', 11);
        label(c, 'Leertaste: voll → Kreuz → leer', 520, PY + R * PS + 56, 'rgba(191,238,224,0.8)', 'center', 11);
        label(c, 'halten + Pfeile: malen', 520, PY + R * PS + 74, 'rgba(191,238,224,0.8)', 'center', 11);
      }
      finale.draw(c, '#2fd4a5', '#0f2a33');
    }
  };
  return self;
}
