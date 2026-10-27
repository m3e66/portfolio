(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LeoTerminal = factory();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const commands = ['help', 'ls', 'dir', 'pwd', 'cd', 'tree', 'cat', 'type', 'echo', 'clear', 'cls', 'history', 'whoami', 'date', 'time', 'ver', 'open', 'hello', 'about', 'projects', 'credits', 'secrets', 'exit'];
  const apps = { paint: 'paint', 'pixel-paint': 'paint', music: 'music', 'music-lab': 'music', signals: 'signals', 'signal-hunt': 'signals', mines: 'mines', minesweeper: 'mines', saver: 'saver', 'screen-saver': 'saver', buddy: 'buddy', 'office-buddy': 'buddy', errors: 'errors', 'error-lab': 'errors', journal: 'journal', discoveries: 'journal', settings: 'settings', desktop: 'settings' };
  const pages = { cultivation: 'immortal-cultivation.html', 'immortal-cultivation': 'immortal-cultivation.html', 'last-signal': 'last-signal.html', portfolio: 'index.html', projects: 'index.html#projects', about: 'index.html#about', contact: 'index.html#contact' };
  const aliases = { dir: 'ls', type: 'cat', cls: 'clear', hi: 'hello' };
  const help = [
    'FILES & FOLDERS',
    '  ls / dir [path]       List a folder (-l for details)',
    '  cd [path]            Change folder; cd .. goes up',
    '  pwd / tree [path]    Show location or folder tree',
    '  cat / type <file>    Read a text file',
    '  echo <text>          Print text',
    '',
    'DESKTOP',
    '  open <name>          Launch an app or project',
    '  open minesweeper     Try a game',
    '  open last-signal     Read the project case study',
    '  open                 List all app and project names',
    '',
    'SESSION',
    '  help  history  whoami  date  time  ver  clear  exit',
    '  history -c           Clear saved command history',
    '  hello  about  projects  credits  secrets',
    '',
    'Use quotes for names with spaces',
    'Tab completes commands and paths; Up/Down recalls commands',
    'Files are read-only; use cd and cat to explore'
  ];

  function tokenize(source, partial = false) {
    const tokens = []; let value = '', quote = '', start = -1;
    const flush = end => { if (start >= 0) tokens.push({ value, start, end, kind: 'word' }); value = ''; start = -1; };
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (quote) { if (ch === quote) quote = ''; else value += ch; continue; }
      if (ch === '"' || ch === "'") { if (start < 0) start = i; quote = ch; }
      else if (/\s/.test(ch)) flush(i);
      else if (ch === '>') { flush(i); const append = source[i + 1] === '>'; tokens.push({ value: append ? '>>' : '>', kind: 'redirect', start: i, end: i + (append ? 2 : 1) }); if (append) i++; }
      else { if (start < 0) start = i; value += ch; }
    }
    if (quote && !partial) throw new Error('Unclosed quote');
    flush(source.length); return tokens;
  }

  function seedFiles() {
    const fs = new Map([['/', { type: 'dir', name: '' }]]);
    const dir = path => fs.set(path, { type: 'dir', name: path.split('/').pop() });
    const file = (path, text) => fs.set(path, { type: 'file', name: path.split('/').pop(), text });
    dir('/projects'); dir('/playground'); dir('/notes');
    file('/readme.txt', 'Welcome to Leo/OS\n\nTry these commands:\n  dir\n  cd projects\n  type last-signal.txt\n  cd ..\n  type ideas.txt\n\nType help for all commands');
    file('/ideas.txt', 'Small idea + a little code + many iterations = something playable');
    file('/projects/immortal-cultivation.txt', 'Immortal Cultivation Mod\nJava / NeoForge / Minecraft\nCombat, spells, mobs, progression, dimensions, and interfaces\n350+ development hours / 4K+ downloads / 16K+ views\nhttps://stardance.hackclub.com/projects/14130\n\nopen cultivation');
    file('/projects/last-signal.txt', 'Last Signal\nGodot / Windows / 1–6 players\nTurn-based survival, resource management, technology auctions, alliances, and trading\nhttps://m3e660.itch.io/last-signal\n\nopen last-signal');
    file('/projects/other-projects.txt', 'SMFS — 3D modeling and textures in a team project\nMini Advent of Code — web development and team leadership\nHonkai: Star Rail Cursor Mod — interface customization\nEye-Tracking Keyboard — Swift and accessibility');
    file('/playground/apps.txt', 'open signal-hunt\nopen pixel-paint\nopen music-lab\nopen minesweeper\nopen screen-saver\nopen office-buddy\nopen error-lab\nopen discoveries\nopen settings');
    return fs;
  }

  return function createTerminal(saved) {
    let files = seedFiles(), cwd = '/', history = [];
    const parent = path => path.slice(0, path.lastIndexOf('/')) || '/';
    const children = path => [...files].filter(([key]) => key !== path && parent(key) === path).sort((a, b) => (a[1].type === b[1].type ? a[1].name.localeCompare(b[1].name) : a[1].type === 'dir' ? -1 : 1));
    function checkSize(map) {
      if (map.size > 500 || [...map.values()].reduce((total, entry) => total + (entry.text?.length || 0), 0) > 250000) throw new Error('Saved terminal data exceeds the storage limit');
    }
    if (saved?.version === 1 && Array.isArray(saved.files)) {
      try {
        const restored = new Map();
        for (const [key, entry] of saved.files) {
          if (typeof key !== 'string' || key.length > 512 || key !== key.toLowerCase() || !/^\/(?:[^\\/:*?"<>|\x00-\x1f]+(?:\/[^\\/:*?"<>|\x00-\x1f]+)*)?$/.test(key) || key.split('/').some(part => part === '.' || part === '..')) throw new Error('Invalid saved path');
          if (!entry || !['dir', 'file'].includes(entry.type) || typeof entry.name !== 'string' || (key !== '/' && entry.name.toLowerCase() !== key.split('/').pop()) || (entry.type === 'file' && typeof entry.text !== 'string')) throw new Error('Invalid saved file');
          restored.set(key, entry.type === 'dir' ? { type: 'dir', name: entry.name } : { type: 'file', name: entry.name, text: entry.text });
        }
        if (restored.get('/')?.type !== 'dir' || [...restored.keys()].some(key => key !== '/' && restored.get(parent(key))?.type !== 'dir')) throw new Error('Invalid saved folders');
        const legacyReadme = 'Welcome to Leo/OS\n\nTry these commands:\n  dir\n  cd projects\n  type last-signal.txt\n  cd ..\n  echo "My next game idea" > notes/idea.txt\n  type notes/idea.txt\n\nType help for all commands';
        if (restored.get('/readme.txt')?.text === legacyReadme) restored.set('/readme.txt', seedFiles().get('/readme.txt'));
        checkSize(restored); files = restored;
        if (typeof saved.cwd === 'string' && files.get(saved.cwd)?.type === 'dir') cwd = saved.cwd;
        if (Array.isArray(saved.history)) history = saved.history.filter(line => typeof line === 'string' && line.length <= 4096).slice(-100);
      } catch { /* A damaged save falls back to the original desktop files. */ }
    }
    function resolve(raw = '.', base = cwd) {
      let value = raw.replace(/\\/g, '/');
      if (/^[^/]+:/.test(value)) { if (!/^leo:/i.test(value)) throw new Error('Drive not found — use LEO:'); value = value.replace(/^leo:/i, ''); if (!value.startsWith('/')) value = '/' + value; }
      if (value === '~') value = '/'; else if (value.startsWith('~/')) value = value.slice(1);
      const parts = value.startsWith('/') ? [] : base.split('/').filter(Boolean);
      for (const part of value.split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') { parts.pop(); continue; }
        if (/[:*?"<>|\x00-\x1f]/.test(part) || part.length > 100) throw new Error('Invalid file or folder name');
        parts.push(part.toLowerCase());
      }
      const path = '/' + parts.join('/');
      if (path.length > 512) throw new Error('Path is too long');
      return path;
    }
    function display(path = cwd) {
      let prefix = '';
      return 'LEO:\\' + path.split('/').filter(Boolean).map(part => { prefix += '/' + part; return files.get(prefix)?.name || part; }).join('\\');
    }
    function need(path, type) {
      const entry = files.get(path);
      if (!entry) throw new Error('Path not found: ' + display(path));
      if (type && entry.type !== type) throw new Error(type === 'dir' ? 'Not a folder: ' + display(path) : 'Not a file: ' + display(path));
      return entry;
    }
    function arity(args, min, max = min, usage = '') { if (args.length < min || args.length > max) throw new Error('Usage: ' + usage); }
    function run(source) {
      source = source.trim(); if (!source) return { lines: [] };
      if (source.length > 4096) return { lines: ['Command too long'], error: true };
      history.push(source); history = history.slice(-100);
      try {
        const tokens = tokenize(source), words = tokens.map(token => token.value);
        let name = words.shift()?.toLowerCase(); name = Object.hasOwn(aliases, name) ? aliases[name] : name;
        let args = words;
        const redirect = tokens.findIndex(token => token.kind === 'redirect');
        if (redirect >= 0 || ['touch', 'mkdir', 'md', 'cp', 'copy', 'mv', 'move', 'ren', 'rename', 'rm', 'del', 'rmdir', 'rd', 'undo', 'edit', 'nano', 'vi', 'vim', 'write', 'append', 'tee', 'truncate'].includes(name)) throw new Error('Read-only terminal — files cannot be created, changed, or deleted');
        switch (name) {
          case 'help': return { lines: help };
          case 'pwd': return { lines: [display()] };
          case 'cd': {
            arity(args, 0, 1, 'cd [path]'); const next = resolve(args[0] || '/'); need(next, 'dir'); cwd = next; return { lines: [] };
          }
          case 'ls': {
            const flags = args.filter(arg => /^[-/][abl]+$/i.test(arg)); args = args.filter(arg => !flags.includes(arg)); arity(args, 0, 1, 'ls [-l] [path]');
            const path = resolve(args[0]); const entry = need(path), list = entry.type === 'dir' ? children(path) : [[path, entry]];
            return { lines: list.map(([, item]) => flags.some(flag => flag.includes('l')) ? `${item.type === 'dir' ? '<DIR>       ' : String(item.text.length).padStart(6) + ' chars'}  ${item.name}` : item.name + (item.type === 'dir' ? '/' : '')) };
          }
          case 'tree': {
            arity(args, 0, 1, 'tree [path]'); const path = resolve(args[0]); need(path, 'dir'); const lines = [display(path)];
            function branch(dir, prefix = '') { const list = children(dir); list.forEach(([key, entry], i) => { const last = i === list.length - 1; lines.push(prefix + (last ? '└─ ' : '├─ ') + entry.name + (entry.type === 'dir' ? '/' : '')); if (entry.type === 'dir') branch(key, prefix + (last ? '   ' : '│  ')); }); }
            branch(path); return { lines };
          }
          case 'cat': arity(args, 1, 1, 'cat <file>'); return { lines: [need(resolve(args[0]), 'file').text] };
          case 'echo': return { lines: [args.join(' ')] };
          case 'clear': return { lines: [], clear: true };
          case 'history': {
            if (args.length === 1 && args[0] === '-c') { history = []; return { lines: [] }; }
            arity(args, 0, 0, 'history [-c]'); return { lines: history.map((line, i) => `${String(i + 1).padStart(3)}  ${line}`) };
          }
          case 'whoami': return { lines: ['leo'] };
          case 'date': return { lines: [new Date().toLocaleDateString()] };
          case 'time': return { lines: [new Date().toLocaleTimeString()] };
          case 'ver': return { lines: ['LEO/OS Command Prompt 2.0'] };
          case 'open': {
            arity(args, 0, 1, 'open <app or project>'); if (!args.length) return { lines: ['APPS: signal-hunt, pixel-paint, music-lab, minesweeper, screen-saver, office-buddy, error-lab, discoveries, settings', 'PROJECTS: cultivation, last-signal, portfolio, projects, about, contact'] };
            const target = args[0].toLowerCase().replace(/\s+/g, '-');
            if (Object.hasOwn(apps, target)) return { lines: [], app: apps[target] };
            if (Object.hasOwn(pages, target)) return { lines: [], page: pages[target] };
            throw new Error('App or project not found — type open for names');
          }
          case 'hello': return { lines: ['Hello, player Glad you found this little corner'], unlock: 'hello' };
          case 'about': return { lines: ['Leo Xu — game developer & programmer', 'Java / Godot / game systems / 3D modeling'] };
          case 'projects': return { lines: ['Immortal Cultivation / Last Signal / SMFS / Mini Advent of Code / Cursor Mod / Eye-Tracking Keyboard', 'Read project files with cd projects, then dir'] };
          case 'credits': return { lines: ['Portfolio by Leo Xu', 'Original project work belongs to its credited creators'] };
          case 'secrets': return { lines: [], secrets: true };
          case 'sudo': if (args.join(' ').toLowerCase() === 'make me a sandwich') return { lines: ['   ___________', '  /___________\\', '  |  LETTUCE  |', '  |___________|', 'One extremely low-resolution sandwich'], unlock: 'sandwich' }; throw new Error('No sudo command needed — try help');
          case 'make': if (args.join(' ').toLowerCase() === 'me a sandwich') return { lines: ['Perhaps ask with elevated politeness'] }; throw new Error('Command not found: make');
          case 'exit': return { lines: [], exit: true };
          default: throw new Error(`Command not found: ${name} — type help`);
        }
      } catch (error) { return { lines: [error.message], error: true }; }
    }
    function complete(source) {
      try {
        const tokens = tokenize(source, true), trailing = /\s$/.test(source);
        const token = trailing ? { value: '', start: source.length, kind: 'word' } : tokens[tokens.length - 1] || { value: '', start: 0, kind: 'word' };
        if (token.kind !== 'word') return { value: source, candidates: [] };
        const first = tokens.length <= 1 && !trailing; let options, prefix = '';
        if (first) options = commands.filter(name => name.startsWith(token.value.toLowerCase()));
        else if (tokens[0]?.value.toLowerCase() === 'open') options = [...new Set([...Object.keys(apps), ...Object.keys(pages)])].filter(name => name.startsWith(token.value.toLowerCase()));
        else {
          const command = tokens[0]?.value.toLowerCase();
          if (!commands.includes(Object.hasOwn(aliases, command) ? aliases[command] : command) || tokens.some(item => item.kind === 'redirect')) return { value: source, candidates: [] };
          const slash = Math.max(token.value.lastIndexOf('/'), token.value.lastIndexOf('\\')); prefix = token.value.slice(0, slash + 1);
          const partial = token.value.slice(slash + 1).toLowerCase(), dir = resolve(prefix || '.'); need(dir, 'dir');
          const onlyDirs = tokens[0]?.value.toLowerCase() === 'cd';
          options = children(dir).filter(([, entry]) => entry.name.toLowerCase().startsWith(partial) && (!onlyDirs || entry.type === 'dir')).map(([, entry]) => prefix + entry.name + (entry.type === 'dir' ? prefix.includes('\\') ? '\\' : '/' : ''));
        }
        if (!options.length) return { value: source, candidates: [] };
        let completed = options[0];
        for (const option of options.slice(1)) { let i = 0; while (i < completed.length && i < option.length && completed[i].toLowerCase() === option[i].toLowerCase()) i++; completed = completed.slice(0, i); }
        if (completed.length < token.value.length) completed = token.value;
        const quoted = /\s/.test(completed) ? '"' + completed + '"' : completed;
        return { value: source.slice(0, token.start) + quoted + (first && options.length === 1 ? ' ' : ''), candidates: options.length > 1 ? options : [] };
      } catch { return { value: source, candidates: [] }; }
    }
    return { run, complete, exportState: () => ({ version: 1, files: [...files].map(([path, entry]) => [path, { ...entry }]), cwd, history: [...history] }), get prompt() { return display() + '>'; }, get history() { return [...history]; } };
  };
});
