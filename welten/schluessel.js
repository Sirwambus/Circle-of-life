/* =====================================================================
   WELT – Schlüsselraum: rundenbasiertes Kistenschieben im Terminal-Look.
   Ab Level 6 echtes Sokoban: Die Tür geht erst auf, wenn auf jeder Platte [ ] eine Kiste steht.
   ===================================================================== */
function makeSchluessel(next, level = 0) {
  // Level 2 und 3: Eine Kiste versperrt einen schmalen Gang. Geradeaus geschoben blockiert sie den
  // Schlüssel für immer, richtig ist die Nische an der Seite. Level 4: dazu eine Kiste im Gang zur Tür,
  // die über die Seitenkammer in ihre Nische muss. Level 5: wie 4, mit Fallen-Kisten oben. (Alle per Suche geprüft.)
  // Level 6–10: Platten 'o' statt Schlüssel (2, 2, 3, 3, 4 Kisten). Per Rückwärtssuche erzeugt, mindestens
  // 15, 18, 26, 34 bzw. 40 Schübe und 51, 70, 72, 97 bzw. 125 Schritte nötig (per Suche geprüft). ' ' = Leere.
  const MAP = [[
    '####################',
    '#..................#',
    '#.P.....B..........#',
    '#..........#####...#',
    '#..........#..K#...#',
    '#....B.....B...#...#',
    '#..........#...#...#',
    '#..B.......#####...#',
    '#..................#',
    '###########.####D###',
    '###########...B....#',
    '####################'
  ], [
    '####################',
    '#P........##########',
    '#.........##########',
    '#...B.....##########',
    '#.........##########',
    '####.####.##########',
    '####.....B....K#####',
    '#########.####.#####',
    '##############.#####',
    '##############.#D###',
    '##############.B...#',
    '####################'
  ], [
    '####################',
    '#P.............#####',
    '#..............#####',
    '#....B.........#####',
    '#......#...#...#####',
    '###.###.###.########',
    '###....B...B...K####',
    '#####.#.#.#.###.####',
    '#####...#...###.####',
    '###############.#D##',
    '###############.B..#',
    '####################'
  ], [
    '####################',
    '#P.............#####',
    '#..............#####',
    '#....B.........#####',
    '#......#...#...#####',
    '###.###.###.########',
    '###....B...B...K.###',
    '#####.#.#.#.###..###',
    '#####...#...##.B.###',
    '###############.#D##',
    '###############.B..#',
    '####################'
  ], [
    '####################',
    '#P.............#####',
    '#.......B......#####',
    '#....B.........#####',
    '#..B...#...#...#####',
    '###.###.###.########',
    '###....B...B...K.###',
    '#####.#.#.#.###..###',
    '#####...#...##.B.###',
    '###############.#D##',
    '###############.B..#',
    '####################'
  ], [
    '                    ',
    '                    ',
    '                    ',
    '     #########      ',
    '     #.....o##      ',
    '     D......##      ',
    '     #.B..#P.#      ',
    '     #.B.#..o#      ',
    '     #..##...#      ',
    '     #########      ',
    '                    ',
    '                    '
  ], [
    '                    ',
    '                    ',
    '     ##########     ',
    '     ####oo...#     ',
    '     ##.......#     ',
    '     #...##...#     ',
    '     #.B.##.#.#     ',
    '     #.B.##.P.#     ',
    '     D..###...#     ',
    '     ##########     ',
    '                    ',
    '                    '
  ], [
    '                    ',
    '                    ',
    '     ##########     ',
    '     #####....#     ',
    '     ####..#oo#     ',
    '     D.B.B#...#     ',
    '     #.B..#...#     ',
    '     #...P....#     ',
    '     #......o.#     ',
    '     ##########     ',
    '                    ',
    '                    '
  ], [
    '                    ',
    '                    ',
    '    ###########     ',
    '    #.........#     ',
    '    #.#.......#     ',
    '    #.#o.#..#.#     ',
    '    #....##.B.#     ',
    '    #.o..#.B..#     ',
    '    #......B###     ',
    '    #..o.P..###     ',
    '    #######D###     ',
    '                    '
  ], [
    '                    ',
    '                    ',
    '     ##########     ',
    '     ##..##.Bo#     ',
    '     ##.....B.#     ',
    '     #..##.B.##     ',
    '     #P..o#B..#     ',
    '     #oo....#.#     ',
    '     #......#.#     ',
    '     ###......#     ',
    '     ########D#     ',
    '                    '
  ]][level];
  const S = 32, GREEN = '#5dff9c';
  let pl, crates, key = null, doorCell, hasKey = false, moves = 0, msg = '', msgT = 0, rep = 0, wasOpen = false;
  const plates = [], hist = [];
  const vis = { x: 0, y: 0 };
  MAP.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'P') pl = { x, y };
    if (ch === 'K') key = { x, y };
    if (ch === 'D') doorCell = { x, y };
    if (ch === 'o' || ch === '*') plates.push({ x, y });
  }));
  crates = []; MAP.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'B' || ch === '*') crates.push({ x, y }); }));
  vis.x = pl.x; vis.y = pl.y;
  const wall = (x, y) => MAP[y][x] === '#' || MAP[y][x] === ' ';
  const crateAt = (x, y) => crates.find(c => c.x === x && c.y === y);
  const isDoor = (x, y) => x === doorCell.x && y === doorCell.y;
  const isKey = (x, y) => key && key.x === x && key.y === y;
  const say = m => { msg = m; msgT = 1.8; };
  const covered = () => plates.filter(p => crateAt(p.x, p.y)).length;
  const isOpen = () => hasKey || (plates.length > 0 && covered() === plates.length);
  const self = {
    done: false,
    door: () => ({ x: doorCell.x * S + 4, y: doorCell.y * S + 2, w: S - 8, h: S - 2 }),
    test: () => ({ pl: { ...pl }, crates: crates.map(c => ({ ...c })), hasKey, open: isOpen(), covered: covered(), plates: plates.length, moves }), // für Testprogramme
    step(dx, dy) {
      const nx = pl.x + dx, ny = pl.y + dy;
      if (isDoor(nx, ny)) {
        if (isOpen()) { pl.x = nx; pl.y = ny; self.done = true; }
        else say(plates.length ? 'TÜR VERSCHLOSSEN – AUF JEDE PLATTE [ ] EINE KISTE' : 'TÜR VERSCHLOSSEN – FINDE DEN SCHLÜSSEL');
        return;
      }
      if (wall(nx, ny)) return;
      const cr = crateAt(nx, ny);
      if (cr && (wall(nx + dx, ny + dy) || crateAt(nx + dx, ny + dy) || isDoor(nx + dx, ny + dy) || isKey(nx + dx, ny + dy))) { say('KISTE BLOCKIERT – [LEERTASTE] ZUG ZURÜCK, [R] NEUSTART'); return; }
      hist.push({ pl: { ...pl }, crates: crates.map(c => ({ ...c })), key, hasKey, moves });
      if (cr) { cr.x = nx + dx; cr.y = ny + dy; }
      pl.x = nx; pl.y = ny; moves++;
      if (isKey(nx, ny)) { key = null; hasKey = true; say('SCHLÜSSEL GEFUNDEN'); }
      if (plates.length && isOpen() !== wasOpen) { wasOpen = isOpen(); say(wasOpen ? 'ALLE PLATTEN BEDECKT – DIE TÜR IST OFFEN' : 'PLATTE FREI – TÜR WIEDER ZU'); Klang.tone(wasOpen ? 660 : 220, 0.15); }
    },
    undo() { // einen Zug zurücknehmen
      const h = hist.pop(); if (!h) return;
      pl = h.pl; crates = h.crates; key = h.key; hasKey = h.hasKey; moves = h.moves; wasOpen = isOpen(); say('ZUG ZURÜCKGENOMMEN');
    },
    update(dt) {
      const dirOf = src => src.left ? [-1, 0] : src.right ? [1, 0] : src.up ? [0, -1] : src.down ? [0, 1] : null;
      if (pressed.action) self.undo();
      const d = dirOf(pressed);
      if (d) { self.step(...d); rep = 0.24; }
      else { rep -= dt; const h = dirOf(keys); if (h && rep <= 0) { self.step(...h); rep = 0.11; } }
      vis.x += (pl.x - vis.x) * Math.min(1, dt * 22); vis.y += (pl.y - vis.y) * Math.min(1, dt * 22);
      msgT -= dt;
    },
    draw(c) {
      c.fillStyle = '#03100a'; c.fillRect(0, 0, W, H);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '600 18px "IBM Plex Mono", monospace';
      for (let y = 0; y < MAP.length; y++) for (let x = 0; x < 20; x++) {
        const px = x * S + S / 2, py = y * S + S / 2;
        if (MAP[y][x] === ' ') continue;
        if (wall(x, y)) { c.fillStyle = '#0a2416'; c.fillRect(x * S, y * S, S, S); c.fillStyle = '#1f7a45'; c.fillText('#', px, py); }
        else { c.fillStyle = '#16402a'; c.fillText('·', px, py); }
      }
      for (const p of plates) { // Platten: leuchten, sobald eine Kiste darauf steht
        const on = crateAt(p.x, p.y);
        c.fillStyle = on ? 'rgba(93,255,156,0.28)' : 'rgba(93,255,156,0.08)'; c.fillRect(p.x * S + 2, p.y * S + 2, S - 4, S - 4);
        c.fillStyle = on ? '#c8ffdc' : '#3fd27e'; c.fillText('[ ]', p.x * S + S / 2, p.y * S + S / 2);
      }
      c.save(); c.shadowColor = GREEN; c.shadowBlur = 10;
      c.strokeStyle = GREEN; c.lineWidth = 2;
      for (const cr of crates) {
        const x = cr.x * S, y = cr.y * S;
        c.strokeRect(x + 6, y + 6, S - 12, S - 12);
        c.beginPath(); c.moveTo(x + 6, y + 6); c.lineTo(x + S - 6, y + S - 6); c.moveTo(x + S - 6, y + 6); c.lineTo(x + 6, y + S - 6); c.stroke();
      }
      if (key) { // kleiner Schlüssel
        const x = key.x * S + 10, y = key.y * S + 16, b = Math.sin(performance.now() / 250) * 2;
        c.strokeStyle = '#d6ffe5'; c.beginPath(); c.arc(x, y + b, 5, 0, 7); c.moveTo(x + 5, y + b); c.lineTo(x + 16, y + b);
        c.moveTo(x + 12, y + b); c.lineTo(x + 12, y + b + 5); c.moveTo(x + 16, y + b); c.lineTo(x + 16, y + b + 4); c.stroke();
      }
      c.restore();
      const dr = self.door(), open = isOpen();
      paintDoor(c, dr, { frame: '#1f7a45', panel: open ? '#0f3a22' : '#0b2a18', knob: GREEN, light: open ? next : '#07170e',
        glow: open ? GREEN : null, open: open ? doorOpenness({ x: pl.x * S, y: pl.y * S, w: S, h: S }, dr, 60) : 0 });
      if (!open) { c.fillStyle = '#2fbf6a'; c.font = '600 14px "IBM Plex Mono", monospace'; c.fillText('×', dr.x + dr.w / 2, dr.y + dr.h / 2); }
      c.save(); c.shadowColor = GREEN; c.shadowBlur = 14; c.fillStyle = '#c8ffdc'; c.font = '600 24px "IBM Plex Mono", monospace';
      c.fillText('@', vis.x * S + S / 2, vis.y * S + S / 2 + 1); c.restore();
      // Statuszeile
      c.textAlign = 'left'; c.font = '12px "IBM Plex Mono", monospace'; c.fillStyle = '#2fbf6a';
      const blink = Math.floor(performance.now() / 500) % 2 ? '█' : ' ';
      const stat = plates.length ? `PLATTEN: ${covered()}/${plates.length}` : `SCHLÜSSEL: ${hasKey ? 'JA' : 'NEIN'}`;
      c.fillText(msgT > 0 ? `> ${msg}` : `> ${stat}   ZÜGE: ${moves}   [LEERTASTE] ZURÜCK   [R] NEUSTART ${blink}`, 8, 392);
      if (plates.length) { c.textAlign = 'center'; c.fillStyle = '#5dff9c'; c.fillText('AUF JEDE PLATTE [ ] GEHÖRT EINE KISTE – DANN ÖFFNET SICH DIE TÜR', W / 2, 18); }
      c.textBaseline = 'alphabetic';
      c.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
      const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
  };
  return self;
}
