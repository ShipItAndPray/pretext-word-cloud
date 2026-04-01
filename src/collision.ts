import type { BBox } from './types';

/**
 * AABB (Axis-Aligned Bounding Box) collision detection.
 * Pure geometry — no DOM, no bitmask, no render cycles.
 */

export function intersects(a: BBox, b: BBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function isWithinBounds(box: BBox, bounds: { width: number; height: number }): boolean {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  return (
    box.x >= -halfW &&
    box.y >= -halfH &&
    box.x + box.width <= halfW &&
    box.y + box.height <= halfH
  );
}

export function collidesWithAny(box: BBox, placed: BBox[]): boolean {
  for (let i = 0; i < placed.length; i++) {
    if (intersects(box, placed[i])) return true;
  }
  return false;
}
