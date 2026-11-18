import { SIZE, blocked } from './world.mjs';

const spacing = 20;
const columns = SIZE / spacing;
const indexAt = (x, y) => y * columns + x;
const pointAt = index => ({
  x: (index % columns) * spacing,
  y: Math.floor(index / columns) * spacing,
});
const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Build a reverse route once per destination so moving the player is cheap.
export function routesTo(destination) {
  const next = new Int32Array(columns * columns).fill(-1);
  const goal = indexAt(Math.round(destination.x / spacing), Math.round(destination.y / spacing));
  const queue = [goal];
  next[goal] = goal;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const point = pointAt(current);
    for (const [dx, dy] of neighbors) {
      const x = point.x + dx * spacing;
      const y = point.y + dy * spacing;
      if (blocked(x, y) || blocked((x + point.x) / 2, (y + point.y) / 2)) continue;
      const candidate = indexAt(x / spacing, y / spacing);
      if (next[candidate] !== -1) continue;
      next[candidate] = current;
      queue.push(candidate);
    }
  }
  return player => {
    const x = Math.round(player.x / spacing);
    const y = Math.round(player.y / spacing);
    let current = -1;
    let nearest = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const column = x + dx;
        const row = y + dy;
        if (column < 0 || column >= columns || row < 0 || row >= columns) continue;
        const candidate = indexAt(column, row);
        if (next[candidate] < 0) continue;
        const point = pointAt(candidate);
        const distance = Math.hypot(point.x - player.x, point.y - player.y);
        if (distance >= nearest) continue;
        const crossesObstacle = [0.25, 0.5, 0.75].some(fraction => blocked(
          player.x + (point.x - player.x) * fraction,
          player.y + (point.y - player.y) * fraction,
        ));
        if (crossesObstacle) continue;
        current = candidate;
        nearest = distance;
      }
    }
    if (current < 0) return [];
    const path = [];
    while (current !== goal) {
      path.push(pointAt(current));
      current = next[current];
    }
    path.push(pointAt(goal));
    return path;
  };
}
