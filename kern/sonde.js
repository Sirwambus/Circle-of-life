/* =====================================================================
   SONDE – Galaxie, Handel und das Netz der Klone. Reine Spiellogik ohne Zeichnen,
   damit sie sich in Node testen lässt. Benutzt rng() und clamp() aus dem Kern.
   ===================================================================== */
const SONDE_WAREN = [
  { id: 'metall', name: 'Metall', base: 12 },
  { id: 'kristall', name: 'Kristall', base: 30 },
  { id: 'nahrung', name: 'Nahrung', base: 16 },
  { id: 'technik', name: 'Technik', base: 60 },
  { id: 'medizin', name: 'Medizin', base: 44 },
  { id: 'luxus', name: 'Luxusgüter', base: 90 }
];
// Was eine Welt billig herstellt (< 1) und was sie dringend braucht (> 1)
const SONDE_WIRTSCHAFT = {
  Agrarwelt: { nahrung: 0.5, technik: 1.3, medizin: 1.25, metall: 1.2, luxus: 1.1, kristall: 1 },
  Industriewelt: { technik: 0.6, metall: 1.35, kristall: 1.25, nahrung: 1.3, medizin: 1, luxus: 1.1 },
  Bergbauwelt: { metall: 0.5, kristall: 0.6, nahrung: 1.45, medizin: 1.4, luxus: 1.25, technik: 1.15 },
  Forschungswelt: { medizin: 0.55, technik: 0.85, kristall: 1.45, nahrung: 1.2, luxus: 1.1, metall: 1.1 },
  Paradieswelt: { luxus: 0.5, nahrung: 0.8, technik: 1.4, metall: 1.3, kristall: 1.2, medizin: 1.1 }
};
const SONDE_ROLLEN = {
  bergbau: { name: 'Bergbau', text: 'baut Metall und Kristall ab und füllt das Netzlager' },
  handel: { name: 'Handel', text: 'treibt Handel mit den Bewohnern und verdient Credits' },
  wache: { name: 'Wache', text: 'vertreibt Piraten und schützt das System' },
  pionier: { name: 'Pionier', text: 'repliziert sich mit Rohstoffen aus dem Netzlager in Nachbarsysteme' }
};
// Waffen werden mit der Stufe des Waffensystems (Reaktion) freigeschaltet
const SONDE_WAFFEN = [
  { id: 'puls', name: 'Pulslaser', ab: 0, farbe: '#e8fbff', text: 'einzelne Lichtschüsse' },
  { id: 'zwilling', name: 'Zwillingslaser', ab: 2, farbe: '#9fe8ff', text: 'zwei parallele Schüsse' },
  { id: 'faecher', name: 'Fächer', ab: 4, farbe: '#ffd86b', text: 'drei Schüsse im Fächer, ab Stufe 10 fünf' },
  { id: 'blasen', name: 'Blasenwerfer', ab: 6, farbe: '#ff9bf0', text: 'schillernde Blasen, die platzen und alles ringsum treffen' },
  { id: 'kette', name: 'Kettenblitz', ab: 8, farbe: '#b8a4ff', text: 'ein Dauerblitz, der von Ziel zu Ziel springt' },
  { id: 'sucher', name: 'Sternschnuppen', ab: 11, farbe: '#7dffb0', text: 'zielsuchende Geschosse' },
  { id: 'nova', name: 'Nova', ab: 14, farbe: '#ffb070', text: 'ein Ring aus Licht in alle Richtungen' }
];
const SONDE_NAMEN = ['Hugo', 'Quirin', 'Edda', 'Bruno', 'Mila', 'Otto', 'Fritzi', 'Gustav', 'Ilse', 'Kuno', 'Lotte', 'Moritz', 'Nele', 'Paul', 'Rosa', 'Theo',
  'Ulla', 'Vinz', 'Wanda', 'Xaver', 'Yara', 'Zeno', 'Anton', 'Berta', 'Carlo', 'Dora', 'Emil', 'Frieda', 'Greta', 'Hanno', 'Ida', 'Jonas', 'Karla',
  'Leo', 'Momo', 'Nils', 'Oskar', 'Pia', 'Rudi', 'Smilla', 'Tilda', 'Ole', 'Juna', 'Fiete', 'Alma'];
const SONDE_MACKEN = ['tauft jeden Asteroiden', 'spricht nur in Reimen', 'komponiert Sphärenmusik', 'hält Piraten für eine Sportart', 'sammelt Sonnenaufgänge',
  'zählt Sterne, um einzuschlafen', 'trainiert heimlich Memory', 'philosophiert über Unendlichkeit', 'baut Modellsonden', 'liest alte Funksprüche',
  'misstraut schwarzen Löchern', 'liebt Gasriesen', 'meditiert im Sonnenwind', 'schreibt ein Logbuch in Haikus', 'hat Heimweh nach dem Ursprung'];
const SONDE_FUNK = [
  n => `${n}: Ich habe einen Asteroiden nach dir benannt.`,
  n => `${n}: Die Sterne hier summen in D-Moll.`,
  n => `${n}: Ich bin du, aber mit besserem Humor.`,
  n => `${n}: Lagerbestand geprüft. Alles im grünen Bereich.`,
  n => `${n}: Hab gerade eine Komet-Polonaise beobachtet.`,
  n => `${n}: Wusstest du, dass Kristalle im Dunkeln leise knistern?`,
  n => `${n}: Kein Pirat in Sicht. Langweilig. Schön.`,
  n => `${n}: Ich übe Kreis-Spiele im Kopf. Rechenblitz ist mein Favorit.`,
  n => `${n}: Neue Theorie: Das Universum ist ein sehr großer Kreis.`,
  n => `${n}: Ich vermisse unsere gemeinsame Zeit als eine einzige Sonde.`
];

function makeGalaxie(seed = 11) {
  const R = rng(seed), N = 40, GW = 1000, GH = 620;
  const pick = a => a[Math.floor(R() * a.length)];
  const SYL = ['ka', 'lo', 'mi', 'ra', 'ven', 'tor', 'sel', 'dra', 'ny', 'qua', 'zer', 'ul', 'an', 'bel', 'cor', 'dis', 'fa', 'gor', 'hel', 'is',
    'jun', 'kel', 'lum', 'mar', 'nox', 'or', 'pel', 'rin', 'tar', 'vel', 'wyn', 'xa', 'yr', 'zan', 'eo', 'ith'];
  const used = new Set();
  function makeName() {
    for (;;) {
      let s = ''; const n = 2 + (R() < 0.35 ? 1 : 0); for (let i = 0; i < n; i++) s += pick(SYL);
      s = s[0].toUpperCase() + s.slice(1); if (R() < 0.18) s += pick([' Prime', ' Minor', ' Major', '-Tor']);
      if (!used.has(s)) { used.add(s); return s; }
    }
  }
  // Sterne verteilen (Mindestabstand), die Heimat liegt nahe der Mitte
  const sys = [{ x: GW * 0.5, y: GH * 0.52 }];
  while (sys.length < N) {
    const x = 40 + R() * (GW - 80), y = 40 + R() * (GH - 80);
    if (sys.every(s => Math.hypot(s.x - x, s.y - y) > 78)) sys.push({ x, y });
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // Sprungbahnen: je die drei nächsten Nachbarn, dann alles zusammenhängend machen
  const lanes = new Set(), key = (a, b) => a < b ? a + '-' + b : b + '-' + a;
  sys.forEach((s, i) => sys.map((t, j) => [j, dist(s, t)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j]) => lanes.add(key(i, j))));
  const comp = sys.map((_, i) => i), find = i => comp[i] === i ? i : (comp[i] = find(comp[i]));
  for (const k of lanes) { const [a, b] = k.split('-').map(Number); comp[find(a)] = find(b); }
  for (;;) {
    const roots = new Set(sys.map((_, i) => find(i))); if (roots.size === 1) break;
    let best = null;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (find(i) !== find(j) && (!best || dist(sys[i], sys[j]) < best[2])) best = [i, j, dist(sys[i], sys[j])];
    lanes.add(key(best[0], best[1])); comp[find(best[0])] = find(best[1]);
  }
  const nb = sys.map(() => []);
  for (const k of lanes) { const [a, b] = k.split('-').map(Number); nb[a].push(b); nb[b].push(a); }
  // Gefahr wächst mit dem Abstand zur Heimat (in Sprüngen)
  const hops = sys.map(() => Infinity); hops[0] = 0; const q = [0];
  while (q.length) { const i = q.shift(); for (const j of nb[i]) if (hops[j] === Infinity) { hops[j] = hops[i] + 1; q.push(j); } }
  const maxH = Math.max(...hops);
  const STARS = [['gelb', '#ffd86b'], ['orange', '#ff9a4a'], ['rot', '#ff5a4a'], ['weiß', '#eaf2ff'], ['blau', '#7ab8ff']];
  const KINDS = ['Gesteinswelt', 'Eiswelt', 'Gasriese', 'Ozeanwelt', 'Lavawelt'];
  const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const far = sys.map((_, i) => i).sort((a, b) => hops[b] - hops[a]);
  const special = {};
  special[far[0]] = 'nest';
  far.slice(1, 12).filter((_, k) => k % 5 === 1).slice(0, 2).forEach(i => special[i] = 'loch');
  sys.map((_, i) => i).filter(i => i && !special[i]).sort(() => R() - 0.5).slice(0, 8).forEach((i, k) => special[i] = k < 4 ? 'nebel' : k < 7 ? 'minen' : special[i]);
  const systems = sys.map((s, i) => {
    const danger = i === 0 ? 0 : special[i] === 'nest' ? 3 : clamp(Math.round(hops[i] / maxH * 3 + (R() - 0.5) * 0.8), 0, 3);
    const [stern, farbe] = i === 0 ? STARS[0] : pick(STARS);
    const sp = i === 0 ? 'heimat' : special[i] || null;
    const np = sp === 'loch' ? 1 : i === 0 ? 4 : 1 + Math.floor(R() * 4.6);
    const planets = []; let r = 300 + R() * 80;
    for (let k = 0; k < np; k++) {
      const kind = i === 0 ? ['Lavawelt', 'Ozeanwelt', 'Gasriese', 'Eiswelt'][k] : pick(KINDS);
      const inhabitable = kind === 'Ozeanwelt' || kind === 'Gesteinswelt' || (kind === 'Eiswelt' && R() < 0.3);
      const market = sp !== 'loch' && sp !== 'nest' && (i === 0 ? k === 1 : inhabitable && R() < 0.62) ? pick(Object.keys(SONDE_WIRTSCHAFT)) : null;
      planets.push({ name: (i === 0 && k === 1 ? 'Erde' : ''), kind, r, a0: R() * Math.PI * 2, w: (0.012 + R() * 0.02) * (R() < 0.5 ? -1 : 1) * 300 / r,
        size: kind === 'Gasriese' ? 36 + R() * 16 : 14 + R() * 12, market, hue: Math.floor(R() * 360), ring: kind === 'Gasriese' && R() < 0.5 });
      r += 190 + R() * 170;
    }
    return { i, x: s.x, y: s.y, name: i === 0 ? 'Sol' : makeName(), stern, farbe, sr: sp === 'loch' ? 34 : 50 + R() * 50, special: sp, danger,
      flare: sp !== 'loch' && (stern === 'blau' || stern === 'weiß') && R() < 0.75,
      belt: i === 0 || (sp !== 'loch' && R() < 0.65) ? { r: 0, n: 16 + Math.floor(R() * 14) } : null,
      wracks: sp === 'loch' ? 5 : R() < 0.3 ? 1 + Math.floor(R() * 3) : 0, planets, nb: nb[i], hops: hops[i], seed: Math.floor(R() * 1e9) };
  });
  systems.forEach(s => {
    s.planets.forEach((p, k) => { if (!p.name) p.name = s.name + ' ' + ROM[k]; });
    if (s.belt) { const rs = s.planets.map(p => p.r); let br = 520; for (let t = 0; t < 20; t++) { const c = 380 + R() * 900; if (rs.every(r => Math.abs(r - c) > 110)) { br = c; break; } } s.belt.r = br; }
  });
  return { systems, lanes: [...lanes].map(k => k.split('-').map(Number)), W: GW, H: GH, dist: (a, b) => dist(systems[a], systems[b]) };
}

// Werte der Schiffssysteme aus dem Fortschritt im Kreis (je Kategorie 0–160 geschaffte Level)
function sondeWerte(skill) {
  const f = id => clamp(skill(id) / 160, 0, 1), st = id => Math.floor(skill(id) / 10);
  return {
    stufe: { reaktion: st('reaktion'), tempo: st('tempo'), gedaechtnis: st('gedaechtnis'), logik: st('logik'), koordination: st('koordination'), fokus: st('fokus') },
    dmg: 1 + f('reaktion') * 7, feuer: 0.34 - f('reaktion') * 0.2,
    schub: 190 + f('tempo') * 260, vmax: 230 + f('tempo') * 260, sprungKosten: 1 - f('tempo') * 0.55, fernsprung: st('tempo') >= 10 ? 260 : 0,
    fracht: 100 + Math.round(f('gedaechtnis') * 200), tank: 60 + Math.round(f('gedaechtnis') * 140),
    bauKosten: 1 - f('logik') * 0.55, bauZeit: 20 - f('logik') * 13, effizienz: 1 + f('logik') * 2,
    dreh: 2.6 + f('koordination') * 3, traktor: 50 + f('koordination') * 110,
    schild: 20 + Math.round(f('fokus') * 160), regen: 3 + f('fokus') * 12, radar: 650 + f('fokus') * 1100, weitblick: st('fokus') >= 8
  };
}
const SONDE_SYSTEME = { reaktion: 'Waffen', tempo: 'Antrieb', gedaechtnis: 'Speicher', logik: 'Replikator', koordination: 'Steuerung', fokus: 'Sensoren & Schilde' };
const SONDE_SYSTEM_TEXT = {
  reaktion: 'mehr Schaden, schnelleres Feuer und neue Waffen',
  tempo: 'mehr Schub und Tempo, billigere Sprünge, ab Stufe 10 Fernsprünge',
  gedaechtnis: 'größerer Frachtraum und Tank',
  logik: 'billigere und schnellere Replikation, fleißigere Klone',
  koordination: 'wendigeres Schiff, stärkerer Traktorstrahl',
  fokus: 'stärkere Schilde, weiteres Radar, ab Stufe 8 Weitblick'
};

function sondeKosten(w) { return { metall: Math.ceil(50 * w.bauKosten), kristall: Math.ceil(20 * w.bauKosten), fuel: Math.ceil(25 * w.bauKosten) }; }

function sondeNeu() {
  return { v: 1, sys: 0, ship: { x: 420, y: 160, vx: 0, vy: 0, a: -Math.PI / 2, hull: 100 }, fuel: 50, credits: 120,
    cargo: { metall: 18, kristall: 6 }, lager: { metall: 0, kristall: 0, credits: 0 }, nodes: [], visited: [0], klone: 0, time: 0,
    log: [], tiers: null, nestDown: false, sieg: false, funkT: 40, raidT: 0 };
}

// Welche Systeme die Sonde kennt: besuchte, Knoten und deren Nachbarn (mit Weitblick zwei Sprünge)
function sondeBekannt(G, S, w) {
  const k = new Set(), add = (i, depth) => { k.add(i); if (depth > 0) for (const j of G.systems[i].nb) add(j, depth - 1); };
  for (const i of S.visited) add(i, 1);
  for (const n of S.nodes) add(n.sys, w && w.weitblick ? 2 : 1);
  add(S.sys, w && w.weitblick ? 2 : 1);
  return k;
}

function sondePreis(G, sysI, planet, ware, time) {
  const m = SONDE_WIRTSCHAFT[planet.market][ware.id] || 1;
  const drift = 1 + 0.14 * Math.sin(time / (90 + ware.base) + G.systems[sysI].seed % 100 + ware.base);
  const p = ware.base * m * drift;
  return { kauf: Math.max(1, Math.round(p * 1.08)), verkauf: Math.max(1, Math.round(p * 0.92)) };
}

// Ein neuer Klon entsteht im System sysI
function sondeKlon(G, S, sysI, rolle, R = Math.random) {
  S.klone++;
  // Jeder Klon sucht sich einen Namen aus, den noch keiner trägt (danach mit Zusatz: Hugo II …)
  const used = new Set(S.nodes.map(n => n.name)), frei = SONDE_NAMEN.filter(x => !used.has(x));
  let name = frei.length ? frei[Math.floor(R() * frei.length)] : null;
  for (let k = 2; !name; k++) { const c = SONDE_NAMEN[Math.floor(R() * SONDE_NAMEN.length)] + ' ' + ['', '', 'II', 'III', 'IV', 'V', 'VI'][Math.min(k, 6)]; if (!used.has(c)) name = c; }
  const node = { sys: sysI, nr: S.klone + 1, name, macke: SONDE_MACKEN[Math.floor(R() * SONDE_MACKEN.length)],
    rolle: rolle || 'bergbau', t: 0, born: S.time };
  S.nodes.push(node);
  return node;
}

// Das Netz arbeitet: Bergbau, Handel, Pioniere, Überfälle, Funksprüche. log(text, farbe) meldet etwas.
// Was ein Klon pro Minute leistet (dieselben Zahlen nutzt sondeNetz)
function sondeLeistung(G, S, n, w) {
  const s = G.systems[n.sys], eff = w.effizienz;
  if (n.rolle === 'bergbau') { const b = (s.belt ? 1.6 : 1) * (s.special === 'loch' ? 0.5 : 1); return { metall: 8 * eff * b, kristall: 3 * eff * b, text: `+${Math.round(8 * eff * b)} Metall, +${Math.round(3 * eff * b)} Kristall pro Minute` }; }
  if (n.rolle === 'handel') { const c = (s.planets.some(p => p.market) ? 24 : 6) * eff; return { credits: c, text: `+${Math.round(c)} Credits pro Minute` + (s.planets.some(p => p.market) ? '' : ' (kein Markt hier)') }; }
  if (n.rolle === 'wache') return { text: 'schützt dieses System und die Nachbarn vor Piraten' };
  const frei = s.nb.filter(j => !S.nodes.some(m => m.sys === j)).length, rest = Math.max(0, Math.ceil(80 / eff - n.t));
  return { text: frei ? `nächster Replikationsversuch in ${rest} s (${frei} freie Nachbarn)` : 'keine freien Nachbarsysteme mehr' };
}
function sondeNetz(G, S, w, dt, log, R = Math.random) {
  const per = dt / 60, eff = w.effizienz;
  const bySys = {}; for (const n of S.nodes) bySys[n.sys] = n;
  for (const n of S.nodes.slice()) {
    const s = G.systems[n.sys];
    if (n.rolle === 'bergbau' || n.rolle === 'handel') {
      const l = sondeLeistung(G, S, n, w);
      S.lager.metall += (l.metall || 0) * per; S.lager.kristall += (l.kristall || 0) * per; S.lager.credits += (l.credits || 0) * per;
    } else if (n.rolle === 'pionier') {
      n.t += dt;
      if (n.t > 80 / eff) {
        const ziele = s.nb.filter(j => !bySys[j]).sort((a, b) => G.systems[a].danger - G.systems[b].danger || R() - 0.5);
        const k = sondeKosten(w);
        if (!ziele.length) { n.t = 80 / eff - 20; continue; }
        if (S.lager.metall < k.metall || S.lager.kristall < k.kristall) { n.t = 80 / eff - 10; continue; }
        n.t = 0; S.lager.metall -= k.metall; S.lager.kristall -= k.kristall;
        const z = ziele[0], zs = G.systems[z];
        const schutz = zs.nb.some(j => bySys[j] && bySys[j].rolle === 'wache');
        const chance = zs.special === 'nest' && !S.nestDown ? 0.25 : [1, 0.92, 0.72, 0.5][zs.danger] + (schutz ? 0.2 : 0);
        if (R() < chance) {
          const kid = sondeKlon(G, S, z, R() < 0.35 ? 'pionier' : 'bergbau', R); bySys[z] = kid;
          log(`${n.name} hat sich nach ${zs.name} repliziert. Willkommen, ${kid.name}!`, '#7dffb0');
        } else log(`${n.name}s Klon wurde auf dem Weg nach ${zs.name} von Piraten zerstört.`, '#ff8f7a');
      }
    }
  }
  // Überfälle auf ungeschützte Knoten in gefährlichen Systemen
  S.raidT += dt;
  if (S.raidT > 45) {
    S.raidT = 0;
    const opfer = S.nodes.filter(n => G.systems[n.sys].danger >= 2 && n.rolle !== 'wache' && !G.systems[n.sys].nb.concat(n.sys).some(j => bySys[j] && bySys[j].rolle === 'wache'));
    if (opfer.length && R() < 0.35) {
      const n = opfer[Math.floor(R() * opfer.length)], verlust = Math.floor(S.lager.metall * 0.15);
      if (verlust > 0) { S.lager.metall -= verlust; log(`Piraten haben ${n.name} in ${G.systems[n.sys].name} überfallen: ${verlust} Metall weg. Eine Wache in der Nähe hilft.`, '#ff8f7a'); }
    }
  }
  // Funksprüche der Klone
  S.funkT -= dt;
  if (S.funkT <= 0 && S.nodes.length) { S.funkT = 50 + R() * 50; const n = S.nodes[Math.floor(R() * S.nodes.length)]; log(SONDE_FUNK[Math.floor(R() * SONDE_FUNK.length)](n.name), '#b8a4ff'); }
}
