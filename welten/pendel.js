/* =====================================================================
   WELT – Pendel: Ein Lichtpendel schwingt im Tempel über einen Runenbogen. Drück die Leertaste genau,
   wenn es im leuchtenden Zielfeld steht. Später springt das Feld, das Tempo wechselt, das Feld wandert.
   ===================================================================== */
function makePendel(next, level = 0) {
  const NEED = [7, 8, 9, 10, 10, 11, 12, 12, 13, 14][level];
  const HW = [0.22, 0.2, 0.18, 0.165, 0.155, 0.145, 0.138, 0.13, 0.125, 0.12][level];   // halbe Breite des Zielfelds (rad)
  const PER = [3.0, 2.85, 2.7, 2.55, 2.45, 2.4, 2.3, 2.2, 2.1, 2.0][level];              // Dauer einer ganzen Schwingung
  const JUMP = level >= 3, TEMPO = level >= 5 ? [0, 0, 0, 0, 0, 0.18, 0.2, 0.22, 0.24, 0.26][level] : 0, DRIFT = [0, 0, 0, 0, 0, 0, 0, 0.12, 0.16, 0.2][level];
  const A = 0.9, PX = W / 2, PY = 58, LEN = 250, LIVES = 4;
  const finale = makeFinale(next);
  let ph, om, zc, zv, hits, lives, failT, msg, msgT, t = 0, flash = 0, flashOk = false, trail = [], cool = 0;
  function newZone() { let c; do c = (Math.random() * 2 - 1) * 0.62; while (zc !== undefined && Math.abs(c - zc) < 0.25); zc = c; zv = DRIFT * (Math.random() < 0.5 ? -1 : 1); }
  function reset() { ph = -Math.PI / 2; om = Math.PI * 2 / PER; zc = undefined; newZone(); if (!JUMP) zc = 0.25; hits = 0; lives = LIVES; failT = -1; msg = ''; msgT = 0; trail = []; cool = 0; }
  reset();
  const ang = () => A * Math.sin(ph);
  function say(m) { msg = m; msgT = 1.1; }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, ang: ang(), vel: A * om * Math.cos(ph), amp: A, zc, zv, hw: HW }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 2.5); cool -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      const before = Math.floor((ph + Math.PI / 2) / Math.PI);
      ph += om * dt;
      // am Umkehrpunkt kann sich das Tempo ändern
      if (TEMPO && Math.floor((ph + Math.PI / 2) / Math.PI) !== before) om = Math.PI * 2 / (PER * (1 + (Math.random() * 2 - 1) * TEMPO));
      if (DRIFT) { zc += zv * dt; if (Math.abs(zc) > 0.68) { zc = Math.sign(zc) * 0.68; zv = -zv; } }
      trail.push(ang()); if (trail.length > 10) trail.shift();
      if (pressed.action && cool <= 0) {
        cool = 0.2;
        const off = Math.abs(ang() - zc);
        if (off <= HW) {
          hits++; flash = 1; flashOk = true; Klang.tone(440 + hits * 40, 0.25);
          say(off < HW * 0.35 ? 'Genau!' : 'Treffer'); if (hits >= NEED) { finale.start(); return; }
          if (JUMP) newZone();
        } else {
          lives--; flash = 1; flashOk = false; Klang.tone(150, 0.3); say('Daneben');
          if (lives <= 0) failT = 0;
        }
      }
    },
    draw(c) {
      const bg = c.createRadialGradient(PX, PY + 200, 20, PX, PY + 200, 420); bg.addColorStop(0, '#3a1430'); bg.addColorStop(0.6, '#1a0a22'); bg.addColorStop(1, '#07030c');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Säulen
      for (const x of [70, 570]) {
        c.fillStyle = '#2a1636'; c.fillRect(x - 26, 40, 52, 340);
        c.strokeStyle = 'rgba(255,200,120,0.15)'; for (let k = -18; k <= 18; k += 9) { c.beginPath(); c.moveTo(x + k, 44); c.lineTo(x + k, 376); c.stroke(); }
        c.fillStyle = '#3d2050'; c.fillRect(x - 34, 30, 68, 14); c.fillRect(x - 34, 372, 68, 14);
      }
      c.fillStyle = '#3d2050'; c.fillRect(30, 30, 580, 10);
      // Runenbogen
      c.save(); c.translate(PX, PY);
      c.strokeStyle = 'rgba(255,214,140,0.25)'; c.lineWidth = 18; c.beginPath(); c.arc(0, 0, LEN, Math.PI / 2 - A - 0.05, Math.PI / 2 + A + 0.05); c.stroke();
      for (let k = -9; k <= 9; k++) { const a = Math.PI / 2 - k * A / 9; label(c, 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗ'[k + 9], Math.cos(a) * (LEN + 24), Math.sin(a) * (LEN + 24) + 4, 'rgba(255,214,140,0.35)', 'center', 11); }
      // Zielfeld (Winkel: 0 = senkrecht nach unten, positiv = nach rechts)
      const za = a => Math.PI / 2 - a;
      c.strokeStyle = flash > 0 && flashOk ? '#ffffff' : '#ff3fa4'; c.shadowColor = '#ff3fa4'; c.shadowBlur = 18; c.lineWidth = 22;
      c.beginPath(); c.arc(0, 0, LEN, za(zc + HW), za(zc - HW)); c.stroke(); c.shadowBlur = 0;
      c.strokeStyle = '#ffe0f0'; c.lineWidth = 2; c.beginPath(); c.moveTo(Math.cos(za(zc)) * (LEN - 14), Math.sin(za(zc)) * (LEN - 14)); c.lineTo(Math.cos(za(zc)) * (LEN + 14), Math.sin(za(zc)) * (LEN + 14)); c.stroke();
      // Nachleuchten und Pendel
      trail.forEach((a, i) => { c.fillStyle = `rgba(255,236,170,${i / trail.length * 0.25})`; c.beginPath(); c.arc(Math.sin(a) * LEN, Math.cos(a) * LEN, 9, 0, 7); c.fill(); });
      const a = ang(), bx = Math.sin(a) * LEN, by = Math.cos(a) * LEN;
      c.strokeStyle = 'rgba(255,236,170,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(bx, by); c.stroke();
      const g = c.createRadialGradient(bx, by, 2, bx, by, 34); g.addColorStop(0, 'rgba(255,245,200,0.9)'); g.addColorStop(1, 'rgba(255,245,200,0)');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, 34, 0, 7); c.fill();
      c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(bx, by, 10, 0, 7); c.fill();
      c.fillStyle = '#ffd68a'; c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fill();
      c.restore();
      if (flash > 0 && !flashOk) { c.fillStyle = `rgba(255,40,80,${flash * 0.18})`; c.fillRect(0, 0, W, H); }
      label(c, `Treffer ${hits} / ${NEED}`, 16, 26, '#ffd68a');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff3fa4', 'right', 16);
      if (failT >= 0) label(c, 'Viermal daneben! Leertaste: noch einmal', W / 2, 380, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 380, '#ffffff', 'center', 14);
      else label(c, 'Leertaste, wenn das Licht im rosa Feld steht', W / 2, 380, '#d6a8c8', 'center');
      finale.draw(c, '#ffd68a', '#3a1430');
    }
  };
  return self;
}
