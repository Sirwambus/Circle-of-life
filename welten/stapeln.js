/* =====================================================================
   WELT – Stapeln: Lass die Blöcke im richtigen Moment fallen. Was übersteht, bricht ab.
   Zehn Blöcke hoch, dann steht oben die Tür. Grafik im Stil eines Holzschnitts.
   ===================================================================== */
function makeStapeln(next, level = 0) {
  // Je Level: höherer Turm, schmalerer Grundblock, schnellerer Start.
  const BH = 26, BASEY = 360, GOAL = [10, 14, 18, 22, 26, 28, 30, 32, 34, 36][level], BASEW = [220, 200, 180, 170, 160, 150, 145, 140, 135, 130][level], ACC = [22, 17, 15, 11, 9, 8, 7, 6, 6, 5][level];
  let stack, mover, dir, cam, debris, doneT, flash = 0, t = 0;
  function reset() { stack = [{ x: (W - BASEW) / 2, w: BASEW }]; mover = { x: 0, w: BASEW }; dir = 1; cam = 0; debris = []; doneT = -1; }
  reset();
  const yOf = i => BASEY - i * BH;
  const top = () => stack[stack.length - 1];
  const self = {
    done: false,
    door: () => { const tp = top(); return { x: tp.x + tp.w / 2 - 15, y: yOf(stack.length) + BH - 50 - cam, w: 30, h: 50 }; },
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      for (const d of debris) { d.vy += 900 * dt; d.y += d.vy * dt; d.rot += d.spin * dt; }
      debris = debris.filter(d => d.y < 800);
      const targetCam = Math.min(0, yOf(stack.length) - 170);
      cam += (targetCam - cam) * Math.min(1, dt * 4);
      if (doneT >= 0) { doneT += dt; if (doneT > 0.6 && (pressed.action || pressed.up)) self.done = true; return; }
      const sp = 170 + level * 25 + stack.length * ACC;
      mover.x += dir * sp * dt;
      if (mover.x < 0) { mover.x = 0; dir = 1; } if (mover.x + mover.w > W) { mover.x = W - mover.w; dir = -1; }
      if (pressed.action || pressed.up || pressed.down) {
        const tp = top();
        if (Math.abs(mover.x - tp.x) < 5) mover.x = tp.x; // fast perfekt: einrasten
        const l = Math.max(mover.x, tp.x), r = Math.min(mover.x + mover.w, tp.x + tp.w);
        const y = yOf(stack.length);
        if (r <= l) { debris.push({ x: mover.x, y, w: mover.w, vy: 0, rot: 0, spin: 2 }); died(); flash = 0.4; reset(); return; }
        if (mover.x < l) debris.push({ x: mover.x, y, w: l - mover.x, vy: 0, rot: 0, spin: -2 });
        if (mover.x + mover.w > r) debris.push({ x: r, y, w: mover.x + mover.w - r, vy: 0, rot: 0, spin: 2 });
        stack.push({ x: l, w: r - l });
        mover = { x: dir > 0 ? 0 : W - (r - l), w: r - l };
        if (stack.length > GOAL) doneT = 0;
      }
    },
    draw(c) {
      c.fillStyle = '#f1e3c6'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#d8452f'; c.beginPath(); c.arc(520, 90 - cam * 0.2, 54, 0, 7); c.fill();
      c.fillStyle = '#2c3e64'; c.beginPath(); c.moveTo(-20, 330 - cam * 0.3); c.lineTo(150, 170 - cam * 0.3); c.lineTo(190, 190 - cam * 0.3); c.lineTo(360, 330 - cam * 0.3); c.fill();
      c.fillStyle = '#f7f1e3'; c.beginPath(); c.moveTo(150, 170 - cam * 0.3); c.lineTo(112, 205 - cam * 0.3); c.lineTo(135, 198 - cam * 0.3); c.lineTo(150, 210 - cam * 0.3); c.lineTo(170, 198 - cam * 0.3); c.lineTo(190, 190 - cam * 0.3); c.fill();
      c.save(); c.translate(0, -cam);
      // Wellen (Seigaiha)
      for (let row = 0; row < 6; row++) for (let x = (row % 2) * 20 - 20; x < W + 40; x += 40) {
        const y = BASEY + BH + row * 14;
        for (const [r, col] of [[20, '#2c3e64'], [15, '#f1e3c6'], [10, '#3f5a8a'], [5, '#f1e3c6']]) { c.fillStyle = col; c.beginPath(); c.arc(x, y + 14, r, Math.PI, 0); c.fill(); }
      }
      const block = (x, y, w, i) => {
        c.fillStyle = i % 2 ? '#3f5a8a' : '#2c3e64'; c.fillRect(x, y, w, BH);
        c.strokeStyle = '#f1e3c6'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 4, y + BH / 2); c.lineTo(x + w - 4, y + BH / 2); c.stroke();
        c.strokeStyle = '#1a1a1a'; c.lineWidth = 1.5; c.strokeRect(x + 0.75, y + 0.75, w - 1.5, BH - 1.5);
      };
      stack.forEach((s, i) => block(s.x, yOf(i), s.w, i));
      for (const d of debris) { c.save(); c.translate(d.x + d.w / 2, d.y + BH / 2); c.rotate(d.rot); block(-d.w / 2, -BH / 2, d.w, 1); c.restore(); }
      c.restore();
      if (doneT < 0) block(mover.x, yOf(stack.length) - cam, mover.w, stack.length);
      else {
        paintDoor(c, self.door(), { frame: '#1a1a1a', panel: '#d8452f', knob: '#f1e3c6', light: next, open: 0.4 + 0.2 * Math.sin(t * 3) });
        label(c, 'Leertaste / A: eintreten', W / 2, 40, '#1a1a1a', 'center');
      }
      label(c, `${Math.min(stack.length - 1, GOAL)} / ${GOAL}`, W - 16, H - 16, '#1a1a1a', 'right', 18);
      flashOverlay(c, flash, '216,69,47');
    }
  };
  return self;
}
