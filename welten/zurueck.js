/* =====================================================================
   WELT – Zurück (N-Back): Zeichen erscheinen nacheinander. Drück die Leertaste, wenn das Zeichen
   dasselbe ist wie das von N Schritten vorher. Level 1–2: N = 1, Level 3–4: N = 2, Level 5: N = 3.
   ===================================================================== */
function makeZurueck(next, level = 0) {
  const NB = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4][level], STEP = [1.7, 1.35, 1.8, 1.45, 1.9, 1.6, 1.45, 2, 1.8, 1.6][level], COUNT = 20, LIVES = 1;
  const SYM = [['#ff5a8a', 0], ['#5ab0ff', 1], ['#ffd23f', 2], ['#6bff9a', 3], ['#c08bff', 4]];
  const finale = makeFinale(next);
  let seq, idx, timer, hits, misses, falses, answered, result, t = 0, fb = '', fbT = 0;
  function build() {
    seq = [];
    for (let i = 0; i < COUNT + NB; i++) seq.push(i >= NB && Math.random() < 0.32 ? seq[i - NB] : Math.floor(Math.random() * 5));
  }
  function reset() { build(); idx = -1; timer = 1.2; hits = 0; misses = 0; falses = 0; answered = false; result = ''; }
  reset();
  const isTarget = i => i >= NB && seq[i] === seq[i - NB];
  const targets = () => seq.filter((_, i) => isTarget(i)).length;
  function shape(c, k, x, y, r) {
    c.beginPath();
    if (k === 0) c.arc(x, y, r, 0, 7);
    else if (k === 1) c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else if (k === 2) { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (k === 3) { c.moveTo(x, y - r * 1.1); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r * 1.1); c.lineTo(x - r * 0.8, y); c.closePath(); }
    else for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.fill();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, target: idx >= 0 && isTarget(idx), answered, result }), // für Testprogramme
    update(dt) {
      t += dt; fbT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (result === 'fail') { if (pressed.action) { died(); reset(); } return; }
      timer -= dt;
      if (pressed.action && idx >= 0 && !answered) {
        answered = true;
        if (isTarget(idx)) { hits++; fb = 'Treffer'; Klang.tone(660, 0.25); } else { falses++; fb = 'Daneben'; }
        fbT = 0.6;
      }
      if (timer <= 0) {
        if (idx >= 0 && isTarget(idx) && !answered) { misses++; fb = 'Verpasst'; fbT = 0.6; }
        idx++; answered = false; timer = STEP;
        if (idx >= seq.length) {
          const acc = hits / Math.max(1, targets());
          if (acc >= 0.75 && falses <= 2) finale.start(); else result = 'fail';
        }
      }
    },
    draw(c) {
      c.fillStyle = '#05040f'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2);
      for (let i = 0; i < 14; i++) { const r = ((i * 30 + t * 40) % 420); c.strokeStyle = `rgba(150,120,255,${0.25 * (1 - r / 420)})`; c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2 + t * 0.1; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
      c.restore();
      if (idx >= 0 && idx < seq.length && timer > STEP * 0.25) {
        const [col, k] = SYM[seq[idx]]; c.save(); c.shadowColor = col; c.shadowBlur = 24; c.fillStyle = col; shape(c, k, W / 2, H / 2, 46); c.restore();
      }
      label(c, `${NB} zurück · Zeichen ${Math.max(0, Math.min(idx + 1, seq.length))} / ${seq.length}`, 16, 26, '#d6ccff');
      label(c, `Treffer ${hits} · verpasst ${misses} · daneben ${falses}`, W - 16, 26, '#d6ccff', 'right');
      label(c, `Leertaste, wenn das Zeichen dem von ${NB === 1 ? 'eben' : NB + ' Schritten vorher'} gleicht`, W / 2, H - 20, '#9a8cd6', 'center');
      if (fbT > 0) label(c, fb, W / 2, H / 2 + 90, fb === 'Treffer' ? '#6bff9a' : '#ff8fb0', 'center', 16);
      if (result === 'fail') { c.fillStyle = 'rgba(5,4,15,0.9)'; c.fillRect(0, 160, W, 80); label(c, `${hits} von ${targets()} erkannt, ${falses} daneben. Nötig: drei Viertel, höchstens 2 daneben. Leertaste: nochmal`, W / 2, 205, '#ff9db0', 'center', 12); }
      finale.draw(c, '#d6ccff', '#1a1236');
    }
  };
  return self;
}
