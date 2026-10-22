/* =====================================================================
   WELT – Kartenschnipp: Zwei Karten werden aufgedeckt. Gleich (←) oder verschieden (→)?
   Erst zählt nur die Farbe, dann die Form, dann die Anzahl, ab Level 6 alles zugleich. Später liegt eine Karte schief.
   ===================================================================== */
function makeKartenschnipp(next, level = 0) {
  const FEAT = [['farbe'], ['form'], ['farbe', 'form'], ['anzahl'], ['farbe', 'anzahl'], ['farbe', 'form', 'anzahl'], ['farbe', 'form', 'anzahl'], ['farbe', 'form', 'anzahl'], ['farbe', 'form', 'anzahl'], ['farbe', 'form', 'anzahl']][level];
  const TIME = [3.5, 3.2, 3, 2.8, 2.6, 2.6, 2.4, 2.2, 2, 1.8][level], NEED = [10, 10, 12, 12, 13, 14, 15, 15, 16, 18][level];
  const TILT = level >= 7, ONEDIFF = level >= 6, LIVES = 3;
  const COLS = ['#e8413a', '#2f7de1', '#2aa84a', '#f2b51c'], SHAPES = ['kreis', 'dreieck', 'quadrat', 'stern'], NAMES = { farbe: 'Farbe', form: 'Form', anzahl: 'Anzahl' };
  const finale = makeFinale(next);
  const ri = n => Math.floor(Math.random() * n);
  let pair, score, lives, phase, timer, failed, failT, fb, t = 0, id = 0;
  function newPair() {
    const a = { farbe: FEAT.includes('farbe') ? ri(4) : 0, form: FEAT.includes('form') ? ri(4) : 0, anzahl: FEAT.includes('anzahl') ? ri(4) + 1 : 1 };
    const b = { ...a }, same = Math.random() < 0.5;
    if (!same) {
      // meist nur ein Merkmal verschieden, früher auch mehrere
      const order = FEAT.slice().sort(() => Math.random() - 0.5), n = ONEDIFF || FEAT.length === 1 ? 1 : 1 + ri(FEAT.length);
      for (const f of order.slice(0, n)) { if (f === 'anzahl') b.anzahl = 1 + (a.anzahl + ri(3)) % 4; else b[f] = (a[f] + 1 + ri(3)) % 4; }
    }
    pair = { a, b, same, answer: same ? 'left' : 'right', rot: TILT ? (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.4) : 0, id: ++id };
    phase = 'flip'; timer = 0.25;
  }
  function reset() { score = 0; lives = LIVES; failed = false; fb = null; newPair(); }
  reset();
  function shape(c, s, x, y, r) {
    c.beginPath();
    if (s === 'kreis') c.arc(x, y, r, 0, 7);
    else if (s === 'dreieck') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (s === 'quadrat') c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else for (let i = 0; i <= 10; i++) { const q = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); }
    c.fill();
  }
  const SPOTS = [[[0, 0]], [[0, -34], [0, 34]], [[0, -48], [0, 0], [0, 48]], [[-24, -30], [24, -30], [-24, 30], [24, 30]]];
  function card(c, x, y, k, rot, cfg, back) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(Math.max(0.02, k), 1);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-62, -86, 132, 180);
    c.fillStyle = back ? '#6a1830' : '#fbf6ea'; c.fillRect(-66, -90, 132, 180);
    c.strokeStyle = back ? '#e8c06a' : '#c9b98a'; c.lineWidth = 3; c.strokeRect(-60, -84, 120, 168);
    if (back) { c.strokeStyle = 'rgba(232,192,106,0.5)'; c.lineWidth = 1; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 14 - 40, -80); c.lineTo(i * 14 + 40, 80); c.stroke(); } }
    else { c.fillStyle = COLS[cfg.farbe]; for (const [dx, dy] of SPOTS[cfg.anzahl - 1]) shape(c, SHAPES[cfg.form], dx, dy, cfg.anzahl > 2 ? 15 : 19); }
    c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, answer: pair.answer, id: pair.id, a: pair.a, b: pair.b }), // für Testprogramme
    update(dt) {
      t += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.6 && pressed.action) { died(); reset(); } return; }
      timer -= dt;
      if (phase === 'flip') { if (timer <= 0) { phase = 'ask'; timer = TIME; } }
      else if (phase === 'ask') {
        const k = pressed.left ? 'left' : pressed.right ? 'right' : null;
        if (k || timer <= 0) {
          const ok = k === pair.answer; fb = { ok, why: k ? 'Falsch' : 'Zu langsam' };
          if (ok) score++; else lives--;
          Klang.tone(ok ? 760 : 130, 0.12); phase = 'fb'; timer = ok ? 0.35 : 1.3;
        }
      } else if (phase === 'fb' && timer <= 0) {
        if (score >= NEED) finale.start(); else if (lives <= 0) { failed = true; failT = 0; } else newPair();
      }
    },
    draw(c) {
      c.fillStyle = '#0d3b24'; c.fillRect(0, 0, W, H);
      const felt = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 380); felt.addColorStop(0, '#1d7a48'); felt.addColorStop(1, '#0a2e1c');
      c.fillStyle = felt; c.fillRect(14, 14, W - 28, H - 28);
      c.strokeStyle = '#5a3a1c'; c.lineWidth = 14; c.strokeRect(7, 7, W - 14, H - 14);
      c.strokeStyle = 'rgba(232,192,106,0.25)'; c.lineWidth = 1; c.beginPath(); c.ellipse(W / 2, H / 2 + 10, 250, 140, 0, 0, 7); c.stroke();
      const k = phase === 'flip' ? Math.abs(1 - timer / 0.125) : 1, back = phase === 'flip' && timer > 0.125;
      card(c, W / 2 - 100, 205, k, 0, pair.a, back);
      card(c, W / 2 + 100, 205, k, pair.rot, pair.b, back);
      if (phase === 'ask') { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(W / 2 - 120, 318, 240, 5); c.fillStyle = '#e8c06a'; c.fillRect(W / 2 - 120, 318, 240 * clamp(timer / TIME, 0, 1), 5); }
      if (phase === 'fb') {
        label(c, fb.ok ? '✓' : `${fb.why}! Sie waren ${pair.same ? 'gleich' : 'verschieden'}.`, W / 2, 112, fb.ok ? '#9dffb0' : '#ffb0a0', 'center', fb.ok ? 26 : 15);
      }
      label(c, '← gleich', 120, 352, '#f4e6c0', 'center', 15); label(c, 'verschieden →', W - 120, 352, '#f4e6c0', 'center', 15);
      label(c, `Richtig ${score} / ${NEED}`, 28, 42, '#f4e6c0');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 28, 42, '#ff8a7a', 'right', 16);
      label(c, 'Es zählt: ' + FEAT.map(f => NAMES[f]).join(' · '), W / 2, 74, '#e8c06a', 'center', 13);
      if (failed) { c.fillStyle = 'rgba(10,46,28,0.94)'; c.fillRect(0, 160, W, 80); label(c, `Keine Leben mehr: ${score} von ${NEED}. Leertaste: neuer Versuch`, W / 2, 205, '#ffd0c0', 'center', 14); }
      finale.draw(c, '#f4e6c0', '#6a1830');
    }
  };
  return self;
}
