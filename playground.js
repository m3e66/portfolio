(() => {
  'use strict';

  const root = document.documentElement;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STORE = 'leo-os-playground-v1';
  const definitions = [
    { id: 'hello', name: 'First contact', hint: 'The terminal appreciates a friendly greeting.', detail: 'Said hello to the little computer.' },
    { id: 'sandwich', name: 'Lunch break', hint: 'The terminal has a very literal sudo command.', detail: 'Ordered a sandwich from a computer. Worth a try.' },
    { id: 'artist', name: 'Pixel apprentice', hint: 'Give at least 12 pixels a new color in Pixel Paint.', detail: 'Created a tiny piece of original pixel art.' },
    { id: 'signals', name: 'Signal hunter', hint: 'Catch five signals in the little arcade game.', detail: 'Recovered five signals before the timer ran out.' },
    { id: 'music', name: 'Sound check', hint: 'Press play in the music player. Sound is always your choice.', detail: 'Played an original little synthesized loop.' },
    { id: 'pet', name: 'Familiar friend', hint: 'A certain small creature likes attention. Try five greetings.', detail: 'Made friends with the desktop mascot.' },
    { id: 'collector', name: 'Lost & found', hint: 'Three little memory chips are hiding around the portfolio.', detail: 'Recovered all three hidden memory chips.' },
    { id: 'konami', name: 'Old-school player', hint: 'Try ↑ ↑ ↓ ↓ ← → ← → B A outside a text field.', detail: 'Remembered a classic game-controller sequence.' },
    { id: 'logo', name: 'Behind the build', hint: 'The v.26 / LEO_XU build stamp has a secret. Give it three taps.', detail: 'Discovered the note tucked behind the build stamp.' },
    { id: 'mines', name: 'Mine your business', hint: 'Clear every safe square in Minesweeper.', detail: 'Cleared the whole minefield.' },
    { id: 'saver', name: 'Screen time', hint: 'Let the screensaver logo bounce five times.', detail: 'Watched five perfect little rebounds.' },
    { id: 'buddy', name: 'Paperclip pal', hint: 'Ask Office Buddy for three more tips.', detail: 'Made a very helpful stationery friend.' },
    { id: 'retry', name: 'Task failed successfully', hint: 'Try Retry three times in Error Lab.', detail: 'Successfully failed to find a real error.' },
    { id: 'reboot', name: 'Back from the blue', hint: 'Try the blue screen in Error Lab and reboot.', detail: 'Recovered from a fictional creative overflow.' },
    { id: 'xp', name: 'Welcome home', hint: 'Find XP Blue in Control Panel.', detail: 'Brought back the blue taskbar and green Start button.' }
  ];
  const allowedIds = new Set(definitions.map(item => item.id));
  const allowedPalettes = new Set(['paper', 'midnight', 'peach', 'phosphor', 'xp']);
  let state = { found: [], chips: [], best: 0, palette: 'paper', motionOff: false };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') {
      state.found = Array.isArray(saved.found) ? [...new Set(saved.found.filter(id => allowedIds.has(id)))] : [];
      state.chips = Array.isArray(saved.chips) ? [...new Set(saved.chips.map(String).filter(id => ['1', '2', '3'].includes(id)))] : [];
      state.best = Number.isFinite(saved.best) ? Math.max(0, Math.min(10000, saved.best)) : 0;
      state.palette = allowedPalettes.has(saved.palette) ? saved.palette : 'paper';
      state.motionOff = saved.motionOff === true;
    }
  } catch {  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {  } }
  function motionAllowed() { return !media.matches && !root.classList.contains('motion-off'); }
  function refreshMotionButtons() {
    const off = media.matches || root.classList.contains('motion-off');
    document.querySelectorAll('.motion-button').forEach(button => {
      button.setAttribute('aria-pressed', String(off));
      button.textContent = off ? 'Resume motion' : 'Pause motion';
    });
  }
  root.dataset.palette = state.palette;
  if (state.motionOff || media.matches) root.classList.add('motion-off');
  refreshMotionButtons();

  const notification = document.createElement('div');
  notification.className = 'pg-toast';
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  notification.setAttribute('aria-atomic', 'true');
  notification.hidden = true;
  document.body.append(notification);
  let toastTimer;
  function toast(title, text) {
    clearTimeout(toastTimer);
    notification.replaceChildren();
    const strong = document.createElement('strong'); strong.textContent = title;
    const detail = document.createElement('span'); detail.textContent = text;
    notification.append(strong, detail);
    notification.hidden = false;
    toastTimer = setTimeout(() => { notification.hidden = true; }, 4200);
  }
  function confetti() {
    if (!motionAllowed()) return;
    const host = document.createElement('div');
    host.className = 'pg-confetti'; host.setAttribute('aria-hidden', 'true');
    const colors = ['#ed755e', '#f3cb68', '#5b9d98', '#123ca5', '#eee5d2'];
    for (let i = 0; i < 26; i++) {
      const bit = document.createElement('i');
      bit.style.setProperty('--pg-x', `${8 + Math.random() * 84}vw`);
      bit.style.setProperty('--pg-delay', `${Math.random() * 300}ms`);
      bit.style.setProperty('--pg-drift', `${(Math.random() - 0.5) * 220}px`);
      bit.style.backgroundColor = colors[i % colors.length];
      host.append(bit);
    }
    document.body.append(host);
    setTimeout(() => host.remove(), 2600);
  }
  function updateCounters() {
    document.querySelectorAll('[data-secret-count]').forEach(el => { el.textContent = `${state.found.length}/${definitions.length}`; });
    document.querySelectorAll('[data-chip-count]').forEach(el => { el.textContent = `${state.chips.length}/3`; });
    document.querySelectorAll('[data-collect]').forEach(el => {
      const found = state.chips.includes(String(el.dataset.collect));
      el.classList.toggle('is-collected', found);
      el.setAttribute('aria-pressed', String(found));
      if (found) el.setAttribute('title', 'Memory chip recovered');
    });
  }
  function unlock(id) {
    if (!allowedIds.has(id) || state.found.includes(id)) return false;
    state.found.push(id); save(); updateCounters();
    const item = definitions.find(entry => entry.id === id);
    toast(`Discovery ${state.found.length}/${definitions.length}: ${item.name}`, item.detail);
    if (dialog.open) setStatus(`Discovery unlocked: ${item.name} • ${state.found.length}/${definitions.length}`);
    confetti();
    document.dispatchEvent(new CustomEvent('leo:achievement', { detail: { id, count: state.found.length, total: definitions.length } }));
    if (currentApp === 'journal' && dialog.open) renderJournal();
    return true;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'pg-dialog';
  dialog.setAttribute('aria-labelledby', 'pg-window-title');
  dialog.innerHTML = '<div class="pg-titlebar"><span class="pg-title-icon" aria-hidden="true">▦</span><h2 id="pg-window-title"></h2><button class="pg-close" type="button" aria-label="Close playground window">×</button></div><div class="pg-body"></div><div class="pg-statusbar"><span class="pg-app-status" role="status" aria-live="polite" aria-atomic="true">Ready</span><span>LEO/OS</span></div>';
  document.body.append(dialog);
  const body = dialog.querySelector('.pg-body');
  const title = dialog.querySelector('#pg-window-title');
  const status = dialog.querySelector('.pg-app-status');
  const closeButton = dialog.querySelector('.pg-close');
  let currentApp = '';
  let previousFocus = null;
  let cleanup = () => {};
  let drag = null;
  let dragX = 0;
  let dragY = 0;
  const names = { journal: 'Secret Journal', terminal: 'Command Prompt', paint: 'Pixel Paint', signals: 'Signal Catcher', music: 'Tiny Music Player', settings: 'Control Panel', mines: 'Minesweeper', saver: 'Screen Saver', buddy: 'Office Buddy', errors: 'Error Lab' };

  function setStatus(text) { status.textContent = text; }
  function open(app) {
    if (!Object.prototype.hasOwnProperty.call(names, app)) return;
    const wasOpen = dialog.open;
    if (!wasOpen) previousFocus = document.activeElement;
    cleanup(); cleanup = () => {};
    currentApp = app;
    dialog.className = `pg-dialog pg-${app}-window`;
    dragX = 0; dragY = 0; dialog.style.removeProperty('translate');
    title.textContent = names[app];
    body.replaceChildren();
    setStatus('Ready');
    const renderers = { journal: renderJournal, terminal: renderTerminal, paint: renderPaint, signals: renderSignals, music: renderMusic, settings: renderSettings };
    for (const [name, render] of Object.entries(window.LeoRetroApps?.renderers || {})) {
      renderers[name] = () => { cleanup = render({ body, dialog, setStatus, unlock, toast, motionAllowed, open, close }) || (() => {}); };
    }
    renderers[app]();
    if (!wasOpen) dialog.showModal();
    const first = body.querySelector('[autofocus]');
    if (first) first.focus(); else closeButton.focus();
  }
  function close() { dialog.close(); }
  closeButton.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    cleanup(); cleanup = () => {}; currentApp = '';
    previousFocus?.focus?.();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.querySelector('.pg-titlebar').addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button') || innerWidth < 650) return;
    drag = { x: event.clientX, y: event.clientY, startX: dragX, startY: dragY, rect: dialog.getBoundingClientRect() };
    event.currentTarget.setPointerCapture(event.pointerId);
  });
  dialog.querySelector('.pg-titlebar').addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = Math.max(-drag.rect.left + 8, Math.min(innerWidth - drag.rect.right - 8, event.clientX - drag.x));
    const dy = Math.max(-drag.rect.top + 8, Math.min(innerHeight - drag.rect.bottom - 8, event.clientY - drag.y));
    dragX = Math.round(drag.startX + dx); dragY = Math.round(drag.startY + dy);
    dialog.style.translate = `${dragX}px ${dragY}px`;
  });
  const endDrag = () => { drag = null; };
  dialog.querySelector('.pg-titlebar').addEventListener('pointerup', endDrag);
  dialog.querySelector('.pg-titlebar').addEventListener('lostpointercapture', endDrag);
  addEventListener('resize', () => { dragX = 0; dragY = 0; dialog.style.removeProperty('translate'); });

  function renderJournal() {
    body.innerHTML = '<div class="pg-journal-heading"><div><p class="pg-kicker">EXPLORER’S LOG</p><h3>A little curiosity goes a long way</h3></div><span class="pg-progress"></span></div><div class="pg-achievements"></div>';
    body.querySelector('.pg-progress').textContent = `${state.found.length} / ${definitions.length}`;
    const list = body.querySelector('.pg-achievements');
    definitions.forEach((item, index) => {
      const found = state.found.includes(item.id);
      const entry = document.createElement('article');
      entry.className = `pg-achievement${found ? ' is-found' : ''}`;
      const number = document.createElement('span'); number.className = 'pg-achievement-number'; number.textContent = found ? '✓' : String(index + 1).padStart(2, '0');
      const copy = document.createElement('div');
      const heading = document.createElement('h4'); heading.textContent = found ? item.name : 'Undiscovered';
      const detail = document.createElement('p'); detail.textContent = found ? item.detail : item.hint;
      copy.append(heading, detail); entry.append(number, copy); list.append(entry);
    });
    setStatus(`Memory chips: ${state.chips.length}/3 • ${state.found.length}/${definitions.length} discoveries`);
  }

  const TERMINAL_STORE = 'leo-os-terminal-v1';
  let terminalSession = null, terminalTranscript = [];

  function clearSavedData() {
    try {
      localStorage.removeItem(STORE);
      localStorage.removeItem(TERMINAL_STORE);
    } catch {
      setStatus('Unable to clear saved data in this browser');
      return false;
    }
    location.reload();
    return true;
  }
  addEventListener('storage', event => {
    if ((event.key === STORE || event.key === TERMINAL_STORE) && event.newValue === null) location.reload();
  });

  function renderTerminal() {
    if (!terminalSession) {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(TERMINAL_STORE) || 'null'); } catch { /* Use the initial desktop files. */ }
      terminalSession = window.LeoTerminal(saved);
      terminalTranscript = [{ text: 'LEO/OS Command Prompt 2.0', type: '' }, { text: 'Type help for commands', type: '' }];
    }
    body.innerHTML = '<div class="pg-terminal-output" role="log" aria-live="polite" aria-label="Terminal output"></div><form class="pg-terminal-form"><label for="pg-command"></label><input id="pg-command" name="command" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command" placeholder="type help" maxlength="4096" autofocus><button type="submit">Run</button></form>';
    const output = body.querySelector('.pg-terminal-output'), form = body.querySelector('form');
    const input = body.querySelector('input'), prompt = body.querySelector('label');
    let historyIndex = terminalSession.history.length, draft = '';
    function append(text, type = '') {
      const item = document.createElement('p'); item.className = type; item.textContent = text || '\u00a0'; output.append(item);
      while (output.childElementCount > 200) output.firstElementChild.remove();
      output.scrollTop = output.scrollHeight;
    }
    function line(text, type = '') {
      terminalTranscript.push({ text, type }); terminalTranscript = terminalTranscript.slice(-200); append(text, type);
    }
    function clear() { terminalTranscript = []; output.replaceChildren(); }
    function updatePrompt() { prompt.textContent = terminalSession.prompt; }
    function saveTerminal() {
      try { localStorage.setItem(TERMINAL_STORE, JSON.stringify(terminalSession.exportState())); }
      catch { setStatus('Changes kept for this tab only'); }
    }
    terminalTranscript.forEach(item => append(item.text, item.type)); updatePrompt();
    form.addEventListener('submit', event => {
      event.preventDefault(); const command = input.value.trim(); if (!command) return;
      line(`${terminalSession.prompt} ${command}`, 'pg-command-echo'); input.value = ''; draft = '';
      const result = terminalSession.run(command); historyIndex = terminalSession.history.length;
      setStatus('');
      if (result.clear) clear();
      result.lines.forEach(text => line(text, result.error ? 'pg-terminal-error' : ''));
      if (result.secrets) line(`Discoveries: ${state.found.length}/${definitions.length} Memory chips: ${state.chips.length}/3`);
      if (result.unlock) unlock(result.unlock);
      updatePrompt(); saveTerminal();
      if (result.exit) { close(); return; }
      if (result.app) { open(result.app); return; }
      if (result.page) { location.href = result.page; return; }
      input.focus();
    });
    input.addEventListener('keydown', event => {
      const history = terminalSession.history;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex === history.length) draft = input.value;
        historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
        input.value = historyIndex === history.length ? draft : history[historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (event.key === 'Tab' && !event.shiftKey && input.value && input.selectionEnd === input.value.length) {
        event.preventDefault(); const result = terminalSession.complete(input.value); input.value = result.value;
        input.setSelectionRange(input.value.length, input.value.length);
        if (result.candidates.length) line(result.candidates.join('  '));
      } else if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); clear(); }
      else if (event.ctrlKey && event.key.toLowerCase() === 'c' && input.selectionStart === input.selectionEnd && !String(document.getSelection())) {
        event.preventDefault(); line(`${terminalSession.prompt} ${input.value}^C`, 'pg-command-echo'); input.value = ''; draft = ''; historyIndex = history.length;
      }
    });
    setStatus('');
  }

  const paintColors = [null, '#303b52', '#eee5d2', '#ed755e', '#123ca5', '#7bb7a1', '#f3cb68', '#b59ccf'];
  const paintNames = ['Eraser', 'Ink', 'Paper', 'Coral', 'Blue', 'Mint', 'Gold', 'Lavender'];
  let pixels = Array(144).fill(null), selectedColor = '#123ca5', paintHistory = [], paintedCells = new Set();
  function renderPaint() {
    body.innerHTML = '<div class="pg-paint-layout"><div><p class="pg-kicker">12 × 12 / EVERY PIXEL COUNTS</p><div class="pg-palette" aria-label="Paint colors"></div><div class="pg-pixel-grid" role="group" aria-label="Pixel drawing, 12 rows and 12 columns Use arrow keys to move and Space to paint"></div></div><aside class="pg-paint-tools"><h3>Pixel Paint</h3><p>Choose a color, then click or drag across the canvas.</p><button type="button" data-paint="undo">Undo</button><button type="button" data-paint="clear">Clear canvas</button><button type="button" class="pg-primary" data-paint="save">Save PNG ↓</button></aside></div>';
    const palette = body.querySelector('.pg-palette');
    const grid = body.querySelector('.pg-pixel-grid');
    let pointerDown = false;
    paintColors.forEach((color, i) => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'pg-swatch' + (color ? '' : ' pg-eraser');
      if (color) button.style.backgroundColor = color;
      button.setAttribute('aria-label', paintNames[i]); button.title = paintNames[i];
      button.setAttribute('aria-pressed', String(selectedColor === color));
      button.addEventListener('click', () => {
        selectedColor = color;
        palette.querySelectorAll('button').forEach((el, index) => el.setAttribute('aria-pressed', String(paintColors[index] === color)));
        setStatus(`Tool: ${paintNames[i]}`);
      });
      palette.append(button);
    });
    const cells = pixels.map((color, index) => {
      const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'pg-pixel';
      cell.dataset.pixel = String(index); cell.tabIndex = index === 0 ? 0 : -1;
      grid.append(cell); return cell;
    });
    function refresh() {
      cells.forEach((cell, index) => {
        cell.style.backgroundColor = pixels[index] || '';
        cell.classList.toggle('is-empty', !pixels[index]);
        cell.setAttribute('aria-label', `Row ${Math.floor(index / 12) + 1}, column ${index % 12 + 1}, ${pixels[index] ? paintNames[paintColors.indexOf(pixels[index])] : 'empty'}`);
      });
      body.querySelector('[data-paint="undo"]').disabled = paintHistory.length === 0;
    }
    function snapshot() { paintHistory.push([...pixels]); if (paintHistory.length > 40) paintHistory.shift(); }
    function paint(index) {
      if (!Number.isInteger(index) || index < 0 || index > 143 || pixels[index] === selectedColor) return;
      pixels[index] = selectedColor;
      if (selectedColor) paintedCells.add(index);
      refresh();
      if (paintedCells.size >= 12) unlock('artist');
    }
    grid.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const cell = event.target.closest('[data-pixel]'); if (!cell) return;
      event.preventDefault(); pointerDown = true; snapshot();
      cells.forEach(el => { el.tabIndex = el === cell ? 0 : -1; }); cell.focus();
      grid.setPointerCapture(event.pointerId); paint(Number(cell.dataset.pixel));
    });
    grid.addEventListener('pointermove', event => {
      if (!pointerDown) return;
      const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-pixel]');
      if (cell && grid.contains(cell)) paint(Number(cell.dataset.pixel));
    });
    grid.addEventListener('pointerup', () => { pointerDown = false; });
    grid.addEventListener('lostpointercapture', () => { pointerDown = false; });
    grid.addEventListener('click', event => {
      const cell = event.target.closest('[data-pixel]');
      if (cell && event.detail === 0) { snapshot(); paint(Number(cell.dataset.pixel)); }
    });
    grid.addEventListener('keydown', event => {
      const cell = event.target.closest('[data-pixel]'); if (!cell) return;
      let index = Number(cell.dataset.pixel), next = index;
      if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
      else if (event.key === 'ArrowRight') next = Math.min(143, index + 1);
      else if (event.key === 'ArrowUp') next = Math.max(0, index - 12);
      else if (event.key === 'ArrowDown') next = Math.min(143, index + 12);
      else return;
      event.preventDefault(); cells.forEach(el => { el.tabIndex = -1; }); cells[next].tabIndex = 0; cells[next].focus();
    });
    body.querySelector('[data-paint="undo"]').addEventListener('click', () => { if (paintHistory.length) { pixels = paintHistory.pop(); refresh(); setStatus('One step back'); } });
    body.querySelector('[data-paint="clear"]').addEventListener('click', () => { snapshot(); pixels.fill(null); refresh(); setStatus('Fresh canvas Undo is available'); });
    body.querySelector('[data-paint="save"]').addEventListener('click', () => {
      const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 192;
      const context = canvas.getContext('2d');
      pixels.forEach((color, index) => { if (color) { context.fillStyle = color; context.fillRect((index % 12) * 16, Math.floor(index / 12) * 16, 16, 16); } });
      const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = 'leo-os-pixel-art.png'; link.click();
      setStatus('PNG saved Small canvas, big ideas');
    });
    refresh(); setStatus('12 × 12 canvas • Transparent background • 192px PNG export');
  }

  function renderSignals() {
    body.innerHTML = '<div class="pg-game-header"><div><h3>Catch the signal</h3></div><div class="pg-game-stats"><span>FOUND <strong data-score>0</strong></span><span>TIME <strong data-time>15</strong></span><span>BEST <strong data-best></strong></span></div></div><p class="pg-intro">Click each signal before time runs out.</p><div class="pg-signal-board"><div class="pg-game-idle"><span aria-hidden="true">⌁</span><p>The airwaves are quiet.</p></div><button class="pg-target" type="button" aria-label="Catch signal" hidden><span aria-hidden="true">✦</span></button></div><div class="pg-game-actions"><button class="pg-primary" type="button" data-start>Start · 15 seconds</button><p class="pg-game-message" role="status" aria-live="polite"></p></div>';
    const board = body.querySelector('.pg-signal-board');
    const target = body.querySelector('.pg-target');
    const idle = body.querySelector('.pg-game-idle');
    const start = body.querySelector('[data-start]');
    const scoreEl = body.querySelector('[data-score]');
    const timeEl = body.querySelector('[data-time]');
    const bestEl = body.querySelector('[data-best]');
    const message = body.querySelector('.pg-game-message');
    let score = 0, timer = 0, running = false, end = 0;
    bestEl.textContent = String(state.best);
    function reposition() {
      target.style.left = `${8 + Math.random() * Math.max(0, board.clientWidth - 76)}px`;
      target.style.top = `${8 + Math.random() * Math.max(0, board.clientHeight - 76)}px`;
    }
    function finish(interrupted = false) {
      const targetHadFocus = document.activeElement === target;
      clearInterval(timer); running = false; target.hidden = true; idle.hidden = false;
      idle.querySelector('p').textContent = interrupted ? 'Signal paused. Try another round.' : `${score} signals recovered`;
      start.textContent = 'Play again · 15 seconds'; start.disabled = false;
      if (score > state.best) { state.best = score; save(); }
      bestEl.textContent = String(state.best);
      message.textContent = interrupted ? 'Round ended because the page was hidden.' : `Round complete. ${score} signals caught. Best: ${state.best}`;
      setStatus(`Local best: ${state.best} signals`);
      if (targetHadFocus) start.focus();
    }
    start.addEventListener('click', () => {
      clearInterval(timer); score = 0; scoreEl.textContent = '0'; timeEl.textContent = '15';
      end = performance.now() + 15000; running = true; idle.hidden = true; target.hidden = false;
      start.disabled = true; start.textContent = 'Listening…'; message.textContent = 'Catch the glowing signal!';
      reposition(); target.focus();
      timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((end - performance.now()) / 1000)); timeEl.textContent = String(remaining);
        if (remaining <= 0) finish();
      }, 150);
    });
    target.addEventListener('click', () => {
      if (!running) return;
      if (performance.now() >= end) { finish(); return; }
      score++; scoreEl.textContent = String(score); reposition();
      if (score >= 5) unlock('signals');
      if (motionAllowed()) { board.classList.remove('pg-caught'); void board.offsetWidth; board.classList.add('pg-caught'); }
    });
    const visibility = () => { if (document.hidden && running) finish(true); };
    document.addEventListener('visibilitychange', visibility);
    cleanup = () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
    setStatus('');
  }

  let audioContext = null;
  const tracks = [
    { name: 'Garden.exe', notes: [60, 64, 67, 71, 67, 64, 62, 67], bass: 36, duration: 310 },
    { name: 'Signal Drift', notes: [57, 64, 69, 72, 76, 72, 69, 64], bass: 33, duration: 270 },
    { name: 'Tiny Victory', notes: [60, 67, 72, 76, 74, 72, 67, 64], bass: 36, duration: 230 }
  ];
  let trackIndex = 0;
  function renderMusic() {
    body.innerHTML = '<div class="pg-player"><div class="pg-album" aria-hidden="true"><div class="pg-record"><span>LX</span></div><div class="pg-equalizer">' + '<i></i>'.repeat(10) + '</div></div><div class="pg-player-info"><h3 class="pg-track-title"></h3><dl><div><dt>COMPOSED BY</dt><dd>The tiny computer</dd></div><div><dt>FORMAT</dt><dd>Live Web Audio synthesis</dd></div><div><dt>STREAMS / COOKIES</dt><dd>None / none</dd></div></dl><div class="pg-player-controls"><button type="button" data-track="prev" aria-label="Previous loop">◀◀</button><button type="button" class="pg-primary" data-play>Play ▶</button><button type="button" data-track="next" aria-label="Next loop">▶▶</button></div></div></div>';
    const player = body.querySelector('.pg-player');
    const playButton = body.querySelector('[data-play]');
    const titleEl = body.querySelector('.pg-track-title');
    let interval = 0, playing = false, pending = false, step = 0, generation = 0;
    const oscillators = new Set();
    function updateTrack() { titleEl.textContent = tracks[trackIndex].name; }
    function tone(midi, duration, gain, wave) {
      if (!audioContext || audioContext.state !== 'running') return;
      const oscillator = audioContext.createOscillator(); const envelope = audioContext.createGain();
      oscillator.type = wave; oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      const now = audioContext.currentTime;
      envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(gain, now + .02); envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(envelope); envelope.connect(audioContext.destination);
      oscillators.add(oscillator);
      oscillator.addEventListener('ended', () => { oscillators.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); });
      oscillator.start(now); oscillator.stop(now + duration + .03);
    }
    function tick() {
      if (!playing || document.hidden) return;
      const track = tracks[trackIndex];
      tone(track.notes[step % track.notes.length], .35, .028, 'triangle');
      if (step % 4 === 0) tone(track.bass + (step % 8 === 4 ? 7 : 0), .8, .018, 'sine');
      step++;
    }
    function stop() {
      generation++; playing = false; pending = false; clearInterval(interval);
      player.classList.remove('is-playing'); playButton.textContent = 'Play ▶'; playButton.disabled = false;
      oscillators.forEach(oscillator => { try { oscillator.stop(); } catch { /* It already ended. */ } });
      audioContext?.suspend().catch(() => {});
      setStatus('');
    }
    async function start() {
      const request = ++generation; pending = true; playButton.disabled = true;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Web Audio is unavailable');
        audioContext ||= new Audio();
        await audioContext.resume();
        if (request !== generation || !dialog.open || currentApp !== 'music') { audioContext.suspend().catch(() => {}); return; }
        pending = false; playing = true; playButton.disabled = false; playButton.textContent = 'Stop ■'; step = 0;
        player.classList.add('is-playing'); tick(); interval = setInterval(tick, tracks[trackIndex].duration);
        setStatus(`Playing ${tracks[trackIndex].name} • Quiet original loop`); unlock('music');
      } catch {
        pending = false; playButton.disabled = false; setStatus('Audio is unavailable in this browser The rest of the desktop still works');
      }
    }
    playButton.addEventListener('click', () => { if (pending) return; if (playing) stop(); else start(); });
    body.querySelectorAll('[data-track]').forEach(button => button.addEventListener('click', () => {
      const wasPlaying = playing; stop(); trackIndex = (trackIndex + (button.dataset.track === 'next' ? 1 : tracks.length - 1)) % tracks.length; updateTrack(); if (wasPlaying) start();
    }));
    const visibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', visibility);
    cleanup = () => { stop(); document.removeEventListener('visibilitychange', visibility); };
    updateTrack(); setStatus('Sound off • Press Play to listen');
  }

  function applySettings() {
    root.dataset.palette = state.palette;
    root.classList.toggle('motion-off', state.motionOff || media.matches);
    refreshMotionButtons();
    if (state.motionOff || media.matches) document.querySelectorAll('.reveal').forEach(el => el.classList.remove('is-pending'));
    save();
    document.dispatchEvent(new CustomEvent('leo:settings', { detail: { palette: state.palette, motionOff: state.motionOff || media.matches } }));
  }
  function renderSettings() {
    body.innerHTML = '<h3>A desktop with a few preferences</h3><fieldset class="pg-setting-group"><legend>Desktop palette</legend><div class="pg-themes"><button type="button" data-palette="paper"><span class="pg-theme-preview pg-theme-paper" aria-hidden="true"></span>Paper</button><button type="button" data-palette="midnight"><span class="pg-theme-preview pg-theme-midnight" aria-hidden="true"></span>Midnight</button><button type="button" data-palette="peach"><span class="pg-theme-preview pg-theme-peach" aria-hidden="true"></span>Peach</button><button type="button" data-palette="phosphor"><span class="pg-theme-preview pg-theme-phosphor" aria-hidden="true"></span>Green screen</button><button type="button" data-palette="xp"><span class="pg-theme-preview pg-theme-xp" aria-hidden="true"></span>XP Blue</button></div></fieldset><fieldset class="pg-setting-group"><legend>Motion</legend><label class="pg-checkbox"><input type="checkbox" id="pg-reduce-motion"> Pause decorative motion</label><p class="pg-motion-note"></p></fieldset><fieldset class="pg-setting-group"><legend>Saved data</legend><button type="button" data-clear-data>Clear data</button><div id="pg-reset-confirm" hidden><p>Clear discoveries, scores, display settings, and terminal data?</p><div class="pg-reset-actions"><button type="button" class="pg-primary" data-clear-confirmed>Yes, clear data</button><button type="button" data-clear-cancel>Cancel</button></div></div></fieldset>';
    body.querySelectorAll('[data-palette]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.palette === state.palette));
      button.addEventListener('click', () => {
        state.palette = button.dataset.palette; applySettings();
        body.querySelectorAll('[data-palette]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.palette === state.palette)));
        setStatus(`${state.palette[0].toUpperCase() + state.palette.slice(1)} palette selected`);
        if (state.palette === 'xp') unlock('xp');
      });
    });
    const clearButton = body.querySelector('[data-clear-data]');
    const confirmation = body.querySelector('#pg-reset-confirm');
    const cancelReset = body.querySelector('[data-clear-cancel]');
    const confirmReset = body.querySelector('[data-clear-confirmed]');
    clearButton.addEventListener('click', () => {
      clearButton.hidden = true; confirmation.hidden = false; cancelReset.focus();
    });
    cancelReset.addEventListener('click', () => {
      confirmation.hidden = true; clearButton.hidden = false; clearButton.focus();
    });
    confirmReset.addEventListener('click', () => {
      confirmReset.disabled = true;
      if (!clearSavedData()) confirmReset.disabled = false;
    });
    const motion = body.querySelector('#pg-reduce-motion');
    motion.checked = state.motionOff || root.classList.contains('motion-off') || media.matches;
    motion.disabled = media.matches;
    body.querySelector('.pg-motion-note').textContent = media.matches ? 'Reduced motion is enabled by your operating system.' : 'Stops decorative movement.';
    motion.addEventListener('change', () => { state.motionOff = motion.checked; applySettings(); setStatus(state.motionOff ? 'Decorative motion paused' : 'Decorative motion resumed'); });
    setStatus('Preferences are local to this browser');
  }
  media.addEventListener('change', () => { applySettings(); if (dialog.open && currentApp === 'settings') renderSettings(); });
  const motionObserver = new MutationObserver(() => {
    if (media.matches) {
      if (!root.classList.contains('motion-off')) root.classList.add('motion-off');
    } else {
      const off = root.classList.contains('motion-off');
      if (state.motionOff !== off) { state.motionOff = off; save(); }
    }
    refreshMotionButtons();
    if (dialog.open && currentApp === 'settings') {
      const toggle = body.querySelector('#pg-reduce-motion');
      if (toggle) { toggle.checked = media.matches || root.classList.contains('motion-off'); toggle.disabled = media.matches; }
    }
  });
  motionObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

  let petTaps = 0, logoTaps = 0;
  const petMessages = ['A visitor! It looks up', 'It makes a very small happy noise', 'You have its full attention now', 'One more greeting?', 'Friendship acquired It was rooting for you all along'];
  document.addEventListener('click', event => {
    const app = event.target.closest('[data-app]');
    if (app) { const name = app.dataset.app; if (names[name]) { event.preventDefault(); open(name); } return; }
    const pet = event.target.closest('[data-pet]');
    if (pet) {
      petTaps++;
      const response = document.querySelector('[data-pet-response]');
      const message = petMessages[Math.min(petTaps - 1, petMessages.length - 1)];
      if (response) response.textContent = message;
      const ghost = pet.querySelector('.pixel-icon');
      if (ghost && motionAllowed()) {
        ghost.classList.remove('pg-pet-hop');
        void ghost.offsetWidth;
        ghost.classList.add('pg-pet-hop');
        ghost.onanimationend = () => ghost.classList.remove('pg-pet-hop');
      }
      if (petTaps < 5) toast('Desktop familiar', message); else if (!unlock('pet')) toast('Desktop familiar', 'Still your friend Still cheering you on');
      return;
    }
    const chip = event.target.closest('[data-collect]');
    if (chip) {
      const id = String(chip.dataset.collect); if (!['1', '2', '3'].includes(id)) return;
      if (!state.chips.includes(id)) {
        state.chips.push(id); save(); updateCounters();
        if (state.chips.length === 3) unlock('collector'); else toast('Memory chip recovered', `${state.chips.length}/3 found There are more hiding in plain sight`);
      } else toast('Already recovered', 'This little memory chip is safely in your journal');
      return;
    }
    if (event.target.closest('[data-secret]')) {
      logoTaps++;
      if (logoTaps >= 3) {
        if (!unlock('logo')) toast('A note from the desktop', 'Keep making things Even the little weird ones');
      }
    }
  });
  const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let sequencePosition = 0, lastKeyTime = 0;
  document.addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select,[contenteditable="true"]') || dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const now = performance.now(); if (now - lastKeyTime > 3000) sequencePosition = 0; lastKeyTime = now;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === sequence[sequencePosition]) sequencePosition++;
    else sequencePosition = key === sequence[0] ? 1 : 0;
    if (sequencePosition === sequence.length) {
      sequencePosition = 0;
      if (!unlock('konami')) { toast('Old-school player', 'No extra lives needed Curiosity is unlimited'); confetti(); }
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) document.querySelectorAll('.pg-confetti').forEach(el => el.remove()); });
  updateCounters();
  window.LeoPlayground = Object.freeze({ open, unlock });
})();
