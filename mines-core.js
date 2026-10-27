(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LeoMines = factory();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  return function createGame({ columns = 8, rows = columns, mineCount = 10, random = Math.random } = {}) {
    if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1 || !Number.isInteger(mineCount) || mineCount < 0 || mineCount > columns * rows - Math.min(columns, 3) * Math.min(rows, 3)) {
      throw new Error('Invalid board dimensions or mine count for a safe opening');
    }
    const cells = Array.from({ length: columns * rows }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
    let placed = false, status = 'ready', opened = 0;
    function neighbors(index) {
      const result = [], row = Math.floor(index / columns), col = index % columns;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const y = row + dy, x = col + dx;
        if (y >= 0 && y < rows && x >= 0 && x < columns) result.push(y * columns + x);
      }
      return result;
    }
    function place(first) {
      const safe = new Set([first, ...neighbors(first)]);
      const candidates = cells.map((_, i) => i).filter(i => !safe.has(i));
      if (mineCount > candidates.length) throw new Error('Too many mines for a safe opening');
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      candidates.slice(0, mineCount).forEach(i => { cells[i].mine = true; });
      cells.forEach((cell, i) => { cell.adjacent = neighbors(i).filter(n => cells[n].mine).length; });
      placed = true;
    }
    function reveal(index) {
      const cell = cells[index];
      if (!cell || cell.revealed || cell.flagged || status === 'won' || status === 'lost') return status;
      if (!placed) place(index);
      status = 'playing';
      if (cell.mine) { cell.revealed = true; status = 'lost'; return status; }
      const queue = [index];
      while (queue.length) {
        const next = queue.pop(), target = cells[next];
        if (target.revealed || target.flagged || target.mine) continue;
        target.revealed = true; opened++;
        if (!target.adjacent) queue.push(...neighbors(next));
      }
      if (opened === cells.length - mineCount) status = 'won';
      return status;
    }
    function flag(index) {
      const cell = cells[index];
      if (!cell || cell.revealed || status === 'won' || status === 'lost') return;
      if (!cell.flagged && cells.filter(c => c.flagged).length >= mineCount) return;
      cell.flagged = !cell.flagged;
    }
    function chord(index) {
      const cell = cells[index];
      if (status !== 'playing' || !cell?.revealed || !cell.adjacent) return status;
      const around = neighbors(index);
      if (around.filter(i => cells[i].flagged).length !== cell.adjacent) return status;
      for (const next of around) {
        if (!cells[next].revealed && !cells[next].flagged) reveal(next);
        if (status === 'lost' || status === 'won') break;
      }
      return status;
    }
    return { cells, reveal, flag, chord, neighbors, columns, rows, mineCount, get status() { return status; }, get flags() { return cells.filter(c => c.flagged).length; } };
  };
});
