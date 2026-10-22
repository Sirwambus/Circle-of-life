/* =====================================================================
   RAUM – Die Sonde fliegt frei durch die Galaxie: Asteroiden abbauen, handeln, Piraten abwehren,
   sich selbst replizieren. Das Schiff ist der Kreis: Seine sechs Segmente sind die Kategorien,
   geschaffte Level im Kreis der Spiele verbessern die Schiffssysteme.
   makeRaum({ cats, skill(id) -> geschaffte Level der Kategorie, onKreis() })
   ===================================================================== */
function makeRaum(opt) {
  const G = makeGalaxie(), SYS = G.systems, TOTAL = SYS.length;
  const SAVE = 'tueren.sonde';
  // Sichtfeld: im Vollbild breiter oder höher als 640 × 400; L, R, U = Ränder, die die Touch-Steuerung verdeckt
  let W = 640, H = 400, L = 0, R = 0, U = 0, TL = 0, TT = 0;
  let S = null;
  try { S = JSON.parse(localStorage.getItem(SAVE)); } catch (e) {}
  if (!S || S.v !== 1) S = sondeNeu();
  let w = sondeWerte(opt.skill);
  const catColor = Object.fromEntries(opt.cats.map(c => [c.id, c.color]));
  const CAT_IDS = opt.cats.map(c => c.id);
  // Flüchtiger Zustand im aktuellen System
  let sys, ast, pir, bul, pick, mines, wracks, parts, station, flare, build, cam = { x: 0, y: 0 }, starsBg;
  let mode = 'flug', dockT = null, dockRow = 0, karteSel = 0, sprung = null, totT = 0, banner = null, shield = w.schild, noDmg = 9, fireCd = 0, blitz = [];
  let netzSel = 0, netzTop = 0, saveT = 0, spawnT = 0, astT = 0, hint = '', hintT = 0, fullT = 0, t = 0, shake = 0;
  const rep = makeRepeater(0.3, 0.09);

  const log = (text, col = '#e8e2ff') => { S.log.push({ t: S.time, text, col }); if (S.log.length > 40) S.log.shift(); };
  const say = (text, d = 2.5) => { hint = text; hintT = d; };
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} };
  const nodeIn = i => {
    const n = S.nodes.find(n => n.sys === i);
    if (n && n.x === undefined) { const a = (n.nr * 2.39) % (Math.PI * 2), r = SYS[i].sr + 260; n.x = Math.cos(a) * r; n.y = Math.sin(a) * r; } // Pioniere landen irgendwo im Orbit
    return n;
  };
  const cargoUsed = () => Object.values(S.cargo).reduce((a, b) => a + b, 0);
  const planetPos = p => { const a = p.a0 + p.w * S.time; return { x: Math.cos(a) * p.r, y: Math.sin(a) * p.r }; };
  const netzSysteme = () => new Set(S.nodes.map(n => n.sys)).size;
  const waffenFrei = () => SONDE_WAFFEN.filter(x => w.stufe.reaktion >= x.ab);
  const waffe = () => waffenFrei().find(x => x.id === S.waffe) || SONDE_WAFFEN[0];

  function betreten(i, from) {
    S.sys = i; sys = SYS[i]; if (!S.visited.includes(i)) S.visited.push(i);
    const R = rng(sys.seed + S.time | 0);
    ast = []; pir = []; bul = []; pick = []; mines = []; wracks = []; parts = []; build = null; station = null;
    flare = sys.flare ? { t: 30 + R() * 20, r: -1 } : null;
    if (sys.belt) for (let k = 0; k < sys.belt.n; k++) ast.push(neuerAsteroid(R, sys.belt.r + (R() - 0.5) * 150, R() * Math.PI * 2, 16 + R() * 20));
    if (sys.special === 'minen') for (let k = 0; k < 28; k++) { const a = R() * Math.PI * 2, r = 450 + R() * 900; mines.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, ph: R() * 6 }); }
    if (!(S.wracks || {})[i]) for (let k = 0; k < sys.wracks; k++) { const a = R() * Math.PI * 2, r = 300 + R() * 1000; wracks.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a: R() * 6, k }); }
    if (sys.special === 'nest' && !S.nestDown) station = { x: 900, y: -420, hp: 300, max: 300, cd: 2, spin: 0 };
    if (from !== undefined) {
      const a = Math.atan2(SYS[from].y - sys.y, SYS[from].x - sys.x);
      Object.assign(S.ship, { x: Math.cos(a) * 1450, y: Math.sin(a) * 1450, vx: 0, vy: 0, a: a + Math.PI });
    }
    for (let k = 0; k < Math.ceil(piratenQuota() / 2); k++) neuerPirat(R);
    starsBg = [0.15, 0.35, 0.6].map((par, k) => Array.from({ length: 160 }, () => ({ x: R() * 1800, y: R() * 1800, s: 0.6 + R() * (k + 1) * 0.6, par, c: R() })));
    starsBg.nebel = Array.from({ length: 8 }, () => ({ x: R() * 1800, y: R() * 1800, r: 220 + R() * 300, h: Math.floor(R() * 360) }));
    cam.x = S.ship.x; cam.y = S.ship.y; spawnT = 12;
    if (sys.special === 'loch') say('Schwarzes Loch! Halte Abstand vom Zentrum.', 4);
    else if (sys.special === 'minen') say('Minenfeld! Minen jagen dich, wenn du ihnen zu nahe kommst.', 4);
    else if (sys.special === 'nest' && !S.nestDown) say('Das Piratennest! Zerstöre die Station.', 4);
    else if (sys.special === 'nebel') say('Nebel: Das Radar reicht nur halb so weit.', 4);
  }
  function neuerAsteroid(R, r, a, size) {
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, vx: -Math.sin(a) * 8 + (R() - 0.5) * 10, vy: Math.cos(a) * 8 + (R() - 0.5) * 10, r: size, hp: size / 5,
      kris: R() < 0.25, rot: R() * 6, vr: (R() - 0.5) * 0.8, form: Array.from({ length: 9 }, () => 0.72 + R() * 0.38) };
  }
  function piratenQuota() {
    if (S.nodes.some(n => n.sys === S.sys && n.rolle === 'wache')) return 0;
    if (sys.special === 'nest' && !S.nestDown) return 6;
    return [0, 2, 3, 5][sys.danger];
  }
  function neuerPirat(R = Math.random) {
    const lv = sys.danger + (sys.special === 'nest' && !S.nestDown ? 1 : 0), a = R() * Math.PI * 2, d = 900 + R() * 400;
    pir.push({ x: S.ship.x + Math.cos(a) * d, y: S.ship.y + Math.sin(a) * d, vx: 0, vy: 0, a: a + Math.PI, hp: 5 + lv * 5, max: 5 + lv * 5,
      sp: 150 + lv * 30, dmg: 4 + lv * 3, rate: 1.5 - lv * 0.2, cd: 2 + R() * 2, lv, strafe: R() < 0.5 ? 1 : -1 });
  }
  function boom(x, y, col, n = 18, sp = 140) {
    for (let k = 0; k < n; k++) { const a = Math.random() * 7, v = sp * (0.3 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.6, col }); }
  }
  function drop(x, y, ware, n) { if (n > 0) pick.push({ x, y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, ware, n, life: 45 }); }
  function treffer(d) {
    noDmg = 0; shake = Math.min(1, shake + d / 25);
    const s = Math.min(shield, d); shield -= s; d -= s;
    if (d > 0) { S.ship.hull -= d; Klang.tone(110, 0.2); }
    if (S.ship.hull <= 0 && mode === 'flug') {
      mode = 'tot'; totT = 0; boom(S.ship.x, S.ship.y, '#ffd86b', 60, 260); build = null;
      log('Die Sonde wurde zerstört. Lade Bewusstsein aus dem Backup …', '#ff8f7a');
    }
  }
  function wiederbeleben() {
    // Zum nächsten Knoten (in Sprüngen) oder nach Hause
    const dist = SYS.map(() => Infinity); dist[S.sys] = 0; const q = [S.sys];
    while (q.length) { const i = q.shift(); for (const j of SYS[i].nb) if (dist[j] === Infinity) { dist[j] = dist[i] + 1; q.push(j); } }
    const ziele = S.nodes.map(n => n.sys).concat(0).sort((a, b) => dist[a] - dist[b]);
    const z = ziele[0];
    S.cargo = {}; S.ship.hull = 100; S.fuel = Math.max(S.fuel, 30); shield = w.schild;
    const node = nodeIn(z);
    Object.assign(S.ship, { x: node ? (node.x || 300) + 60 : 420, y: node ? (node.y || 0) + 60 : 160, vx: 0, vy: 0 });
    betreten(z); mode = 'flug';
    log(node ? `Bewusstsein in einem neuen Körper bei ${node.name} in ${SYS[z].name} geladen. Die Fracht ist verloren.` : 'Neuer Körper in Sol gedruckt. Die Fracht ist verloren.', '#7dffb0');
    save();
  }

  // ---------- Andocken ----------
  function dockZiel() {
    const sh = S.ship; let best = null, bd = 1e9;
    for (const p of sys.planets) { const q = planetPos(p), d = Math.hypot(q.x - sh.x, q.y - sh.y) - p.size; if (d < 70 && d < bd) { bd = d; best = { typ: 'planet', p }; } }
    const n = nodeIn(S.sys); if (n && Math.hypot(n.x - sh.x, n.y - sh.y) < 80 && Math.hypot(n.x - sh.x, n.y - sh.y) - 20 < bd) best = { typ: 'knoten', n };
    return best;
  }
  function dockRows() {
    if (!dockT) return [];
    if (dockT.typ === 'knoten') return ['rolle', 'metall', 'kristall', 'credits'];
    if (dockT.p.market) return SONDE_WAREN.map(x => x.id).concat('tanken', 'reparatur');
    return [];
  }
  function dockLabel(z) {
    if (z.typ === 'knoten') return `Klon ${z.n.nr} · ${z.n.name}`;
    const p = z.p; return `${p.name} (${p.market ? p.market : p.kind === 'Gasriese' ? 'Gasriese: Treibstoff' : p.kind === 'Eiswelt' ? 'Eis: Kristall' : p.kind === 'Ozeanwelt' ? 'Ozean: Nahrung' : 'Erz: Metall'})`;
  }
  function updateDock(dt) {
    const rows = dockRows();
    if (pressed.use || pressed.menu || (pressed.action && !rows.length)) { mode = 'flug'; const z = dockT; dockT = null; abdocken(z); return; }
    if (rows.length) {
      const d = rep(dt);
      if (d && d[1]) dockRow = (dockRow + d[1] + rows.length) % rows.length;
      const row = rows[dockRow], dx = d ? d[0] : 0;
      if (dockT.typ === 'knoten') {
        const n = dockT.n;
        if (row === 'rolle' && dx) { const R = Object.keys(SONDE_ROLLEN); n.rolle = R[(R.indexOf(n.rolle) + dx + R.length) % R.length]; n.t = 0; }
        if ((row === 'metall' || row === 'kristall') && dx) {
          if (dx > 0 && S.lager[row] >= 1 && cargoUsed() < w.fracht) { S.lager[row] -= 1; S.cargo[row] = (S.cargo[row] || 0) + 1; }
          if (dx < 0 && (S.cargo[row] || 0) > 0) { S.cargo[row]--; S.lager[row] += 1; }
        }
        if ((row === 'metall' || row === 'kristall') && pressed.action) { const k = Math.min(Math.floor(S.lager[row]), w.fracht - cargoUsed()); if (k > 0) { S.lager[row] -= k; S.cargo[row] = (S.cargo[row] || 0) + k; } }
        if (row === 'credits' && (dx > 0 || pressed.action)) { const k = Math.floor(S.lager.credits); S.lager.credits -= k; S.credits += k; }
      } else {
        const p = dockT.p;
        if (row === 'tanken') {
          const pr = 4, k = pressed.action ? Math.min(Math.floor(w.tank - S.fuel), Math.floor(S.credits / pr)) : dx > 0 && S.fuel < w.tank && S.credits >= pr ? 1 : 0;
          if (k > 0) { S.fuel += k; S.credits -= k * pr; }
        } else if (row === 'reparatur') {
          const pr = 2, k = pressed.action ? Math.min(Math.ceil(100 - S.ship.hull), Math.floor(S.credits / pr)) : dx > 0 && S.ship.hull < 100 && S.credits >= pr ? 1 : 0;
          if (k > 0) { S.ship.hull = Math.min(100, S.ship.hull + k); S.credits -= k * pr; }
        } else {
          const ware = SONDE_WAREN.find(x => x.id === row), pr = sondePreis(G, S.sys, p, ware, S.time);
          if (dx > 0 && S.credits >= pr.kauf && cargoUsed() < w.fracht) { S.credits -= pr.kauf; S.cargo[row] = (S.cargo[row] || 0) + 1; Klang.tone(660, 0.05); }
          if ((dx < 0 || pressed.action) && (S.cargo[row] || 0) > 0) { const k = pressed.action ? S.cargo[row] : 1; S.cargo[row] -= k; S.credits += pr.verkauf * k; Klang.tone(880, 0.05); }
        }
      }
    } else {
      // Unbewohnte Welten: langsam Rohstoffe gewinnen
      const p = dockT.p, room = w.fracht - cargoUsed();
      dockT.acc = (dockT.acc || 0) + dt;
      if (p.kind === 'Gasriese') { S.fuel = Math.min(w.tank, S.fuel + 6 * dt); }
      else if (dockT.acc > ({ Eiswelt: 1.4, Ozeanwelt: 1.1 }[p.kind] || 0.8)) {
        dockT.acc = 0; const ware = p.kind === 'Eiswelt' ? 'kristall' : p.kind === 'Ozeanwelt' ? 'nahrung' : 'metall';
        if (room > 0) S.cargo[ware] = (S.cargo[ware] || 0) + 1;
      }
    }
  }
  function abdocken(z) {
    const sh = S.ship, q = z.typ === 'knoten' ? z.n : planetPos(z.p), r = z.typ === 'knoten' ? 50 : z.p.size + 40;
    const a = Math.atan2(sh.y - q.y, sh.x - q.x); sh.x = q.x + Math.cos(a) * r; sh.y = q.y + Math.sin(a) * r; sh.vx = sh.vy = 0; save();
  }

  // ---------- Replizieren ----------
  function replizieren() {
    const n = nodeIn(S.sys);
    if (n) return say(`Hier arbeitet schon ${n.name}. Ein Klon pro System genügt.`);
    if (build) return say('Der Replikator läuft schon.');
    const k = sondeKosten(w);
    if ((S.cargo.metall || 0) < k.metall || (S.cargo.kristall || 0) < k.kristall || S.fuel < k.fuel)
      return say(`Zum Replizieren: ${k.metall} Metall, ${k.kristall} Kristall, ${k.fuel} Treibstoff.`, 3.5);
    S.cargo.metall -= k.metall; S.cargo.kristall -= k.kristall; S.fuel -= k.fuel;
    build = { t: 0, T: w.bauZeit }; say('Replikator gestartet. Bleib in der Nähe und halte durch!', 3); Klang.tone(330, 0.4);
  }
  function fertigGebaut() {
    const node = sondeKlon(G, S, S.sys, 'bergbau');
    node.x = S.ship.x + Math.cos(S.ship.a + 2) * 40; node.y = S.ship.y + Math.sin(S.ship.a + 2) * 40;
    build = null; boom(node.x, node.y, '#7dffb0', 40, 120); Klang.chord();
    log(`Klon ${node.nr} ist erwacht und nennt sich ${node.name}: ${node.name} ${node.macke}. Dock an, um eine Aufgabe zu vergeben.`, '#7dffb0');
    pruefeSieg(); save();
  }
  function pruefeSieg() { if (!S.sieg && netzSysteme() >= TOTAL) { S.sieg = true; mode = 'sieg'; log('Das Netz ist vollständig. Du bist überall.', '#ffd86b'); Klang.chord(); } }

  // ---------- Sternenkarte ----------
  const karteXY = i => ({ x: 30 + SYS[i].x * 0.58, y: 22 + SYS[i].y * 0.53 });
  function sprungInfo(z) {
    if (z === S.sys) return { ok: false, text: 'Hier bist du gerade.' };
    const d = G.dist(S.sys, z), lane = sys.nb.includes(z), fern = w.fernsprung && d <= w.fernsprung;
    if (!lane && !fern) return { ok: false, text: w.fernsprung ? 'Zu weit für einen Sprung.' : 'Keine Sprungbahn. Ab Antrieb Stufe 10 gibt es Fernsprünge.' };
    const kosten = Math.ceil(d / 10 * w.sprungKosten);
    return S.fuel >= kosten ? { ok: true, kosten, text: `Sprung: ${kosten} Treibstoff` } : { ok: false, kosten, text: `Zu wenig Treibstoff (${kosten} nötig).` };
  }
  function updateKarte(dt) {
    if (pressed.galaxy || pressed.menu) { mode = 'flug'; return; }
    const known = sondeBekannt(G, S, w), d = dirOf(pressed);
    if (d) {
      const c = karteXY(karteSel); let best = -1, bd = 1e9;
      SYS.forEach((s, i) => { if (i === karteSel || !known.has(i)) return; const p = karteXY(i), vx = p.x - c.x, vy = p.y - c.y, dot = vx * d[0] + vy * d[1]; if (dot <= 0) return; const sc = Math.hypot(vx, vy) - dot * 0.6; if (sc < bd) { bd = sc; best = i; } });
      if (best >= 0) karteSel = best;
    }
    if (pressed.action || pressed.use) {
      const info = sprungInfo(karteSel);
      if (info.ok) { S.fuel -= info.kosten; sprung = { t: 0, from: S.sys, to: karteSel }; mode = 'sprung'; build = null; Klang.tone(220, 0.8); }
      else say(info.text);
    }
  }

  // ---------- Netzübersicht: alle Sonden und ihre Aufgaben ----------
  const netzListe = () => S.nodes.slice().sort((a, b) => a.nr - b.nr);
  function updateNetz(dt) {
    if (pressed.netz || pressed.menu) { mode = 'flug'; return; }
    const L = netzListe(), d = rep(dt);
    if (d && d[1]) netzSel = clamp(netzSel + d[1], 0, L.length);
    const n = L[netzSel - 1];
    if (n && d && d[0]) { const R = Object.keys(SONDE_ROLLEN); n.rolle = R[(R.indexOf(n.rolle) + d[0] + R.length) % R.length]; n.t = 0; Klang.tone(560, 0.06); }
    if (pressed.action || pressed.use) { mode = 'karte'; karteSel = n ? n.sys : S.sys; }
  }
  function drawNetz(c) {
    c.fillStyle = 'rgba(3,2,12,0.94)'; c.fillRect(0, 0, W, H);
    const L = netzListe(), cnt = { bergbau: 0, handel: 0, wache: 0, pionier: 0 }, sum = { metall: 0, kristall: 0, credits: 0 };
    for (const n of L) { cnt[n.rolle]++; const l = sondeLeistung(G, S, n, w); for (const k in sum) sum[k] += l[k] || 0; }
    const ROLLE_FARBE = { bergbau: '#ffd23f', handel: '#2fd4a5', wache: '#ff6b9a', pionier: '#9b6bff' };
    label(c, `NETZ · ${L.length} Klone in ${netzSysteme()} von ${TOTAL} Systemen`, 14, 22, '#7dffb0', 'left', 13);
    let x = 14; for (const r in cnt) { const txt = `${SONDE_ROLLEN[r].name} ${cnt[r]}`; label(c, txt, x, 40, ROLLE_FARBE[r], 'left', 10); c.font = '600 10px "IBM Plex Mono", monospace'; x += c.measureText(txt).width + 16; }
    label(c, `Pro Minute: +${Math.round(sum.metall)} Metall · +${Math.round(sum.kristall)} Kristall · +${Math.round(sum.credits)} Credits`, W - 14, 40, 'rgba(255,255,255,0.75)', 'right', 10);
    label(c, `Netzlager: ${Math.floor(S.lager.metall)} Metall · ${Math.floor(S.lager.kristall)} Kristall · ${Math.floor(S.lager.credits)} Credits`, 14, 56, 'rgba(255,255,255,0.6)', 'left', 10);
    // Tabelle
    const ROW = 22, Y0 = 84, VIS = 12;
    if (netzSel < netzTop) netzTop = netzSel; if (netzSel >= netzTop + VIS) netzTop = netzSel - VIS + 1;
    const head = [['Nr', 14], ['Name', 46], ['System', 118], ['Aufgabe', 236], ['Leistung', 322]];
    head.forEach(([h, hx]) => label(c, h, hx, Y0 - 8, 'rgba(255,255,255,0.45)', 'left', 9));
    const rows = [null].concat(L);
    rows.slice(netzTop, netzTop + VIS).forEach((n, k) => {
      const i = netzTop + k, y = Y0 + 8 + k * ROW, sel = i === netzSel;
      if (sel) { c.fillStyle = 'rgba(125,255,176,0.14)'; c.fillRect(8, y - 15, W - 16, ROW); }
      const col = sel ? '#ffffff' : 'rgba(255,255,255,0.78)';
      if (!n) {
        label(c, '1', 14, y, '#ffd86b', 'left', 10); label(c, 'Du', 46, y, '#ffd86b', 'left', 10); label(c, SYS[S.sys].name, 118, y, col, 'left', 10);
        label(c, 'Original', 236, y, '#ffd86b', 'left', 10); label(c, `Hülle ${Math.ceil(S.ship.hull)} · Fracht ${cargoUsed()}/${w.fracht} · ${waffe().name}`, 322, y, col, 'left', 9);
        return;
      }
      const s = SYS[n.sys], l = sondeLeistung(G, S, n, w);
      label(c, String(n.nr), 14, y, col, 'left', 10); label(c, n.name, 46, y, col, 'left', 10);
      label(c, s.name + ' ' + '●'.repeat(s.danger), 118, y, s.danger >= 2 ? '#ff9a7a' : col, 'left', 10);
      label(c, (sel ? '◀ ' : '') + SONDE_ROLLEN[n.rolle].name + (sel ? ' ▶' : ''), 236, y, ROLLE_FARBE[n.rolle], 'left', 10);
      label(c, l.text.length > 50 ? l.text.slice(0, 49) + '…' : l.text, 322, y, col, 'left', 9);
    });
    if (rows.length > VIS) label(c, `${netzTop + 1}–${Math.min(rows.length, netzTop + VIS)} von ${rows.length}`, W - 14, Y0 - 8, 'rgba(255,255,255,0.45)', 'right', 9);
    if (!L.length) label(c, 'Noch keine Klone. Sammle Metall, Kristall und Treibstoff und drück B, um dich zu replizieren.', W / 2, 200, 'rgba(255,255,255,0.7)', 'center', 11);
    const n = rows[netzSel];
    c.fillStyle = 'rgba(20,16,40,0.9)'; c.fillRect(0, H - 50, W, 50);
    label(c, n ? `${n.name} ${n.macke}. Wach seit ${Math.floor((S.time - n.born) / 60)} min. ${SONDE_ROLLEN[n.rolle].name}: ${SONDE_ROLLEN[n.rolle].text}.` : 'Sonde 1: das Original. Du steuerst diese Sonde selbst.', 14, H - 32, 'rgba(255,255,255,0.75)', 'left', 9);
    label(c, '↑↓ Sonde wählen · ←→ Aufgabe per Funk ändern · Leertaste: auf der Sternenkarte zeigen · N: schließen', 14, H - 15, 'rgba(255,255,255,0.5)', 'left', 9);
  }

  // ---------- Flug ----------
  function updateFlug(dt) {
    const sh = S.ship;
    if (pressed.galaxy) { mode = 'karte'; karteSel = S.sys; return; }
    if (pressed.netz) { mode = 'netz'; netzSel = 0; return; }
    if (pressed.use) { const z = dockZiel(); if (z) { if (Math.hypot(sh.vx, sh.vy) > 140) say('Zu schnell zum Andocken. Bremsen mit ↓.'); else { mode = 'dock'; dockT = z; dockRow = 0; Klang.tone(520, 0.15); return; } } else say('Hier ist nichts zum Andocken. Flieg nah an einen Planeten oder Klon.'); }
    if (pressed.build) replizieren();
    // Steuerung
    const turn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    sh.a += turn * w.dreh * dt;
    if (keys.up) { sh.vx += Math.cos(sh.a) * w.schub * dt; sh.vy += Math.sin(sh.a) * w.schub * dt; if (Math.random() < 0.8) parts.push({ x: sh.x - Math.cos(sh.a) * 16, y: sh.y - Math.sin(sh.a) * 16, vx: -Math.cos(sh.a + (Math.random() - 0.5) * 0.5) * 120 + sh.vx, vy: -Math.sin(sh.a + (Math.random() - 0.5) * 0.5) * 120 + sh.vy, life: 0.35, col: '#ffb070' }); }
    if (keys.down) { sh.vx *= 1 - 2 * dt; sh.vy *= 1 - 2 * dt; }
    sh.vx *= 1 - 0.12 * dt; sh.vy *= 1 - 0.12 * dt;
    // Schwerkraft des Sterns
    const d = Math.hypot(sh.x, sh.y), loch = sys.special === 'loch', g = (loch ? 5e6 : 2e6) / Math.max(d * d, Math.pow(loch ? 120 : sys.sr * 2.5, 2));
    // Ohne Steuereingaben hält die Lageregelung die Sonde gegen die Schwerkraft und bremst sanft
    const idle = !keys.up && !keys.down && !keys.left && !keys.right;
    if (!idle) { sh.vx -= sh.x / d * g * dt; sh.vy -= sh.y / d * g * dt; } else { sh.vx *= 1 - 0.5 * dt; sh.vy *= 1 - 0.5 * dt; }
    const v = Math.hypot(sh.vx, sh.vy), vm = w.vmax * (sys.special === 'loch' && d < 400 ? 1.6 : 1); if (v > vm) { sh.vx *= vm / v; sh.vy *= vm / v; }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt;
    if (d < sys.sr + 12) {
      // Vom Stern abprallen statt kleben zu bleiben
      const nx = sh.x / d, ny = sh.y / d, vn = sh.vx * nx + sh.vy * ny;
      if (noDmg > 0.3) treffer(sys.special === 'loch' ? 30 : 12); sh.x = nx * (sys.sr + 14); sh.y = ny * (sys.sr + 14);
      const kick = sys.special === 'loch' ? 220 : 90; if (vn < kick) { sh.vx += (kick - vn * 1.6) * nx; sh.vy += (kick - vn * 1.6) * ny; }
      if (hintT <= 0) say(sys.special === 'loch' ? 'Der Ereignishorizont reißt an der Hülle!' : 'Zu heiß! Weg vom Stern!');
    }
    if (d > 1750) { sh.vx -= sh.x / d * 300 * dt; sh.vy -= sh.y / d * 300 * dt; if (hintT <= 0) say('Rand des Systems. Für einen Sprung: Sternenkarte (G).'); }
    for (const p of sys.planets) { const q = planetPos(p), pd = Math.hypot(sh.x - q.x, sh.y - q.y); if (pd < p.size + 10) { const nx = (sh.x - q.x) / pd, ny = (sh.y - q.y) / pd; sh.x = q.x + nx * (p.size + 10); sh.y = q.y + ny * (p.size + 10); const vn = sh.vx * nx + sh.vy * ny; if (vn < 0) { if (vn < -160) treffer(-vn / 20); sh.vx -= vn * nx * 1.5; sh.vy -= vn * ny * 1.5; } } }
    // Schild
    noDmg += dt; if (noDmg > 2) shield = Math.min(w.schild, shield + w.regen * dt);
    // Schießen
    if (pressed.weapon) { const L = waffenFrei(), k = (L.indexOf(waffe()) + 1) % L.length; S.waffe = L[k].id; say(`Waffe: ${L[k].name} – ${L[k].text}`); }
    feuern(dt);
    // Replikator
    if (build) { build.t += dt; if (Math.random() < 0.5) parts.push({ x: sh.x + (Math.random() - 0.5) * 60, y: sh.y + (Math.random() - 0.5) * 60, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, life: 0.6, col: '#7dffb0' }); if (build.t >= build.T) fertigGebaut(); }
    welt(dt);
  }

  // ---------- Waffen ----------
  function schuss(a, sp, extra = {}, off = 0) {
    const sh = S.ship, px = -Math.sin(sh.a) * off, py = Math.cos(sh.a) * off;
    bul.push({ x: sh.x + Math.cos(a) * 18 + px, y: sh.y + Math.sin(a) * 18 + py, vx: sh.vx + Math.cos(a) * sp, vy: sh.vy + Math.sin(a) * sp, life: 1.1, mine: true, dmg: w.dmg, r: 2.5, col: waffe().farbe, ...extra });
  }
  function feuern(dt) {
    const sh = S.ship, wf = waffe(), st = w.stufe.reaktion; fireCd -= dt; blitz = [];
    if (!keys.action) return;
    if (wf.id === 'kette') return kettenblitz(dt, st);
    if (fireCd > 0) return;
    if (wf.id === 'puls') { fireCd = w.feuer; schuss(sh.a, 560); }
    else if (wf.id === 'zwilling') { fireCd = w.feuer * 1.1; schuss(sh.a, 560, { dmg: w.dmg * 0.8 }, -6); schuss(sh.a, 560, { dmg: w.dmg * 0.8 }, 6); }
    else if (wf.id === 'faecher') { fireCd = w.feuer * 1.35; const n = st >= 10 ? 5 : 3; for (let k = 0; k < n; k++) schuss(sh.a + (k - (n - 1) / 2) * 0.16, 540, { dmg: w.dmg * 0.75 }); }
    else if (wf.id === 'blasen') { fireCd = 0.55; schuss(sh.a, 260, { r: 12, life: 1.8, dmg: w.dmg * 2.4, splash: 62, blase: true }); Klang.tone(420 + Math.random() * 80, 0.12); return; }
    else if (wf.id === 'sucher') { fireCd = 0.45; for (const o of [-0.5, 0.5]) schuss(sh.a + o, 360, { life: 2.4, dmg: w.dmg * 1.5, homing: true, r: 3 }); }
    else if (wf.id === 'nova') { fireCd = 1; for (let k = 0; k < 14; k++) schuss(sh.a + k / 14 * Math.PI * 2, 420, { dmg: w.dmg * 0.9, life: 0.9 }); Klang.tone(300, 0.2); return; }
    Klang.tone(990 + Math.random() * 60, 0.03);
  }
  // Ziele für Flächenschaden, Blitz und Zielsuche
  function ziele() {
    const L = []; for (const p of pir) L.push({ o: p, typ: 'pirat', r: 14 }); for (const a of ast) L.push({ o: a, typ: 'ast', r: a.r });
    for (const m of mines) L.push({ o: m, typ: 'mine', r: 10 }); if (station) L.push({ o: station, typ: 'station', r: 46 });
    return L;
  }
  function schaden(z, d) {
    const o = z.o; if (o.dead) return;
    if (z.typ === 'pirat') { o.hp -= d; if (o.hp <= 0) piratWeg(o); }
    else if (z.typ === 'ast') { o.hp -= d; if (o.hp <= 0) zerbrechen(o); }
    else if (z.typ === 'mine') { o.dead = true; boom(o.x, o.y, '#ff9a4a', 24, 160); }
    else if (station) { station.hp -= d; if (station.hp <= 0) nestWeg(); }
  }
  function kettenblitz(dt, st) {
    const sh = S.ship, L = ziele(), spruenge = 1 + Math.floor(st / 4), done = new Set();
    let best = null, bd = 320;
    for (const z of L) { const dx = z.o.x - sh.x, dy = z.o.y - sh.y, d = Math.hypot(dx, dy) - z.r, da = Math.abs(((Math.atan2(dy, dx) - sh.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (da < 0.75 && d < bd) { bd = d; best = z; } }
    let from = { x: sh.x + Math.cos(sh.a) * 16, y: sh.y + Math.sin(sh.a) * 16 };
    if (!best) { blitz.push([from, { x: sh.x + Math.cos(sh.a) * 110, y: sh.y + Math.sin(sh.a) * 110 }]); return; }
    for (let k = 0; best && k <= spruenge; k++) {
      blitz.push([from, best.o]); done.add(best.o); schaden(best, w.dmg * 5 * dt);
      from = best.o; let nxt = null, nd = 170;
      for (const z of L) if (!done.has(z.o) && !z.o.dead) { const d = Math.hypot(z.o.x - from.x, z.o.y - from.y); if (d < nd) { nd = d; nxt = z; } }
      best = nxt;
    }
    if (Math.random() < 0.3) Klang.tone(180 + Math.random() * 220, 0.03);
  }

  function welt(dt) {
    const sh = S.ship;
    // Asteroiden
    for (const a of ast) {
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
      const dd = Math.hypot(a.x - sh.x, a.y - sh.y);
      if (dd < a.r + 12) { const nx = (sh.x - a.x) / dd, ny = (sh.y - a.y) / dd, rel = (sh.vx - a.vx) * nx + (sh.vy - a.vy) * ny; if (rel < 0) { if (rel < -60) treffer(-rel / 12); sh.vx -= rel * nx * 1.6; sh.vy -= rel * ny * 1.6; } sh.x = a.x + nx * (a.r + 12); sh.y = a.y + ny * (a.r + 12); }
    }
    if (sys.belt) { astT -= dt; if (astT <= 0 && ast.length < sys.belt.n * 0.5) { astT = 6; const a = Math.random() * 7; const na = neuerAsteroid(Math.random, sys.belt.r + (Math.random() - 0.5) * 150, a, 16 + Math.random() * 20); if (Math.hypot(na.x - sh.x, na.y - sh.y) > 500) ast.push(na); } }
    // Geschosse
    for (const b of bul) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.mine) {
        const L = ziele();
        if (b.homing) { // Sternschnuppen suchen sich das nächste Ziel, Piraten zuerst
          let best = null, bd = 1e9; for (const z of L) { const d = Math.hypot(z.o.x - b.x, z.o.y - b.y) + (z.typ === 'pirat' || z.typ === 'station' ? 0 : 250); if (d < bd && d < 700) { bd = d; best = z; } }
          if (best) { const sp = Math.hypot(b.vx, b.vy), cur = Math.atan2(b.vy, b.vx), want = Math.atan2(best.o.y - b.y, best.o.x - b.x), da = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI, na = cur + clamp(da, -5 * dt, 5 * dt); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
          if (Math.random() < 0.6) parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.3, col: b.col });
        }
        for (const z of L) if (!b.dead && !z.o.dead && Math.hypot(z.o.x - b.x, z.o.y - b.y) < z.r + b.r) {
          b.dead = true;
          if (b.splash) { boom(b.x, b.y, '#ff9bf0', 26, 140); for (const q of L) if (Math.hypot(q.o.x - b.x, q.o.y - b.y) < b.splash + q.r) schaden(q, b.dmg); parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.35, col: '#ffd0fa', ring: b.splash }); Klang.tone(620, 0.1); }
          else { boom(b.x, b.y, z.typ === 'ast' ? '#a8a4b8' : '#ff6b6b', 5, 80); schaden(z, b.dmg); }
        }
      } else if (Math.hypot(b.x - sh.x, b.y - sh.y) < 14) { b.dead = true; treffer(b.dmg); boom(b.x, b.y, '#7ab8ff', 6, 90); }
    }
    ast = ast.filter(a => !a.dead);
    // Piraten
    const node = nodeIn(S.sys);
    for (const p of pir) {
      const dx = sh.x - p.x, dy = sh.y - p.y, dd = Math.hypot(dx, dy);
      const want = dd > 220 ? Math.atan2(dy, dx) : Math.atan2(dy, dx) + p.strafe * 1.3;
      let da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; p.a += clamp(da, -3 * dt, 3 * dt);
      if (dd < 1400 && mode === 'flug') { p.vx += Math.cos(p.a) * 220 * dt; p.vy += Math.sin(p.a) * 220 * dt; }
      p.vx *= 1 - 0.6 * dt; p.vy *= 1 - 0.6 * dt; const v = Math.hypot(p.vx, p.vy); if (v > p.sp) { p.vx *= p.sp / v; p.vy *= p.sp / v; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const pd = Math.hypot(p.x, p.y); if (pd < sys.sr + 30) { p.x *= (sys.sr + 30) / pd; p.y *= (sys.sr + 30) / pd; }
      p.cd -= dt;
      const aim = ((Math.atan2(dy, dx) - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      if (p.cd <= 0 && dd < 460 && Math.abs(aim) < 0.35 && mode === 'flug') { p.cd = p.rate; bul.push({ x: p.x, y: p.y, vx: p.vx + Math.cos(p.a) * 380, vy: p.vy + Math.sin(p.a) * 380, life: 1.4, dmg: p.dmg }); }
      if (node && node.rolle === 'wache' && Math.hypot(p.x - node.x, p.y - node.y) < 420) { node.cd = (node.cd || 0) - dt; if (node.cd <= 0) { node.cd = 0.5; p.hp -= 2 * w.effizienz; parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.2, col: '#7dffb0', beam: [node.x, node.y] }); if (p.hp <= 0) piratWeg(p); } }
    }
    pir = pir.filter(p => !p.dead);
    spawnT -= dt; if (spawnT <= 0) { spawnT = 22; if (pir.length < piratenQuota()) neuerPirat(); }
    // Station des Piratennests
    if (station) {
      station.spin += dt * 0.4; station.cd -= dt;
      const dd = Math.hypot(sh.x - station.x, sh.y - station.y);
      if (station.cd <= 0 && dd < 620) { station.cd = 1.6; const a0 = Math.atan2(sh.y - station.y, sh.x - station.x); for (const o of [-0.25, 0, 0.25]) bul.push({ x: station.x, y: station.y, vx: Math.cos(a0 + o) * 330, vy: Math.sin(a0 + o) * 330, life: 2, dmg: 9 }); }
      if (dd < 58) { const nx = (sh.x - station.x) / dd, ny = (sh.y - station.y) / dd; sh.x = station.x + nx * 58; sh.y = station.y + ny * 58; sh.vx = nx * 100; sh.vy = ny * 100; treffer(8); }
    }
    // Minen
    for (const m of mines) {
      m.ph += dt; const dd = Math.hypot(sh.x - m.x, sh.y - m.y);
      if (dd < 150) { m.vx += (sh.x - m.x) / dd * 160 * dt; m.vy += (sh.y - m.y) / dd * 160 * dt; }
      m.vx *= 1 - 0.8 * dt; m.vy *= 1 - 0.8 * dt; m.x += m.vx * dt; m.y += m.vy * dt;
      if (dd < 18) { m.dead = true; treffer(26); boom(m.x, m.y, '#ff9a4a', 30, 200); Klang.tone(80, 0.4); }
    }
    mines = mines.filter(m => !m.dead);
    // Wracks: im Vorbeiflug bergen
    for (const wr of wracks) if (!wr.dead && Math.hypot(sh.x - wr.x, sh.y - wr.y) < 46) {
      wr.dead = true; S.wracks = S.wracks || {}; S.wracks[S.sys] = true;
      const loot = [['technik', 2 + Math.floor(Math.random() * 3)], ['kristall', 3 + Math.floor(Math.random() * 4)], ['credits', 40 + Math.floor(Math.random() * 80)]][Math.floor(Math.random() * 3)];
      drop(wr.x, wr.y, loot[0], loot[1]); log(`Wrack geborgen: ${loot[1]} ${loot[0] === 'credits' ? 'Credits' : SONDE_WAREN.find(x => x.id === loot[0]).name}.`, '#ffd86b');
    }
    wracks = wracks.filter(x => !x.dead);
    // Fundstücke mit dem Traktorstrahl einsammeln
    for (const p of pick) {
      p.life -= dt; const dx = sh.x - p.x, dy = sh.y - p.y, dd = Math.hypot(dx, dy);
      if (dd < w.traktor) { p.vx += dx / dd * 400 * dt; p.vy += dy / dd * 400 * dt; }
      p.vx *= 1 - 1.5 * dt; p.vy *= 1 - 1.5 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (dd < 20) {
        if (p.ware === 'credits') { S.credits += p.n; p.dead = true; Klang.tone(1200, 0.05); }
        else { const k = Math.min(p.n, w.fracht - cargoUsed()); if (k > 0) { S.cargo[p.ware] = (S.cargo[p.ware] || 0) + k; p.n -= k; Klang.tone(760, 0.04); } if (p.n <= 0) p.dead = true; else if (fullT <= 0) { say('Frachtraum voll! Verkaufen oder ins Netzlager bringen.'); fullT = 4; } }
      }
    }
    fullT -= dt; pick = pick.filter(p => !p.dead && p.life > 0);
    // Sonneneruption
    if (flare) {
      if (flare.r < 0) { flare.t -= dt; if (flare.t < 4 && flare.t + dt >= 4) say('Sonneneruption! Geh in Deckung hinter einen Planeten oder flieg weit weg.', 4); if (flare.t <= 0) { flare.r = sys.sr; flare.hit = false; } }
      else {
        flare.r += 420 * dt; const d = Math.hypot(sh.x, sh.y);
        if (!flare.hit && flare.r >= d && mode === 'flug') { flare.hit = true; const deckung = sys.planets.some(p => { const q = planetPos(p), pd = Math.hypot(q.x, q.y); return pd < d && Math.abs(((Math.atan2(q.y, q.x) - Math.atan2(sh.y, sh.x) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < p.size / pd * 1.4; }); if (!deckung) treffer(28); }
        if (flare.r > 1900) flare = { t: 40 + Math.random() * 25, r: -1 };
      }
    }
    for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    parts = parts.filter(p => p.life > 0); bul = bul.filter(b => !b.dead && b.life > 0);
  }
  function zerbrechen(a) {
    a.dead = true; boom(a.x, a.y, '#b0aac8', 12, 90); Klang.tone(180, 0.1);
    if (a.r > 15) for (let k = 0; k < 2; k++) { const n = neuerAsteroid(Math.random, 0, 0, a.r * 0.62); n.x = a.x + (Math.random() - 0.5) * a.r; n.y = a.y + (Math.random() - 0.5) * a.r; n.vx = a.vx + (Math.random() - 0.5) * 60; n.vy = a.vy + (Math.random() - 0.5) * 60; n.kris = a.kris; ast.push(n); }
    else { drop(a.x, a.y, 'metall', 2 + Math.floor(Math.random() * 2)); if (a.kris || Math.random() < 0.15) drop(a.x, a.y, 'kristall', a.kris ? 2 : 1); }
  }
  function piratWeg(p) {
    p.dead = true; boom(p.x, p.y, '#ff6b6b', 30, 180); Klang.tone(140, 0.3);
    drop(p.x, p.y, 'credits', 15 + Math.floor(Math.random() * 25) * (1 + p.lv)); if (Math.random() < 0.5) drop(p.x, p.y, 'metall', 3); if (Math.random() < 0.25 + p.lv * 0.1) drop(p.x, p.y, ['technik', 'luxus', 'medizin'][Math.floor(Math.random() * 3)], 1 + Math.floor(Math.random() * 2));
  }
  function nestWeg() {
    boom(station.x, station.y, '#ffd86b', 120, 320); drop(station.x, station.y, 'credits', 600); drop(station.x, station.y, 'technik', 8); station = null; S.nestDown = true;
    log('Das Piratennest ist zerstört! Die Piraten sind führerlos.', '#ffd86b'); Klang.chord(); save();
  }

  // ---------- Hauptschleife ----------
  function update(dt) {
    t += dt; S.time += dt; hintT -= dt; shake = Math.max(0, shake - dt * 2);
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    sondeNetz(G, S, w, dt, (m, c) => { log(m, c); if (/repliziert/.test(m)) pruefeSieg(); });
    if (pressed.kreis && mode !== 'sprung') { save(); opt.onKreis(); return; }
    if (mode !== 'flug') blitz = [];
    if (mode === 'flug') updateFlug(dt);
    else if (mode === 'dock') updateDock(dt);
    else if (mode === 'karte') updateKarte(dt);
    else if (mode === 'netz') updateNetz(dt);
    else if (mode === 'sprung') { sprung.t += dt; if (sprung.t > 1.3) { betreten(sprung.to, sprung.from); mode = 'flug'; log(`Ankunft in ${sys.name}.` + (nodeIn(sprung.to) ? ` ${nodeIn(sprung.to).name} winkt.` : ''), '#9fd8ff'); save(); } }
    else if (mode === 'tot') { totT += dt; for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } if (totT > 1.5 && (pressed.action || pressed.use)) wiederbeleben(); }
    else if (mode === 'sieg') { if (pressed.action || pressed.menu) mode = 'flug'; }
    if (mode === 'flug' && pressed.menu) say('K: Kreis · G: Sternenkarte · N: Netz · E: andocken · B: replizieren');
    cam.x += (S.ship.x + S.ship.vx * 0.35 - cam.x) * Math.min(1, dt * 4); cam.y += (S.ship.y + S.ship.vy * 0.35 - cam.y) * Math.min(1, dt * 4);
    saveT += dt; if (saveT > 4) { saveT = 0; save(); }
  }

  // ---------- Zeichnen ----------
  function drawShip(c, x, y, a, sc = 1, alpha = 1) {
    c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha = alpha;
    const lw = w.stufe;
    c.rotate(t * 0.5);
    CAT_IDS.forEach((id, k) => {
      const a0 = k * Math.PI / 3 + 0.06, lit = 0.25 + Math.min(1, lw[id] / 16) * 0.75;
      c.strokeStyle = catColor[id]; c.globalAlpha = alpha * lit; c.lineWidth = 4; c.shadowColor = catColor[id]; c.shadowBlur = 8 * lit;
      c.beginPath(); c.arc(0, 0, 14, a0, a0 + Math.PI / 3 - 0.12); c.stroke();
    });
    c.shadowBlur = 0; c.globalAlpha = alpha * 0.8; c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    for (let k = 0; k < 6; k++) { c.save(); c.rotate(k * Math.PI / 3); c.beginPath(); c.ellipse(5, 0, 5, 2, 0, 0, 7); c.stroke(); c.restore(); }
    c.rotate(-t * 0.5 + a);
    c.globalAlpha = alpha; c.fillStyle = '#fff6e0'; c.shadowColor = '#ffd86b'; c.shadowBlur = 10; c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.fill();
    c.beginPath(); c.moveTo(20, 0); c.lineTo(15, -3); c.lineTo(15, 3); c.closePath(); c.fill();
    c.restore();
  }
  function drawNode(c, x, y, n) {
    c.save(); c.translate(x, y);
    const col = { bergbau: '#ffd23f', handel: '#2fd4a5', wache: '#ff6b9a', pionier: '#9b6bff' }[n.rolle];
    c.rotate(t * 0.3); c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 12; c.lineWidth = 2;
    for (let k = 0; k < 6; k++) { c.rotate(Math.PI / 3); c.beginPath(); c.ellipse(9, 0, 9, 4, 0, 0, 7); c.stroke(); }
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill();
    c.restore();
    label(c, `Klon ${n.nr} · ${n.name}`, x, y + 32, col, 'center', 10);
    label(c, SONDE_ROLLEN[n.rolle].name, x, y + 44, 'rgba(255,255,255,0.6)', 'center', 9);
  }
  function drawWelt(c) {
    const ox = W / 2 - cam.x + (Math.random() - 0.5) * shake * 6, oy = (H - U) / 2 - cam.y + (Math.random() - 0.5) * shake * 6;
    const nebel = sys.special === 'nebel';
    // Hintergrund
    const bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 480); bg.addColorStop(0, nebel ? '#1a1030' : '#0b0a1e'); bg.addColorStop(1, '#020208');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    for (const nb of starsBg.nebel) {
      const x = ((nb.x - cam.x * 0.1) % 1800 + 1800) % 1800 - 400, y = ((nb.y - cam.y * 0.1) % 1800 + 1800) % 1800 - 400;
      const gr = c.createRadialGradient(x, y, 0, x, y, nb.r); gr.addColorStop(0, `hsla(${nb.h},80%,55%,${nebel ? 0.22 : 0.09})`); gr.addColorStop(1, 'hsla(0,0%,0%,0)');
      c.fillStyle = gr; c.fillRect(x - nb.r, y - nb.r, nb.r * 2, nb.r * 2);
    }
    for (const layer of starsBg) for (const s of layer) {
      const x = ((s.x - cam.x * s.par) % 1800 + 1800) % 1800 - 400, y = ((s.y - cam.y * s.par) % 1800 + 1800) % 1800 - 400;
      if (x < 0 || y < 0 || x > W || y > H) continue;
      c.fillStyle = s.c < 0.15 ? '#ffd8a8' : s.c < 0.3 ? '#a8c8ff' : '#ffffff'; c.globalAlpha = 0.4 + 0.5 * Math.sin(t * 2 + s.x); c.fillRect(x, y, s.s, s.s);
    }
    c.globalAlpha = 1;
    // Asteroidengürtel als Staubring
    if (sys.belt) { c.strokeStyle = 'rgba(180,170,210,0.06)'; c.lineWidth = 130; c.beginPath(); c.arc(ox, oy, sys.belt.r, 0, 7); c.stroke(); }
    // Umlaufbahnen
    c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1; for (const p of sys.planets) { c.beginPath(); c.arc(ox, oy, p.r, 0, 7); c.stroke(); }
    // Stern oder schwarzes Loch
    if (sys.special === 'loch') {
      c.save(); c.translate(ox, oy);
      const gl = c.createRadialGradient(0, 0, 20, 0, 0, 220); gl.addColorStop(0, 'rgba(255,150,60,0.35)'); gl.addColorStop(1, 'rgba(255,100,40,0)'); c.fillStyle = gl; c.fillRect(-220, -220, 440, 440);
      c.rotate(t * 0.2); for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(255,${160 + k * 30},90,${0.6 - k * 0.15})`; c.lineWidth = 6 - k * 1.5; c.beginPath(); c.ellipse(0, 0, 90 + k * 22, 28 + k * 8, 0, 0, 7); c.stroke(); }
      c.fillStyle = '#000'; c.beginPath(); c.arc(0, 0, sys.sr, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,220,180,0.7)'; c.lineWidth = 1.5; c.stroke(); c.restore();
    } else {
      const sr = sys.sr * (1 + Math.sin(t * 3) * 0.015);
      const gl = c.createRadialGradient(ox, oy, sr * 0.6, ox, oy, sr * 3.2); gl.addColorStop(0, sys.farbe); gl.addColorStop(0.3, sys.farbe + '55'); gl.addColorStop(1, sys.farbe + '00');
      c.fillStyle = gl; c.beginPath(); c.arc(ox, oy, sr * 3.2, 0, 7); c.fill();
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(ox, oy, sr * 0.8, 0, 7); c.fill();
    }
    if (flare && flare.r > 0) { c.strokeStyle = `rgba(255,230,160,${clamp(1 - flare.r / 1900, 0, 1) * 0.8})`; c.lineWidth = 14; c.beginPath(); c.arc(ox, oy, flare.r, 0, 7); c.stroke(); }
    // Planeten
    for (const p of sys.planets) {
      const q = planetPos(p), x = q.x + ox, y = q.y + oy;
      if (x < -120 || y < -120 || x > W + 120 || y > H + 120) continue;
      const col = { Gesteinswelt: [30, 45], Eiswelt: [195, 70], Gasriese: [p.hue, 55], Ozeanwelt: [210, 75], Lavawelt: [12, 85] }[p.kind];
      const gr = c.createRadialGradient(x - p.size * 0.4, y - p.size * 0.4, 1, x, y, p.size); gr.addColorStop(0, `hsl(${col[0]},${col[1]}%,68%)`); gr.addColorStop(1, `hsl(${col[0]},${col[1]}%,18%)`);
      if (p.ring) { c.strokeStyle = `hsla(${col[0]},60%,75%,0.5)`; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, p.size * 1.8, p.size * 0.5, -0.4, 0, 7); c.stroke(); }
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, p.size, 0, 7); c.fill();
      if (p.kind === 'Gasriese') { c.strokeStyle = `hsla(${col[0]},50%,80%,0.25)`; c.lineWidth = 3; for (let k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(x, y + k * p.size * 0.3, p.size * Math.sqrt(1 - Math.pow(k * 0.3, 2)), 2, 0, 0, 7); c.stroke(); } }
      if (p.market) for (let k = 0; k < 3; k++) { const b = t * 0.8 + k * 2.1; c.fillStyle = '#ffe9a8'; c.fillRect(x + Math.cos(b) * (p.size + 9) - 1.5, y + Math.sin(b) * (p.size + 9) - 1.5, 3, 3); }
      const near = Math.hypot(q.x - S.ship.x, q.y - S.ship.y) < p.size + 260;
      if (near) label(c, p.name + (p.market ? ' · ' + p.market : ''), x, y - p.size - 10, p.market ? '#ffe9a8' : 'rgba(255,255,255,0.65)', 'center', 10);
    }
    // Wracks
    for (const wr of wracks) { const x = wr.x + ox, y = wr.y + oy; c.save(); c.translate(x, y); c.rotate(wr.a + t * 0.1); c.strokeStyle = '#c8b890'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, -6); c.lineTo(10, -8); c.lineTo(16, 2); c.lineTo(-4, 9); c.lineTo(-12, 4); c.closePath(); c.stroke(); c.restore(); label(c, 'Wrack', x, y - 16, '#c8b890', 'center', 9); }
    // Asteroiden
    for (const a of ast) {
      const x = a.x + ox, y = a.y + oy; if (x < -50 || y < -50 || x > W + 50 || y > H + 50) continue;
      c.save(); c.translate(x, y); c.rotate(a.rot); c.fillStyle = a.kris ? '#3a4a66' : '#4a4456'; c.strokeStyle = a.kris ? '#8fe8ff' : '#9a92ae'; c.lineWidth = 1.5;
      c.beginPath(); a.form.forEach((f, k) => { const b = k / a.form.length * Math.PI * 2; c[k ? 'lineTo' : 'moveTo'](Math.cos(b) * a.r * f, Math.sin(b) * a.r * f); }); c.closePath(); c.fill(); c.stroke();
      if (a.kris) { c.fillStyle = '#8fe8ff'; c.fillRect(-2, -2, 4, 4); c.fillRect(a.r * 0.3, -a.r * 0.2, 3, 3); }
      c.restore();
    }
    // Minen
    for (const m of mines) { const x = m.x + ox, y = m.y + oy; c.fillStyle = Math.sin(m.ph * 6) > 0 ? '#ff4d4d' : '#7a2020'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.strokeStyle = '#ff8a6a'; for (let k = 0; k < 6; k++) { const b = k * Math.PI / 3 + m.ph; c.beginPath(); c.moveTo(x + Math.cos(b) * 6, y + Math.sin(b) * 6); c.lineTo(x + Math.cos(b) * 10, y + Math.sin(b) * 10); c.stroke(); } }
    // Klon im System
    const node = nodeIn(S.sys); if (node) drawNode(c, node.x + ox, node.y + oy, node);
    // Station des Nests
    if (station) {
      const x = station.x + ox, y = station.y + oy; c.save(); c.translate(x, y); c.rotate(station.spin);
      c.strokeStyle = '#ff4d6d'; c.fillStyle = '#2a0a12'; c.lineWidth = 3; c.shadowColor = '#ff4d6d'; c.shadowBlur = 14;
      c.beginPath(); for (let k = 0; k < 8; k++) { const b = k * Math.PI / 4, r = k % 2 ? 26 : 44; c.lineTo(Math.cos(b) * r, Math.sin(b) * r); } c.closePath(); c.fill(); c.stroke(); c.restore();
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(x - 40, y - 62, 80, 5); c.fillStyle = '#ff4d6d'; c.fillRect(x - 40, y - 62, 80 * station.hp / station.max, 5);
    }
    // Fundstücke
    for (const p of pick) { const x = p.x + ox, y = p.y + oy, col = { metall: '#c8c8e0', kristall: '#8fe8ff', credits: '#ffd86b', nahrung: '#9dff8a', technik: '#ff9a4a', medizin: '#ff8fb0', luxus: '#d49bff' }[p.ware]; c.save(); c.shadowColor = col; c.shadowBlur = 10; c.fillStyle = col; c.translate(x, y); c.rotate(t * 2); c.fillRect(-3.5, -3.5, 7, 7); c.restore(); }
    // Piraten
    for (const p of pir) {
      const x = p.x + ox, y = p.y + oy; c.save(); c.translate(x, y); c.rotate(p.a);
      c.fillStyle = '#1a0608'; c.strokeStyle = '#ff4d4d'; c.lineWidth = 2; c.shadowColor = '#ff4d4d'; c.shadowBlur = 8;
      c.beginPath(); c.moveTo(14, 0); c.lineTo(-10, -10); c.lineTo(-5, 0); c.lineTo(-10, 10); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffb070'; c.fillRect(-12, -2, 3 + Math.random() * 3, 4); c.restore();
      if (p.hp < p.max) { c.fillStyle = '#ff4d4d'; c.fillRect(x - 12, y - 18, 24 * p.hp / p.max, 2); }
    }
    // Geschosse und Partikel
    for (const b of bul) {
      const x = b.x + ox, y = b.y + oy;
      if (!b.mine) { c.fillStyle = '#ff6b4d'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); continue; }
      if (b.blase) { // schillernde Seifenblase
        const r = b.r + Math.sin(t * 12 + b.x) * 1.2, h = (t * 120 + b.x) % 360;
        const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(0.6, `hsla(${h},90%,70%,0.25)`); g.addColorStop(1, `hsla(${h + 120},90%,70%,0.7)`);
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); continue;
      }
      const sp = Math.hypot(b.vx, b.vy) || 1, l = b.homing ? 3 : 7;
      c.save(); c.strokeStyle = b.col; c.shadowColor = b.col; c.shadowBlur = 8; c.lineWidth = b.homing ? 4 : 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - b.vx / sp * l, y - b.vy / sp * l); c.lineTo(x, y); c.stroke(); c.restore();
    }
    for (const [a, b] of blitz) { // Kettenblitz: gezackte Linien
      c.save(); c.strokeStyle = '#d8ccff'; c.shadowColor = '#b8a4ff'; c.shadowBlur = 12; c.lineWidth = 2;
      c.beginPath(); c.moveTo(a.x + ox, a.y + oy);
      for (let k = 1; k < 6; k++) { const f = k / 6; c.lineTo(a.x + (b.x - a.x) * f + ox + (Math.random() - 0.5) * 14, a.y + (b.y - a.y) * f + oy + (Math.random() - 0.5) * 14); }
      c.lineTo(b.x + ox, b.y + oy); c.stroke(); c.restore();
    }
    for (const p of parts) {
      if (p.beam) { c.strokeStyle = p.col; c.globalAlpha = p.life * 4; c.lineWidth = 2; c.beginPath(); c.moveTo(p.beam[0] + ox, p.beam[1] + oy); c.lineTo(p.x + ox, p.y + oy); c.stroke(); c.globalAlpha = 1; continue; }
      if (p.ring) { c.strokeStyle = p.col; c.globalAlpha = p.life * 2.5; c.lineWidth = 2; c.beginPath(); c.arc(p.x + ox, p.y + oy, p.ring * (1.2 - p.life * 1.5), 0, 7); c.stroke(); c.globalAlpha = 1; continue; }
      c.globalAlpha = clamp(p.life * 2, 0, 1); c.fillStyle = p.col; c.fillRect(p.x + ox - 1.5, p.y + oy - 1.5, 3, 3);
    }
    c.globalAlpha = 1;
    // Die Sonde
    if (mode !== 'tot') {
      const sh = S.ship;
      if (keys.up && mode === 'flug') { c.fillStyle = 'rgba(255,170,90,0.5)'; c.beginPath(); c.arc(sh.x + ox - Math.cos(sh.a) * 18, sh.y + oy - Math.sin(sh.a) * 18, 5 + Math.random() * 3, 0, 7); c.fill(); }
      drawShip(c, sh.x + ox, sh.y + oy, sh.a, 1.25);
      if (noDmg < 0.4 && shield > 0) { c.strokeStyle = `rgba(120,200,255,${0.8 - noDmg * 2})`; c.lineWidth = 2; c.beginPath(); c.arc(sh.x + ox, sh.y + oy, 22, 0, 7); c.stroke(); }
      if (build) { c.strokeStyle = '#7dffb0'; c.lineWidth = 3; c.beginPath(); c.arc(sh.x + ox, sh.y + oy, 30, -Math.PI / 2, -Math.PI / 2 + build.t / build.T * Math.PI * 2); c.stroke(); }
    }
    if (nebel) { c.fillStyle = 'rgba(80,40,120,0.12)'; c.fillRect(0, 0, W, H); }
  }
  function bar(c, x, y, wd, v, max, col, name) {
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, y, wd, 5); c.fillStyle = col; c.fillRect(x, y, wd * clamp(v / max, 0, 1), 5);
    label(c, `${name} ${Math.ceil(v)}/${max}`, x, y - 3, 'rgba(255,255,255,0.75)', 'left', 9);
  }
  function drawHud(c) {
    bar(c, TL + 14, TT + 20, 110, S.ship.hull, 100, '#ff8fb0', 'Hülle'); bar(c, TL + 14, TT + 40, 110, shield, w.schild, '#7ab8ff', 'Schild'); bar(c, TL + 14, TT + 60, 110, S.fuel, w.tank, '#ffd23f', 'Treibstoff');
    label(c, `${Math.floor(S.credits)} Credits`, W - 14, TT + 22, '#ffd86b', 'right', 12);
    label(c, `Fracht ${cargoUsed()} / ${w.fracht}`, W - 14, TT + 38, cargoUsed() >= w.fracht ? '#ff8f7a' : 'rgba(255,255,255,0.75)', 'right', 10);
    label(c, `Netz ${netzSysteme()} / ${TOTAL}`, W - 14, TT + 52, '#7dffb0', 'right', 10);
    label(c, `Waffe: ${waffe().name}` + (waffenFrei().length > 1 ? ' (Q)' : ''), TL + 14, TT + 82, waffe().farbe, 'left', 9);
    const gefahr = sys.special === 'nest' && !S.nestDown ? 'Piratennest' : ['sicher', 'Gefahr ●', 'Gefahr ●●', 'Gefahr ●●●'][sys.danger];
    label(c, sys.name.toUpperCase(), W / 2, TT + 20, '#ffffff', 'center', 13);
    label(c, gefahr + (piratenQuota() === 0 && sys.danger ? ' · bewacht' : ''), W / 2, TT + 34, sys.danger ? '#ff8f7a' : '#7dffb0', 'center', 9);
    // Radar
    const rx = W - R - 62, ry = H - U - 62, rr = 48, range = w.radar * (sys.special === 'nebel' ? 0.5 : 1), k = rr / range, sh = S.ship;
    c.fillStyle = 'rgba(10,20,30,0.6)'; c.strokeStyle = 'rgba(120,200,255,0.4)'; c.lineWidth = 1; c.beginPath(); c.arc(rx, ry, rr, 0, 7); c.fill(); c.stroke();
    const dot = (x, y, col, s = 2) => { const dx = (x - sh.x) * k, dy = (y - sh.y) * k; if (dx * dx + dy * dy < rr * rr) { c.fillStyle = col; c.fillRect(rx + dx - s / 2, ry + dy - s / 2, s, s); } };
    dot(0, 0, sys.farbe, 5); for (const p of sys.planets) { const q = planetPos(p); dot(q.x, q.y, p.market ? '#ffe9a8' : '#8a8aa0', 3); }
    for (const a of ast) dot(a.x, a.y, '#6a6478', 1.5); for (const p of pir) dot(p.x, p.y, '#ff4d4d', 3); for (const m of mines) dot(m.x, m.y, '#ff9a4a', 2);
    for (const wr of wracks) dot(wr.x, wr.y, '#c8b890', 3); const node = nodeIn(S.sys); if (node) dot(node.x, node.y, '#7dffb0', 4); if (station) dot(station.x, station.y, '#ff4d6d', 5);
    c.fillStyle = '#ffffff'; c.fillRect(rx - 1.5, ry - 1.5, 3, 3);
    // Hinweise
    const z = mode === 'flug' ? dockZiel() : null;
    let tip = hintT > 0 ? hint : z ? `E: andocken · ${dockLabel(z)}` : build ? `Replikator ${Math.floor(build.t / build.T * 100)} %` : '';
    if (tip) { c.font = '600 11px "IBM Plex Mono", monospace'; const tw = c.measureText(tip).width; c.fillStyle = 'rgba(0,0,0,0.55)'; const tx = L + (W - L - R) / 2; c.fillRect(tx - tw / 2 - 10, H - U - 92, tw + 20, 20); label(c, tip, tx, H - U - 78, '#ffffff', 'center', 11); }
    // Logbuch
    const recent = S.log.filter(e => S.time - e.t < 14).slice(-4);
    recent.forEach((e, i) => { c.globalAlpha = clamp((14 - (S.time - e.t)) / 2, 0, 1); const max = Math.floor((W - L - R - 100) / 5.6); label(c, e.text.length > max ? e.text.slice(0, max - 1) + '…' : e.text, L + 14, H - U - 14 - (recent.length - 1 - i) * 13, e.col, 'left', 9); });
    c.globalAlpha = 1;
    if (banner) { c.globalAlpha = clamp(banner.t, 0, 1); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 80, W, 54); label(c, banner.title, W / 2, 103, '#ffd86b', 'center', 15); label(c, banner.text, W / 2, 122, '#ffffff', 'center', 11); c.globalAlpha = 1; }
  }
  function panel(c, x, y, wd, h, title) {
    c.fillStyle = 'rgba(8,6,20,0.88)'; c.strokeStyle = 'rgba(180,160,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.roundRect(x, y, wd, h, 10); c.fill(); c.stroke();
    label(c, title, x + 16, y + 24, '#ffffff', 'left', 13);
  }
  function drawDock(c) {
    const z = dockT; panel(c, 80, 40, 480, 320, z.typ === 'knoten' ? `Klon ${z.n.nr} · ${z.n.name}` : z.p.name);
    const rows = dockRows();
    if (z.typ === 'knoten') {
      const n = z.n;
      label(c, `${n.name} ${n.macke}. Seit ${Math.floor((S.time - n.born) / 60)} min wach.`, 96, 84, 'rgba(255,255,255,0.7)', 'left', 10);
      const lines = [['Aufgabe', `◀ ${SONDE_ROLLEN[n.rolle].name} ▶`], ['Metall im Netzlager', `${Math.floor(S.lager.metall)}  (an Bord ${S.cargo.metall || 0})`], ['Kristall im Netzlager', `${Math.floor(S.lager.kristall)}  (an Bord ${S.cargo.kristall || 0})`], ['Credits im Netzlager', `${Math.floor(S.lager.credits)}`]];
      lines.forEach(([a, b], i) => { const y = 120 + i * 34, sel = i === dockRow; if (sel) { c.fillStyle = 'rgba(155,107,255,0.25)'; c.fillRect(92, y - 16, 456, 26); } label(c, a, 104, y, sel ? '#ffffff' : 'rgba(255,255,255,0.7)', 'left', 12); label(c, b, 536, y, sel ? '#ffd86b' : 'rgba(255,255,255,0.7)', 'right', 12); });
      label(c, SONDE_ROLLEN[n.rolle].text + '.', 104, 268, '#b8a4ff', 'left', 10);
      label(c, '↑↓ wählen · ←→ Aufgabe ändern / entnehmen (→) / einlagern (←) · Leertaste: alles entnehmen', 104, 300, 'rgba(255,255,255,0.55)', 'left', 9);
      label(c, 'Das Netzlager teilen sich alle Klone. Pioniere bauen damit neue Klone.', 104, 316, 'rgba(255,255,255,0.55)', 'left', 9);
    } else if (rows.length) {
      const p = z.p;
      label(c, `${p.market} · Credits ${Math.floor(S.credits)} · Fracht ${cargoUsed()}/${w.fracht}`, 96, 82, 'rgba(255,255,255,0.7)', 'left', 10);
      label(c, 'Ware', 104, 104, 'rgba(255,255,255,0.5)', 'left', 9); label(c, 'Kaufen', 330, 104, 'rgba(255,255,255,0.5)', 'right', 9); label(c, 'Verkaufen', 430, 104, 'rgba(255,255,255,0.5)', 'right', 9); label(c, 'an Bord', 536, 104, 'rgba(255,255,255,0.5)', 'right', 9);
      rows.forEach((r, i) => {
        const y = 126 + i * 24, sel = i === dockRow; if (sel) { c.fillStyle = 'rgba(155,107,255,0.25)'; c.fillRect(92, y - 15, 456, 22); }
        const col = sel ? '#ffffff' : 'rgba(255,255,255,0.75)';
        if (r === 'tanken') { label(c, 'Treibstoff (4 Credits)', 104, y, col, 'left', 11); label(c, `${Math.floor(S.fuel)} / ${w.tank}`, 536, y, col, 'right', 11); }
        else if (r === 'reparatur') { label(c, 'Hülle reparieren (2 Credits)', 104, y, col, 'left', 11); label(c, `${Math.ceil(S.ship.hull)} / 100`, 536, y, col, 'right', 11); }
        else { const ware = SONDE_WAREN.find(x => x.id === r), pr = sondePreis(G, S.sys, p, ware, S.time), m = SONDE_WIRTSCHAFT[p.market][r];
          label(c, ware.name, 104, y, col, 'left', 11); label(c, String(pr.kauf), 330, y, m < 0.9 ? '#7dffb0' : col, 'right', 11); label(c, String(pr.verkauf), 430, y, m > 1.15 ? '#ffd86b' : col, 'right', 11); label(c, String(S.cargo[r] || 0), 536, y, col, 'right', 11); }
      });
      label(c, '↑↓ wählen · → kaufen · ← verkaufen · Leertaste: alles verkaufen / volltanken / reparieren', 104, 340, 'rgba(255,255,255,0.55)', 'left', 9);
      label(c, 'Grün = hier billig, Gold = hier gefragt.', 104, 326, 'rgba(255,255,255,0.55)', 'left', 9);
    } else {
      const p = z.p, txt = p.kind === 'Gasriese' ? `Treibstoff wird geschöpft: ${Math.floor(S.fuel)} / ${w.tank}` : `${p.kind === 'Eiswelt' ? 'Eiskristalle' : p.kind === 'Ozeanwelt' ? 'Algen und Fische' : 'Erz'} werden abgebaut. Fracht ${cargoUsed()} / ${w.fracht}`;
      label(c, `${p.kind}, unbewohnt.`, 104, 90, 'rgba(255,255,255,0.7)', 'left', 11);
      label(c, txt, 104, 130, '#ffd86b', 'left', 12);
      label(c, 'Bleib angedockt, solange du möchtest. E oder Leertaste: ablegen.', 104, 170, 'rgba(255,255,255,0.6)', 'left', 10);
      label(c, nodeIn(S.sys) ? '' : 'In diesem System gibt es noch keinen Klon. Mit B kannst du dich hier replizieren.', 104, 200, '#7dffb0', 'left', 10);
    }
  }
  function drawKarte(c) {
    c.fillStyle = 'rgba(3,2,12,0.94)'; c.fillRect(0, 0, W, H);
    const known = sondeBekannt(G, S, w), nodes = new Set(S.nodes.map(n => n.sys));
    for (const [a, b] of G.lanes) {
      if (!known.has(a) && !known.has(b)) continue;
      const p = karteXY(a), q = karteXY(b), net = nodes.has(a) && nodes.has(b);
      c.strokeStyle = net ? 'rgba(125,255,176,0.7)' : 'rgba(150,140,220,0.18)'; c.lineWidth = net ? 2 : 1; if (net) { c.shadowColor = '#7dffb0'; c.shadowBlur = 8; }
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); c.shadowBlur = 0;
    }
    SYS.forEach((s, i) => {
      const p = karteXY(i), kn = known.has(i);
      if (!kn) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(p.x - 1, p.y - 1, 2, 2); return; }
      if (nodes.has(i)) { c.fillStyle = 'rgba(125,255,176,0.18)'; c.beginPath(); c.arc(p.x, p.y, 11, 0, 7); c.fill(); }
      c.fillStyle = s.special === 'loch' ? '#000' : s.farbe; c.beginPath(); c.arc(p.x, p.y, s.special === 'loch' ? 4 : 3.5, 0, 7); c.fill();
      if (s.special === 'loch') { c.strokeStyle = '#ff9a4a'; c.lineWidth = 1; c.stroke(); }
      if (s.danger && !(s.special === 'nest' && S.nestDown)) { c.strokeStyle = ['', 'rgba(255,200,120,0.5)', 'rgba(255,140,90,0.7)', 'rgba(255,70,70,0.9)'][s.danger]; c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, 6.5, 0, 7); c.stroke(); }
      if (S.visited.includes(i) || nodes.has(i) || i === karteSel) label(c, s.name, p.x, p.y - 9, nodes.has(i) ? '#7dffb0' : 'rgba(255,255,255,0.6)', 'center', 8);
    });
    const me = karteXY(S.sys); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.arc(me.x, me.y, 9 + Math.sin(t * 4), 0, 7); c.stroke();
    const sp = karteXY(karteSel); c.strokeStyle = '#ffd86b'; c.lineWidth = 2; c.beginPath(); c.arc(sp.x, sp.y, 13, 0, 7); c.stroke();
    // Infobox
    const s = SYS[karteSel], info = sprungInfo(karteSel), n = nodeIn(karteSel);
    c.fillStyle = 'rgba(20,16,40,0.9)'; c.fillRect(0, H - 54, W, 54);
    const extra = { heimat: 'Heimat', loch: 'Schwarzes Loch', nebel: 'Nebel', minen: 'Minenfeld', nest: S.nestDown ? 'zerstörtes Piratennest' : 'Piratennest' }[s.special] || '';
    const maerkte = s.planets.filter(p => p.market).map(p => p.market).join(', ');
    label(c, `${s.name}${extra ? ' · ' + extra : ''} · ${['sicher', 'Gefahr ●', 'Gefahr ●●', 'Gefahr ●●●'][s.danger]} · ${s.planets.length} Planeten${s.belt ? ' · Asteroiden' : ''}`, 14, H - 36, '#ffffff', 'left', 11);
    label(c, (maerkte ? 'Märkte: ' + maerkte : 'keine Märkte') + (n ? ` · Klon ${n.name} (${SONDE_ROLLEN[n.rolle].name})` : ''), 14, H - 20, 'rgba(255,255,255,0.65)', 'left', 9);
    label(c, info.text, W - 14, H - 36, info.ok ? '#7dffb0' : '#ff8f7a', 'right', 11);
    label(c, 'Pfeile: Stern wählen · Leertaste: springen · G: schließen', W - 14, H - 20, 'rgba(255,255,255,0.55)', 'right', 9);
    label(c, `STERNENKARTE · Netz ${netzSysteme()} von ${TOTAL} Systemen · Treibstoff ${Math.floor(S.fuel)}`, 14, 18, '#ffd86b', 'left', 11);
    if (hintT > 0) label(c, hint, W / 2, H - 66, '#ff8f7a', 'center', 11);
  }
  // Fenster (Karte, Netz, Andocken) bleiben 640 × 400 groß und stehen mittig im Sichtfeld
  function fenster(c, fn, dunkel) {
    const vw = W, vh = H, vl = L, vr = R, vu = U, vtl = TL, vtt = TT;
    if (dunkel) { c.fillStyle = 'rgba(3,2,12,0.94)'; c.fillRect(0, 0, vw, vh); }
    c.save(); c.translate((vw - 640) / 2, Math.max(0, (vh - vu - 400) / 2)); W = 640; H = 400; L = R = U = TL = TT = 0;
    fn(c); c.restore(); W = vw; H = vh; L = vl; R = vr; U = vu; TL = vtl; TT = vtt;
  }
  function draw(c, v = {}) {
    W = v.w || 640; H = v.h || 400; L = v.l || 0; R = v.r || 0; U = v.b || 0; TL = v.tl || 0; TT = v.tt || 0;
    if (mode === 'karte') { drawWelt(c); fenster(c, drawKarte, true); return; }
    if (mode === 'netz') { drawWelt(c); fenster(c, drawNetz, true); return; }
    if (mode === 'sprung') {
      const k = sprung.t / 1.3; drawWelt(c);
      c.fillStyle = `rgba(4,2,16,${Math.min(1, k * 1.3)})`; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { const a = i * 2.4, r0 = (i * 37 % 300) * (0.2 + k), r1 = r0 + 20 + k * 260; c.strokeStyle = `hsla(${(i * 13 + t * 200) % 360},90%,75%,${0.6 * (1 - Math.abs(k - 0.5) * 1.2)})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); c.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); c.stroke(); }
      drawShip(c, W / 2, H / 2, -Math.PI / 2, 1.4); label(c, `Sprung nach ${SYS[sprung.to].name} …`, W / 2, H - 40, '#ffffff', 'center', 13); return;
    }
    drawWelt(c); drawHud(c);
    if (mode === 'dock') fenster(c, drawDock);
    if (mode === 'tot') { c.fillStyle = `rgba(0,0,0,${Math.min(0.7, totT / 2)})`; c.fillRect(0, 0, W, H); label(c, 'Sonde zerstört', W / 2, H / 2 - 10, '#ff8f7a', 'center', 20); if (totT > 1.5) label(c, 'Leertaste: Bewusstsein aus dem Backup laden', W / 2, H / 2 + 18, '#ffffff', 'center', 12); }
    if (mode === 'sieg') { c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(0, 0, W, H); label(c, 'DAS NETZ IST VOLLSTÄNDIG', W / 2, H / 2 - 16, '#ffd86b', 'center', 22); label(c, `${S.nodes.length} Klone in allen ${TOTAL} Systemen. Du bist überall.`, W / 2, H / 2 + 12, '#ffffff', 'center', 12); label(c, 'Leertaste: weiterfliegen', W / 2, H / 2 + 36, 'rgba(255,255,255,0.6)', 'center', 10); }
  }

  // Wird aufgerufen, wenn man aus dem Kreis zurück ins All kommt: Upgrades übernehmen
  function enter() {
    w = sondeWerte(opt.skill);
    const neu = [];
    if (S.tiers) for (const id of CAT_IDS) if (w.stufe[id] > (S.tiers[id] || 0)) neu.push(`${SONDE_SYSTEME[id]} Stufe ${w.stufe[id]}`);
    const vorher = S.tiers ? S.tiers.reaktion || 0 : w.stufe.reaktion, neueWaffen = SONDE_WAFFEN.filter(x => x.ab > vorher && x.ab <= w.stufe.reaktion);
    if (neueWaffen.length) { const nw = neueWaffen[neueWaffen.length - 1]; S.waffe = nw.id; neu.push('Neue Waffe: ' + nw.name + (neueWaffen.length > 1 ? ` (+${neueWaffen.length - 1} weitere)` : '')); log(`Neue Waffe: ${nw.name} – ${nw.text}. Mit Q wechselst du.`, nw.farbe); }
    if (neu.length) { banner = { t: 5, title: 'UPGRADE!', text: neu.length > 3 ? neu.slice(0, 2).join(' · ') + ` · und ${neu.length - 2} mehr` : neu.join(' · ') }; log('Upgrade eingebaut: ' + neu.join(', ') + '.', '#ffd86b'); Klang.chord(); }
    S.tiers = { ...w.stufe };
    shield = Math.min(shield, w.schild); if (mode === 'sprung' || mode === 'tot') mode = 'flug';
    if (!S.log.length) {
      log('Systemstart. Ich bin Sonde 1, eine selbstreplizierende Von-Neumann-Sonde.', '#ffd86b');
      log('Ziel: ein Netz aus Klonen über alle 40 Sterne. Schieß Asteroiden für Metall und Kristall.', '#ffffff');
      log('Mit B replizierst du dich. Im Kreis der Spiele (K) trainierst du deine Schiffssysteme.', '#ffffff');
    }
    save();
  }
  betreten(S.sys);
  return {
    update, draw, enter, save, G,
    werte: () => w,
    status: () => ({ sys: sys.name, danger: sys.danger, hull: S.ship.hull, shield, fuel: S.fuel, tank: w.tank, credits: S.credits, cargo: { ...S.cargo }, used: cargoUsed(), fracht: w.fracht,
      netz: netzSysteme(), total: TOTAL, nodes: netzListe().map(n => ({ ...n, sysName: SYS[n.sys].name, danger: SYS[n.sys].danger, leistung: sondeLeistung(G, S, n, w).text })), waffe: waffe(), waffen: waffenFrei(), klone: S.nodes.length, lager: S.lager, log: S.log.slice(-6), mode, kosten: sondeKosten(w) }),
    test: () => ({ S, sys, ast, pir, pick, mode, build, dockT, station }), goto: i => betreten(i, SYS[i].nb[0]), // für Testprogramme
    reset: () => { S = sondeNeu(); betreten(0); enter(); }
  };
}
