/* =====================================================================
   WELT – Verfolgen: Einige Leuchtquallen in der Tiefsee glühen kurz golden auf. Dann sehen alle gleich
   aus und treiben durcheinander. Behalte die goldenen im Blick und markiere sie danach.
   Pfeiltasten bewegen den Zeiger, Leertaste markiert. Ab Level 7 schlagen Quallen Haken,
   ab Level 9 verdecken Felsen kurz die Sicht.
   ===================================================================== */
function makeVerfolgen(next, level = 0) {
  const TOTAL = [5, 6, 7, 8, 8, 9, 10, 10, 11, 12][level], TARGETS = [1, 2, 2, 2, 3, 3, 3, 4, 4, 4][level];
  const SPEED = [55, 60, 65, 70, 74, 78, 80, 84, 86, 90][level], TRACK = [4, 5, 5, 6, 6, 7, 7, 7, 8, 8][level];
  const WANDER = [0, 0, 0, 0, 0, 0, 1.4, 1.7, 1.9, 2.1][level], ROCKS = level >= 8;
  const ROUNDS = level < 2 ? 2 : 3, LIVES = 3, R = 13, A = { x: 28, y: 52, w: 584, h: 318 };
  const ROCK = [{ x: 200, y: 150, rx: 44, ry: 62 }, { x: 440, y: 270, rx: 48, ry: 58 }];
  const finale = makeFinale(next);
  let orbs, phase, timer, cur, hover, roundI, lives, failed, t = 0, msg = '', msgT = 0, ok = false;
  const rand = (a, b) => a + Math.random() * (b - a);
  function newRound() {
    orbs = [];
    while (orbs.length < TOTAL) {
      const x = rand(A.x + 30, A.x + A.w - 30), y = rand(A.y + 30, A.y + A.h - 30);
      if (orbs.some(o => Math.hypot(o.x - x, o.y - y) < 62)) continue;
      const a = rand(0, Math.PI * 2);
      orbs.push({ x, y, a, vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED, target: orbs.length < TARGETS, marked: false, ph: rand(0, 7) });
    }
    phase = 'cue'; timer = 2.4; cur = { x: W / 2, y: A.y + A.h / 2 }; hover = -1;
  }
  function reset() { roundI = 0; lives = LIVES; failed = false; newRound(); }
  reset();
  function step(dt) {
    for (const o of orbs) {
      if (WANDER) { o.a = Math.atan2(o.vy, o.vx) + (Math.random() - 0.5) * WANDER * 2 * dt * 3; o.vx = Math.cos(o.a) * SPEED; o.vy = Math.sin(o.a) * SPEED; }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (o.x < A.x + R) { o.x = A.x + R; o.vx = Math.abs(o.vx); } if (o.x > A.x + A.w - R) { o.x = A.x + A.w - R; o.vx = -Math.abs(o.vx); }
      if (o.y < A.y + R) { o.y = A.y + R; o.vy = Math.abs(o.vy); } if (o.y > A.y + A.h - R) { o.y = A.y + A.h - R; o.vy = -Math.abs(o.vy); }
    }
    // Zusammenstöße: Geschwindigkeiten entlang der Verbindungslinie tauschen
    for (let i = 0; i < orbs.length; i++) for (let j = i + 1; j < orbs.length; j++) {
      const a = orbs[i], b = orbs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < R * 2 + 4) {
        const nx = dx / d, ny = dy / d, va = a.vx * nx + a.vy * ny, vb = b.vx * nx + b.vy * ny;
        if (va - vb > 0) { a.vx += (vb - va) * nx; a.vy += (vb - va) * ny; b.vx += (va - vb) * nx; b.vy += (va - vb) * ny; }
        const push = (R * 2 + 4 - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      }
    }
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, cur, hover, orbs }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      if (phase === 'cue') { timer -= dt; if (timer <= 0) { phase = 'track'; timer = TRACK; Klang.tone(300, 0.15); } }
      else if (phase === 'track') { step(dt); timer -= dt; if (timer <= 0) { phase = 'pick'; Klang.tone(440, 0.15); } }
      else if (phase === 'pick') {
        const sp = 270 * dt;
        cur.x = clamp(cur.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * sp, A.x, A.x + A.w);
        cur.y = clamp(cur.y + ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * sp, A.y, A.y + A.h);
        hover = -1; let best = 36;
        orbs.forEach((o, i) => { const d = Math.hypot(o.x - cur.x, o.y - cur.y); if (d < best) { best = d; hover = i; } });
        if (pressed.action && hover >= 0) {
          orbs[hover].marked = !orbs[hover].marked; Klang.tone(orbs[hover].marked ? 520 : 380, 0.1);
          if (orbs.filter(o => o.marked).length >= TARGETS) {
            ok = orbs.every(o => o.marked === o.target); phase = 'reveal'; timer = 2;
            if (ok) { msg = 'Alle gefunden!'; Klang.tone(660, 0.3); } else { lives--; msg = lives > 0 ? 'Nicht ganz – die goldenen leuchten jetzt.' : 'Daneben – keine Versuche mehr.'; Klang.tone(160, 0.4); }
            msgT = 2;
          }
        }
      } else if (phase === 'reveal') {
        timer -= dt;
        if (timer <= 0) {
          if (ok) { roundI++; if (roundI >= ROUNDS) { finale.start(); return; } newRound(); }
          else if (lives <= 0) { failed = true; timer = 0.5; } else newRound();
        }
      }
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#031a2e'); g.addColorStop(1, '#010810');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { // Schwebeteilchen
        const x = (i * 97 + t * (6 + i % 5)) % W, y = (i * 53 + Math.sin(t * 0.5 + i) * 10 + 400) % H;
        c.fillStyle = 'rgba(120,220,255,0.18)'; c.fillRect(x, y, 2, 2);
      }
      c.strokeStyle = 'rgba(80,200,255,0.25)'; c.lineWidth = 1; c.strokeRect(A.x + 0.5, A.y + 0.5, A.w, A.h);
      const showGold = phase === 'cue' || phase === 'reveal';
      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i], gold = showGold && o.target, puls = 1 + 0.12 * Math.sin(t * 4 + o.ph);
        const col = gold ? (phase === 'cue' ? (Math.sin(t * 10) > -0.3 ? '255,210,90' : '120,230,255') : '255,210,90') : '120,230,255';
        const halo = c.createRadialGradient(o.x, o.y, 2, o.x, o.y, R * 2.4); halo.addColorStop(0, `rgba(${col},0.45)`); halo.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = halo; c.fillRect(o.x - R * 2.4, o.y - R * 2.4, R * 4.8, R * 4.8);
        c.strokeStyle = `rgba(${col},0.6)`; c.lineWidth = 1.5;
        for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(o.x + k * 4, o.y + 4); c.quadraticCurveTo(o.x + k * 5 + Math.sin(t * 5 + k + o.ph) * 4, o.y + 14, o.x + k * 4, o.y + 22); c.stroke(); }
        c.fillStyle = `rgba(${col},0.9)`; c.beginPath(); c.arc(o.x, o.y, R * puls, Math.PI, 0); c.quadraticCurveTo(o.x, o.y + 9, o.x - R * puls, o.y); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(o.x - 4, o.y - 5, 3, 0, 7); c.fill();
        if (o.marked || (phase === 'reveal' && o.marked !== o.target)) {
          c.strokeStyle = phase === 'reveal' ? (o.target ? '#7dffb0' : '#ff5a6e') : '#ffffff'; c.lineWidth = 2.5;
          c.beginPath(); c.arc(o.x, o.y + 2, R + 9, 0, 7); c.stroke();
        }
      }
      const ra = ROCKS && phase === 'track' ? clamp(Math.min((TRACK - timer) / 0.8, timer / 0.6), 0, 1) * 0.9 : 0;
      if (ra > 0) for (const r of ROCK) { // Felsen tauchen nur während der Fahrt auf und verdecken die Sicht
        c.globalAlpha = ra; c.fillStyle = '#06131c'; c.beginPath(); c.ellipse(r.x, r.y, r.rx, r.ry, 0.2, 0, 7); c.fill();
        c.strokeStyle = 'rgba(80,200,255,0.2)'; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
      }
      if (phase === 'pick') {
        if (hover >= 0) { const o = orbs[hover]; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.setLineDash([4, 4]); c.beginPath(); c.arc(o.x, o.y + 2, R + 14, 0, 7); c.stroke(); c.setLineDash([]); }
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(cur.x, cur.y, 7, 0, 7);
        c.moveTo(cur.x - 13, cur.y); c.lineTo(cur.x - 4, cur.y); c.moveTo(cur.x + 4, cur.y); c.lineTo(cur.x + 13, cur.y);
        c.moveTo(cur.x, cur.y - 13); c.lineTo(cur.x, cur.y - 4); c.moveTo(cur.x, cur.y + 4); c.lineTo(cur.x, cur.y + 13); c.stroke();
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${TARGETS} von ${TOTAL}`, 16, 26, '#9be8ff');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff7a9a', 'right', 16);
      if (msgT > 0) label(c, msg, W / 2, 42, '#ffffff', 'center', 14);
      else if (phase === 'cue') label(c, `Merk dir die ${TARGETS === 1 ? 'goldene Qualle' : TARGETS + ' goldenen Quallen'}!`, W / 2, 42, '#ffd25a', 'center', 14);
      else if (phase === 'track') { label(c, 'Behalte sie im Blick …', W / 2, 42, '#9be8ff', 'center', 13); c.fillStyle = 'rgba(155,232,255,0.4)'; c.fillRect(A.x, A.y + A.h + 8, A.w * clamp(timer / TRACK, 0, 1), 3); }
      else if (phase === 'pick') label(c, `Pfeiltasten: Zeiger · Leertaste: markieren (${orbs.filter(o => o.marked).length} / ${TARGETS})`, W / 2, 42, '#9be8ff', 'center', 13);
      if (failed) { c.fillStyle = 'rgba(1,8,16,0.9)'; c.fillRect(0, 160, W, 80); label(c, 'Alle Versuche verbraucht. Leertaste: neuer Versuch', W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#9be8ff', '#06263a');
    }
  };
  return self;
}
