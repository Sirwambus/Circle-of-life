/* =====================================================================
   WELT – Wassergläser: Gieß den Zaubertrank zwischen den Gläsern um, bis die Zielmenge abgemessen
   ist. Beim Gießen läuft so viel über, bis das eine Glas leer oder das andere voll ist.
   ← → Glas wählen, Leertaste: Glas aufnehmen / hineingießen.
   ===================================================================== */
function makeWasserglaeser(next, level = 0) {
  // Kürzeste Lösungen per Breitensuche geprüft: 3, 4, 5, 6, 7, 8, 9, 10, 10, 12 Züge
  const LV = [
    { cap: [8, 5, 3], goal: 'eins', x: 6 }, { cap: [8, 5, 3], goal: 'eins', x: 1 }, { cap: [8, 5, 3], goal: 'eins', x: 7 },
    { cap: [8, 5, 3], goal: 'eins', x: 4 }, { cap: [8, 5, 3], goal: 'zwei', x: 4 }, { cap: [10, 7, 3], goal: 'eins', x: 5 },
    { cap: [10, 7, 3], goal: 'zwei', x: 5 }, { cap: [12, 7, 5], goal: 'eins', x: 6 }, { cap: [12, 10, 6, 3], goal: 'drei', x: 4 },
    { cap: [12, 11, 8, 3], goal: 'drei', x: 4 }
  ][level];
  const BEST = [3, 4, 5, 6, 7, 8, 9, 10, 10, 12][level], LIMIT = [0, 0, 0, 0, 12, 13, 14, 15, 15, 17][level];
  const CAP = LV.cap, G = CAP.length, U = 19, BASE = 338, GW = 66;
  const NEED = { eins: 1, zwei: 2, drei: 3 }[LV.goal];
  const gx = i => W / 2 + (i - (G - 1) / 2) * (G === 4 ? 130 : 160);
  const finale = makeFinale(next);
  let amt, vis, sel, src, moves, fail, failT, pour, solvedT, t = 0, msg = '', msgT = 0;
  function reset() { amt = CAP.map((c, i) => i ? 0 : c); vis = amt.slice(); sel = 0; src = -1; moves = 0; fail = false; failT = 0; pour = null; solvedT = -1; }
  reset();
  const solved = () => amt.filter(v => v === LV.x).length >= NEED;
  const bubbles = Array.from({ length: 30 }, (_, i) => ({ g: i % G, x: (i * 37) % 50 - 25, y: (i * 53) % 100, s: 0.5 + (i % 5) * 0.2 }));
  const rep = makeRepeater(0.3, 0.16);
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ cap: CAP.slice(), amt: amt.slice(), sel, src, moves, fail, fin: finale.active, solved: solvedT >= 0, busy: !!pour, goal: LV.goal, x: LV.x, LIMIT }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      for (let i = 0; i < G; i++) vis[i] += (amt[i] - vis[i]) * Math.min(1, dt * 5);
      for (const b of bubbles) { b.y = (b.y + dt * 30 * b.s) % 100; }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 1.3) finale.start(); return; }
      if (pour) { pour.t += dt; if (pour.t > 0.7) { pour = null; if (solved()) { solvedT = 0; Klang.tone(880, 0.4); } else if (LIMIT && moves >= LIMIT) { fail = true; failT = 0; } } return; }
      if (fail) { failT += dt; if (failT > 0.5 && pressed.action) { died(); reset(); } return; }
      const d = rep(dt);
      if (d && d[0]) sel = (sel + d[0] + G) % G;
      if (pressed.action) {
        if (src < 0) { if (!amt[sel]) { msg = 'Das Glas ist leer.'; msgT = 1.2; return; } src = sel; Klang.tone(400, 0.08); }
        else if (src === sel) src = -1;
        else {
          const m = Math.min(amt[src], CAP[sel] - amt[sel]);
          if (!m) { msg = 'Das Glas ist schon voll.'; msgT = 1.2; return; }
          amt[src] -= m; amt[sel] += m; moves++; pour = { a: src, b: sel, t: 0 }; src = -1; Klang.tone(300 + amt[sel] * 30, 0.4);
        }
      }
    },
    draw(c) {
      // Alchemistenkammer
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d0f33'); bg.addColorStop(1, '#3b1d4a');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.03)'; for (let y = 20; y < BASE; y += 34) for (let x = (y / 34 % 2) * 40; x < W; x += 80) c.fillRect(x + 2, y + 2, 76, 30);
      c.fillStyle = '#5a3a28'; c.fillRect(0, BASE, W, 14); c.fillStyle = '#3a2418'; c.fillRect(0, BASE + 14, W, H - BASE - 14);
      const glow = c.createRadialGradient(W / 2, BASE, 10, W / 2, BASE, 340); glow.addColorStop(0, 'rgba(90,255,200,0.12)'); glow.addColorStop(1, 'rgba(90,255,200,0)'); c.fillStyle = glow; c.fillRect(0, 0, W, H);
      for (let i = 0; i < G; i++) {
        const lift = (i === src ? 18 : 0) + (pour && pour.a === i ? 26 * Math.sin(Math.min(1, pour.t / 0.35) * Math.PI / 2) : 0);
        const x = gx(i), h = CAP[i] * U, top = BASE - h - lift, bot = BASE - lift;
        const tilt = pour && pour.a === i ? (pour.b > i ? 1 : -1) * 0.35 * Math.sin(Math.min(1, pour.t / 0.7) * Math.PI) : 0;
        c.save(); c.translate(x, bot); c.rotate(tilt); c.translate(-x, -bot);
        // Flüssigkeit
        const lh = vis[i] * U;
        if (lh > 0.5) {
          const lg = c.createLinearGradient(0, bot - lh, 0, bot); lg.addColorStop(0, '#8dffd8'); lg.addColorStop(1, '#1fae8f');
          c.fillStyle = lg; c.fillRect(x - GW / 2 + 3, bot - lh, GW - 6, lh - 2);
          c.fillStyle = 'rgba(220,255,245,0.7)'; c.fillRect(x - GW / 2 + 3, bot - lh, GW - 6, 2);
          c.fillStyle = 'rgba(255,255,255,0.35)';
          for (const b of bubbles) if (b.g === i) { const by = bot - b.y / 100 * lh; if (by > bot - lh + 3) { c.beginPath(); c.arc(x + b.x * 0.9, by, 1.5 + b.s, 0, 7); c.fill(); } }
        }
        // Glas
        c.strokeStyle = i === sel && !finale.active ? '#ffffff' : 'rgba(210,230,255,0.6)'; c.lineWidth = i === sel ? 3 : 2;
        c.beginPath(); c.moveTo(x - GW / 2, top - 6); c.lineTo(x - GW / 2, bot - 4); c.quadraticCurveTo(x - GW / 2, bot, x - GW / 2 + 4, bot); c.lineTo(x + GW / 2 - 4, bot); c.quadraticCurveTo(x + GW / 2, bot, x + GW / 2, bot - 4); c.lineTo(x + GW / 2, top - 6); c.stroke();
        c.fillStyle = 'rgba(210,230,255,0.08)'; c.fillRect(x - GW / 2, top - 6, GW, h + 6);
        c.strokeStyle = 'rgba(210,230,255,0.35)'; c.lineWidth = 1;
        for (let k = 1; k < CAP[i]; k++) { const y = bot - k * U + 0.5; c.beginPath(); c.moveTo(x + GW / 2 - (k % 5 ? 8 : 16), y); c.lineTo(x + GW / 2, y); c.stroke(); }
        c.restore();
        label(c, `${amt[i]} / ${CAP[i]}`, x, BASE + 34, amt[i] === LV.x ? '#8dffd8' : '#e9dcff', 'center', 14);
        if (i === sel && !finale.active) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, top - 26); c.lineTo(x - 8, top - 38); c.lineTo(x + 8, top - 38); c.fill(); }
      }
      if (pour) { // Strahl
        const a = gx(pour.a), b = gx(pour.b), k = Math.sin(Math.min(1, pour.t / 0.7) * Math.PI);
        c.strokeStyle = `rgba(141,255,216,${0.8 * k})`; c.lineWidth = 5; c.beginPath();
        c.moveTo(a + (b > a ? GW / 2 : -GW / 2), BASE - CAP[pour.a] * U - 30); c.quadraticCurveTo((a + b) / 2, BASE - 300, b, BASE - CAP[pour.b] * U); c.stroke();
      }
      const goalTxt = LV.goal === 'eins' ? `genau ${LV.x} Liter in einem Glas` : LV.goal === 'zwei' ? `zweimal genau ${LV.x} Liter` : `dreimal genau ${LV.x} Liter`;
      label(c, `Ziel: ${goalTxt}`, 16, 26, '#8dffd8', 'left', 14);
      label(c, `Züge ${moves}${LIMIT ? ' / ' + LIMIT : ''}   ·   bestenfalls ${BEST}`, W - 16, 26, '#e9dcff', 'right');
      if (fail) { c.fillStyle = 'rgba(20,8,30,0.7)'; c.fillRect(0, 150, W, 70); label(c, 'Zuglimit erreicht. Leertaste: noch einmal', W / 2, 192, '#ffffff', 'center', 16); }
      else if (msgT > 0) label(c, msg, W / 2, 52, '#ffffff', 'center', 13);
      else if (!finale.active && solvedT < 0) label(c, src < 0 ? '← → Glas wählen · Leertaste: aufnehmen' : '← → Ziel wählen · Leertaste: hineingießen', W / 2, 52, 'rgba(233,220,255,0.75)', 'center', 12);
      finale.draw(c, '#8dffd8', '#3b1d4a');
    }
  };
  return self;
}
