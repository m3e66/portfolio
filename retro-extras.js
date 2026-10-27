
(() => {
  'use strict';
  const clipArt = '<svg viewBox="0 0 100 130" aria-hidden="true"><path d="M67 98V30c0-29-43-29-43 0v70c0 32 56 32 56 0V29" fill="none" stroke="#33415e" stroke-width="12" stroke-linecap="round"/><path d="M67 98V30c0-29-43-29-43 0v70c0 32 56 32 56 0V29" fill="none" stroke="#d2dae4" stroke-width="7" stroke-linecap="round"/><ellipse cx="39" cy="48" rx="11" ry="14" fill="white" stroke="#33415e" stroke-width="2"/><ellipse cx="62" cy="48" rx="11" ry="14" fill="white" stroke="#33415e" stroke-width="2"/><circle cx="43" cy="51" r="4" fill="#24334a"/><circle cx="59" cy="51" r="4" fill="#24334a"/><path d="M42 77q9 9 18 0" fill="none" stroke="#33415e" stroke-width="3" stroke-linecap="round"/></svg>';
  const tips = ['First click in Minesweeper is always safe.', 'Pixel Paint can save your drawing as a PNG.', 'Try ↑ ↑ ↓ ↓ ← → ← → B A on the desktop.', 'XP Blue lives in Control Panel.', 'Drag a window by its title bar.', 'The ghost likes five greetings.'];
  let tipIndex = 0, tipCount = 0, buddy = null;
  let mineLevel = 'easy';
  const mineLevels = {
    easy: { label: 'Easy', columns: 8, rows: 8, mineCount: 10 },
    medium: { label: 'Medium', columns: 16, rows: 16, mineCount: 40 },
    expert: { label: 'Expert', columns: 30, rows: 16, mineCount: 99 }
  };

  function renderMines(ctx) {
    const { body, dialog, setStatus, unlock, open } = ctx;
    const level = mineLevels[mineLevel], { columns, rows, mineCount } = level;
    const boardInfo = `${columns} × ${rows} / ${mineCount} mines`;
    dialog.dataset.mineLevel = mineLevel;
    body.innerHTML = '<div class="rx-mine-settings"><label for="rx-difficulty">Difficulty</label><select id="rx-difficulty">' + Object.entries(mineLevels).map(([key, value]) => `<option value="${key}">${value.label} — ${value.mineCount} mines</option>`).join('') + '</select></div><div class="rx-mine-toolbar"><output class="rx-led" aria-label="Mines remaining"></output><button class="rx-new-game" aria-label="New Minesweeper game">☺</button><output class="rx-led rx-time" aria-label="Elapsed seconds">000</output></div><div class="rx-mine-viewport"><div class="rx-mine-board" role="group" aria-label="Minesweeper board"></div></div><div class="rx-mine-actions"><button data-flag-mode aria-pressed="false">⚑ Flag mode</button></div>';
    const board = body.querySelector('.rx-mine-board'), restart = body.querySelector('.rx-new-game');
    const flags = body.querySelector('.rx-led'), time = body.querySelector('.rx-time'), mode = body.querySelector('[data-flag-mode]');
    const difficulty = body.querySelector('#rx-difficulty');
    difficulty.value = mineLevel;
    board.style.setProperty('--mine-columns', String(columns));
    board.style.setProperty('--mine-min-width', columns > 8 ? `${columns * 31 + 5}px` : '0px');
    let game, started = 0, timer, flagMode = false, ended = false;
    const cells = Array.from({ length: columns * rows }, (_, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'rx-cell'; button.dataset.cell = String(i); button.tabIndex = i ? -1 : 0;
      board.append(button); return button;
    });
    function refresh() {
      cells.forEach((button, i) => {
        const cell = game.cells[i], exposedMine = game.status === 'lost' && cell.mine;
        button.className = 'rx-cell' + (cell.revealed ? ' is-open' : '') + (exposedMine ? ' is-mine' : '');
        button.dataset.number = cell.revealed ? String(cell.adjacent) : '';
        button.textContent = exposedMine ? '✹' : cell.flagged ? '⚑' : cell.revealed && cell.adjacent ? String(cell.adjacent) : '';
        const state = exposedMine ? 'mine' : cell.flagged ? 'flagged' : cell.revealed ? `${cell.adjacent} nearby mines` : 'hidden';
        button.setAttribute('aria-label', `Row ${Math.floor(i / columns) + 1}, column ${i % columns + 1}, ${state}`);
      });
      flags.textContent = String(mineCount - game.flags).padStart(3, '0');
      if (!ended && (game.status === 'lost' || game.status === 'won')) {
        ended = true; clearInterval(timer); restart.textContent = game.status === 'won' ? '★' : '☹';
        setStatus(game.status === 'won' ? 'All clear — you win' : 'Mine found — try again');
        if (game.status === 'won') unlock('mines');
        restart.focus();
      }
    }
    function reset() {
      clearInterval(timer); game = window.LeoMines(level); started = 0; ended = false;
      time.textContent = '000'; restart.textContent = '☺'; setStatus(boardInfo);
      cells.forEach((button, i) => { button.tabIndex = i ? -1 : 0; });
      body.querySelector('.rx-mine-viewport').scrollTo(0, 0); refresh();
    }
    function act(index, flagOnly = false) {
      if (ended) return;
      setStatus(boardInfo);
      const cell = game.cells[index];
      if (flagOnly) game.flag(index);
      else if (cell.revealed) {
        const nearbyFlags = game.neighbors(index).filter(i => game.cells[i].flagged).length;
        if (cell.adjacent && nearbyFlags !== cell.adjacent) setStatus(`Match ${cell.adjacent} nearby ${cell.adjacent === 1 ? 'flag' : 'flags'} to clear`);
        else game.chord(index);
      }
      else if (flagMode) game.flag(index);
      else {
        game.reveal(index);
        if (!started && game.status !== 'ready') {
          started = Date.now(); timer = setInterval(() => { time.textContent = String(Math.min(999, Math.floor((Date.now() - started) / 1000))).padStart(3, '0'); }, 250);
        }
      }
      refresh();
    }
    board.addEventListener('click', e => { const cell = e.target.closest('[data-cell]'); if (cell) act(Number(cell.dataset.cell)); });
    board.addEventListener('contextmenu', e => { const cell = e.target.closest('[data-cell]'); if (cell) { e.preventDefault(); act(Number(cell.dataset.cell), true); } });
    board.addEventListener('keydown', e => {
      const cell = e.target.closest('[data-cell]'); if (!cell) return;
      const i = Number(cell.dataset.cell), row = Math.floor(i / columns), col = i % columns;
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); act(i, true); return; }
      const next = { ArrowLeft: row * columns + Math.max(0, col - 1), ArrowRight: row * columns + Math.min(columns - 1, col + 1), ArrowUp: Math.max(0, row - 1) * columns + col, ArrowDown: Math.min(rows - 1, row + 1) * columns + col }[e.key];
      if (next === undefined) return;
      e.preventDefault(); cells.forEach((button, n) => { button.tabIndex = n === next ? 0 : -1; }); cells[next].focus();
    });
    board.addEventListener('focusin', e => { if (e.target.matches('[data-cell]')) cells.forEach(button => { button.tabIndex = button === e.target ? 0 : -1; }); });
    difficulty.addEventListener('change', () => { mineLevel = difficulty.value; open('mines'); body.querySelector('#rx-difficulty').focus(); });
    mode.addEventListener('click', () => { flagMode = !flagMode; mode.setAttribute('aria-pressed', String(flagMode)); });
    restart.addEventListener('click', reset); reset();
    return () => { clearInterval(timer); delete dialog.dataset.mineLevel; };
  }

  function renderSaver(ctx) {
    const { body, setStatus, unlock, motionAllowed } = ctx;
    body.innerHTML = '<div class="rx-mode-bar" role="group" aria-label="Screensaver pattern"><button data-mode="logo" aria-pressed="true">Bouncing logo</button><button data-mode="stars" aria-pressed="false">Starfield</button><button data-mode="pipes" aria-pressed="false">Pipes</button></div><div class="rx-saver-stage"><canvas aria-label="Animated retro screensaver preview" role="img"></canvas></div><div class="rx-saver-controls"><button data-saver-play>Pause</button><button data-saver-color>Change color</button><output data-bounces>Bounces 0</output></div>';
    const canvas = body.querySelector('canvas'), context = canvas.getContext('2d'), play = body.querySelector('[data-saver-play]');
    let width = 500, height = 300, mode = 'logo', paused = false, frame, last = 0, bounces = 0, color = 0, pipeClock = 0;
    const colors = ['#7fe3ba', '#edb56a', '#bcadff', '#83c8f4', '#f59baf'];
    let x = 24, y = 25, vx = 115, vy = 85, pipe = { x: 100, y: 100 }, pipeCount = 0;
    let stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), speed: .03 + Math.random() * .1, size: 1 + Math.random() * 2 }));
    function resetCanvas() {
      width = Math.max(180, canvas.clientWidth); height = canvas.clientHeight || 290;
      const scale = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale); context.setTransform(scale, 0, 0, scale, 0, 0);
      context.fillStyle = '#08131f'; context.fillRect(0, 0, width, height); pipe = { x: Math.floor(width / 40) * 20, y: 140 }; pipeCount = 0;
      x = Math.max(0, Math.min(width - 114, x)); y = Math.max(0, Math.min(height - 48, y));
      if (mode === 'pipes') for (let i = 0; i < 30; i++) drawPipe();
    }
    function drawPipe() {
      if (++pipeCount > 160) { context.fillStyle = '#08131f'; context.fillRect(0, 0, width, height); pipeCount = 0; }
      const direction = Math.floor(Math.random() * 4), length = 20 + Math.floor(Math.random() * 3) * 20;
      const next = { x: Math.max(12, Math.min(width - 12, pipe.x + (direction === 0 ? length : direction === 1 ? -length : 0))), y: Math.max(12, Math.min(height - 12, pipe.y + (direction === 2 ? length : direction === 3 ? -length : 0))) };
      context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 9; context.strokeStyle = colors[color]; context.beginPath(); context.moveTo(pipe.x, pipe.y); context.lineTo(next.x, next.y); context.stroke();
      context.lineWidth = 2; context.strokeStyle = '#ffffff70'; context.stroke(); pipe = next;
    }
    function tick(now) {
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      const moving = !paused && motionAllowed() && !document.hidden;
      play.disabled = !motionAllowed(); play.textContent = !motionAllowed() ? 'Motion paused' : paused ? 'Play' : 'Pause';
      if (mode !== 'pipes') { context.fillStyle = '#08131f'; context.fillRect(0, 0, width, height); }
      if (mode === 'logo') {
        if (moving) {
          x += vx * dt; y += vy * dt; let hit = false;
          if (x <= 0 || x >= width - 114) { vx *= -1; x = Math.max(0, Math.min(width - 114, x)); hit = true; }
          if (y <= 0 || y >= height - 48) { vy *= -1; y = Math.max(0, Math.min(height - 48, y)); hit = true; }
          if (hit) { bounces++; color = (color + 1) % colors.length; body.querySelector('[data-bounces]').textContent = `Bounces ${bounces}`; if (bounces >= 5) unlock('saver'); }
        }
        context.strokeStyle = colors[color]; context.lineWidth = 2; context.strokeRect(Math.round(x) + 1, Math.round(y) + 1, 110, 44); context.fillStyle = colors[color]; context.font = 'bold 21px Consolas, monospace'; context.fillText('LEO / OS', Math.round(x) + 8, Math.round(y) + 30);
      } else if (mode === 'stars') {
        for (const star of stars) { if (moving) { star.x -= star.speed * dt; if (star.x < 0) star.x = 1; } context.fillStyle = colors[color]; context.globalAlpha = .4 + star.speed * 4; context.fillRect(star.x * width, star.y * height, star.size, star.size); }
        context.globalAlpha = 1;
      } else if (moving) { pipeClock += dt; if (pipeClock > .1) { drawPipe(); pipeClock = 0; } }
      frame = requestAnimationFrame(tick);
    }
    body.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; body.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); resetCanvas(); }));
    play.addEventListener('click', () => { paused = !paused; });
    body.querySelector('[data-saver-color]').addEventListener('click', () => { color = (color + 1) % colors.length; if (mode === 'pipes' && !motionAllowed()) drawPipe(); });
    const resize = new ResizeObserver(resetCanvas); resize.observe(canvas); resetCanvas(); frame = requestAnimationFrame(tick); setStatus('');
    return () => { cancelAnimationFrame(frame); resize.disconnect(); };
  }

  function renderBuddy(ctx) {
    const { body, setStatus, unlock, close } = ctx;
    body.innerHTML = `<div class="rx-buddy-intro"><div class="rx-paperclip">${clipArt}</div><div><h3>Office Buddy</h3><p data-buddy-tip>${tips[tipIndex]}</p><div class="rx-buddy-actions"><button data-buddy-next>Another tip</button><button class="pg-primary" data-buddy-pin>${buddy ? 'Remove from desktop' : 'Pin to desktop'}</button></div></div></div>`;
    function next() { tipIndex = (tipIndex + 1) % tips.length; if (++tipCount >= 3) unlock('buddy'); return tips[tipIndex]; }
    body.querySelector('[data-buddy-next]').addEventListener('click', () => { body.querySelector('[data-buddy-tip]').textContent = next(); });
    body.querySelector('[data-buddy-pin]').addEventListener('click', () => {
      if (buddy) { buddy.remove(); buddy = null; close(); return; }
      buddy = document.createElement('aside'); buddy.className = 'rx-desktop-buddy'; buddy.setAttribute('aria-label', 'Office Buddy');
      buddy.innerHTML = `<button class="rx-buddy-dismiss" aria-label="Dismiss Office Buddy">×</button><div class="rx-paperclip">${clipArt}</div><p>${tips[tipIndex]}</p><button class="rx-buddy-next">Another tip</button>`;
      buddy.querySelector('.rx-buddy-dismiss').addEventListener('click', () => { buddy.remove(); buddy = null; });
      buddy.querySelector('.rx-buddy-next').addEventListener('click', () => { buddy.querySelector('p').textContent = next(); });
      document.body.append(buddy); close();
    });
    setStatus(''); return () => {};
  }

  function renderErrors(ctx) {
    const { body, setStatus, unlock } = ctx;
    body.innerHTML = '<div class="rx-error-lab"><div class="rx-error-stack"><div class="rx-fake-error"><div class="rx-error-title">leo.exe</div><div class="rx-error-message"><span class="rx-error-symbol">×</span><div><h3>Task failed successfully</h3><p data-error-copy>The computer has nothing to complain about.</p></div></div></div></div><div class="rx-error-actions"><button data-error-retry>Retry</button><button data-error-details aria-expanded="false">Details</button><button data-error-blue>Blue screen</button></div><pre class="rx-error-details" hidden>ERROR 0x0000COOL\nCause: excessive curiosity\nSolution: keep clicking</pre></div><div class="rx-blue-screen" hidden><strong>LEO/OS</strong><h3>CREATIVE_OVERFLOW</h3><p>Your ideas exceeded available pixels.</p><p>No files were harmed.</p><button data-reboot>Reboot desktop</button></div>';
    let retries = 0;
    const messages = ['The operation completed without failing.', 'Please wait faster.', 'An error occurred while reporting no errors.', 'The retry button is working perfectly.', 'You have reached peak productivity.'];
    body.querySelector('[data-error-retry]').addEventListener('click', () => {
      retries++; body.querySelector('[data-error-copy]').textContent = messages[(retries - 1) % messages.length];
      const stack = body.querySelector('.rx-error-stack'), layer = document.createElement('div'); layer.className = 'rx-error-echo'; layer.setAttribute('aria-hidden', 'true'); layer.textContent = 'leo.exe'; layer.style.setProperty('--layer', String(Math.min(retries, 4))); stack.prepend(layer);
      while (stack.querySelectorAll('.rx-error-echo').length > 4) stack.querySelector('.rx-error-echo').remove();
      setStatus(`Retry ${retries}`); if (retries >= 3) unlock('retry');
    });
    body.querySelector('[data-error-details]').addEventListener('click', e => { const detail = body.querySelector('.rx-error-details'); detail.hidden = !detail.hidden; e.currentTarget.setAttribute('aria-expanded', String(!detail.hidden)); });
    body.querySelector('[data-error-blue]').addEventListener('click', () => { body.querySelector('.rx-error-lab').hidden = true; body.querySelector('.rx-blue-screen').hidden = false; body.querySelector('[data-reboot]').focus(); setStatus(''); });
    body.querySelector('[data-reboot]').addEventListener('click', () => { body.querySelector('.rx-error-lab').hidden = false; body.querySelector('.rx-blue-screen').hidden = true; body.querySelector('[data-error-retry]').focus(); unlock('reboot'); });
    setStatus(''); return () => {};
  }
  window.LeoRetroApps = Object.freeze({ renderers: { mines: renderMines, saver: renderSaver, buddy: renderBuddy, errors: renderErrors } });
})();
