/* =====================================================================
   WELT – Maulwurf: Im Mondgarten tauchen Maulwürfe aus neun Löchern auf. Pfeile bewegen den Hammer
   (am Rand geht es auf der anderen Seite weiter), Leertaste haut. Ab Level 4 Stachelkugeln: nicht hauen!
   ===================================================================== */
function makeMaulwurf(next, level = 0) {
  const NEED = [8, 10, 12, 14, 15, 16, 18, 20, 22, 24][level];
  const SHOW = [2.2, 1.95, 1.75, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0][level];   // Sichtzeit eines Maulwurfs
  const GAP = [1.0, 0.9, 0.85, 0.8, 0.75, 0.8, 0.75, 0.7, 0.66, 0.62][level]; // Pause bis zum nächsten
  const MAXUP = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2][level], TRAP = [0, 0, 0, 0.2, 0.25, 0.25, 0.3, 0.3, 0.32, 0.35][level], LIVES = 3;
  const finale = makeFinale(next), rep = makeRepeater(0.22, 0.12);
  const HX = i => 200 + (i % 3) * 120, HY = i => 150 + Math.floor(i / 3) * 88;
  let cur, ups, score, lives, spawnT, swing, failT, cool, msg, msgT, t = 0, hitFx = [];
  function reset() { cur = 4; ups = []; score = 0; lives = LIVES; spawnT = 1; swing = 0; failT = -1; cool = new Array(9).fill(0); msg = ''; msgT = 0; hitFx = []; }
  reset();
  function say(m) { msg = m; msgT = 1.2; }
  function lose(m) { lives--; say(m); if (lives <= 0) { failT = 0; say(''); } }
  function spawn() {
    const free = []; for (let i = 0; i < 9; i++) if (cool[i] <= 0 && !ups.some(u => u.i === i)) free.push(i);
    if (!free.length) return;
    const i = free[Math.floor(Math.random() * free.length)];
    const trap = Math.random() < TRAP && ups.every(u => !u.trap);
    ups.push({ i, age: 0, life: trap ? SHOW * 0.85 : SHOW, trap, hit: 0 });
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, cur, show: SHOW, ups: ups.map(u => ({ i: u.i, age: u.age, life: u.life, trap: u.trap, hit: u.hit > 0 })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; swing = Math.max(0, swing - dt);
      hitFx = hitFx.filter(f => (f.t += dt) < 0.6);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      for (let i = 0; i < 9; i++) cool[i] -= dt;
      const d = rep(dt);
      if (d) cur = ((cur % 3 + d[0] + 3) % 3) + ((Math.floor(cur / 3) + d[1] + 3) % 3) * 3;
      if (pressed.action && swing <= 0) {
        swing = 0.16;
        const u = ups.find(u => u.i === cur && !u.hit);
        if (u) {
          u.hit = 0.25; hitFx.push({ i: cur, t: 0, trap: u.trap });
          if (u.trap) { Klang.tone(140, 0.3); lose('Autsch! Stachelkugel'); }
          else { score++; Klang.tone(520 + score * 12, 0.12); if (score >= NEED) { finale.start(); return; } }
        } else Klang.tone(200, 0.05);
      }
      for (const u of ups) {
        if (u.hit) { u.hit -= dt; if (u.hit <= 0) u.gone = true; continue; }
        u.age += dt;
        if (u.age >= u.life) { u.gone = true; if (!u.trap) lose('Entwischt!'); }
      }
      ups = ups.filter(u => { if (u.gone) cool[u.i] = 0.45; return !u.gone; });
      if (failT >= 0) return;
      if (ups.length < MAXUP) { spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = GAP * (0.8 + Math.random() * 0.4); } }
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120a2e'); bg.addColorStop(0.55, '#1d1747'); bg.addColorStop(1, '#0c2a26');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Mond und Sterne
      c.fillStyle = '#fff6d8'; c.shadowColor = '#fff1b0'; c.shadowBlur = 30; c.beginPath(); c.arc(560, 62, 26, 0, 7); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#1d1747'; c.beginPath(); c.arc(570, 56, 22, 0, 7); c.fill();
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(t * 2 + i * 3.1)})`; c.fillRect((i * 97) % W, (i * 53) % 110, 2, 2); }
      // Leuchtpilze am Rand
      for (let i = 0; i < 7; i++) {
        const x = i < 4 ? 30 + i * 32 : 520 + (i - 4) * 40, y = 340 + (i % 2) * 22, g = 0.6 + 0.4 * Math.sin(t * 1.7 + i);
        c.fillStyle = '#d9d0ff'; c.fillRect(x - 3, y - 14, 6, 16);
        c.fillStyle = `rgba(255,63,164,${g})`; c.shadowColor = '#ff3fa4'; c.shadowBlur = 14; c.beginPath(); c.ellipse(x, y - 15, 13, 8, 0, Math.PI, 0); c.fill(); c.shadowBlur = 0;
      }
      // Hügel mit Löchern
      c.fillStyle = '#163d33'; c.beginPath(); c.ellipse(320, 240, 230, 150, 0, 0, 7); c.fill();
      for (let i = 0; i < 9; i++) {
        const x = HX(i), y = HY(i);
        c.fillStyle = '#07140f'; c.beginPath(); c.ellipse(x, y + 18, 40, 13, 0, 0, 7); c.fill();
        c.strokeStyle = 'rgba(140,255,200,0.18)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 18, 44, 16, 0, 0, 7); c.stroke();
      }
      for (const u of ups) {
        const x = HX(u.i), y = HY(u.i);
        const rise = u.hit ? clamp(u.hit / 0.25, 0, 1) : Math.min(1, u.age / 0.12, (u.life - u.age) / 0.12);
        const top = y + 18 - 44 * rise;
        c.save(); c.beginPath(); c.rect(x - 50, y - 60, 100, 78); c.clip();
        if (u.trap) {
          c.fillStyle = '#ff3b4d'; c.shadowColor = '#ff3b4d'; c.shadowBlur = 16;
          c.beginPath();
          for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + t, r = k % 2 ? 14 : 24; c.lineTo(x + Math.cos(a) * r, top + 22 + Math.sin(a) * r); }
          c.fill(); c.shadowBlur = 0;
          c.fillStyle = '#2a0008'; c.beginPath(); c.arc(x, top + 22, 7, 0, 7); c.fill();
        } else {
          c.fillStyle = '#8a5a3c'; c.beginPath(); c.ellipse(x, top + 30, 24, 30, 0, 0, 7); c.fill();
          c.fillStyle = '#c9926a'; c.beginPath(); c.ellipse(x, top + 38, 14, 16, 0, 0, 7); c.fill();
          c.fillStyle = '#ff9ccf'; c.beginPath(); c.arc(x, top + 26, 6, 0, 7); c.fill();
          c.fillStyle = '#120a2e';
          if (u.hit) { label(c, '× ×', x, top + 18, '#120a2e', 'center', 12); }
          else { c.beginPath(); c.arc(x - 8, top + 16, 3, 0, 7); c.arc(x + 8, top + 16, 3, 0, 7); c.fill(); }
          // Restzeit als Lichtring
          if (!u.hit) { c.strokeStyle = '#7dffc8'; c.lineWidth = 3; c.beginPath(); c.arc(x, top - 6, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - u.age / u.life)); c.stroke(); }
        }
        c.restore();
        c.fillStyle = '#07140f'; c.beginPath(); c.ellipse(x, y + 22, 40, 7, 0, 0, Math.PI); c.fill();
      }
      for (const f of hitFx) {
        const x = HX(f.i), y = HY(f.i) - 10;
        c.strokeStyle = f.trap ? `rgba(255,59,77,${1 - f.t / 0.6})` : `rgba(255,240,140,${1 - f.t / 0.6})`; c.lineWidth = 3;
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r1 = 20 + f.t * 40, r2 = r1 + 10; c.beginPath(); c.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); c.stroke(); }
      }
      // Hammer
      const hx = HX(cur), hy = HY(cur);
      c.strokeStyle = '#ffe36b'; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.ellipse(hx, hy + 18, 48, 20, 0, 0, 7); c.stroke(); c.setLineDash([]);
      c.save(); c.translate(hx + 34, hy - 30); c.rotate(swing > 0 ? -1.1 + (0.16 - swing) * 4 : -0.3);
      c.fillStyle = '#b07ad8'; c.fillRect(-3, -4, 6, 46);
      c.fillStyle = '#ffe36b'; c.shadowColor = '#ffe36b'; c.shadowBlur = 10; c.fillRect(-18, 34, 36, 18); c.shadowBlur = 0;
      c.restore();
      label(c, `Gehauen ${score} / ${NEED}`, 16, 26, '#d9d0ff');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff3fa4', 'right', 16);
      if (failT >= 0) label(c, 'Drei verpasst! Leertaste: noch einmal', W / 2, 380, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 380, '#ffffff', 'center', 14);
      else label(c, TRAP ? 'Pfeile: Hammer · Leertaste: hauen · rote Stachelkugeln nicht!' : 'Pfeile: Hammer bewegen · Leertaste: hauen', W / 2, 380, '#a99be0', 'center');
      finale.draw(c, '#d9d0ff', '#1d1747');
    }
  };
  return self;
}
