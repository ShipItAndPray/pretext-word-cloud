import type { BBox, MeasuredWord, WordPlacement, CloudOptions } from './types';
import { collidesWithAny, isWithinBounds } from './collision';

/**
 * Spiral placement algorithm.
 * Places words starting from center, spiraling outward.
 * All placement is pure geometry — computed before any render.
 */

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
];

function archimedeanSpiral(size: [number, number]) {
  const e = size[0] / size[1];
  return function (t: number): [number, number] {
    return [e * (t *= 0.1) * Math.cos(t), t * Math.sin(t)];
  };
}

function rectangularSpiral(size: [number, number]) {
  const dy = 4;
  const dx = (dy * size[0]) / size[1];
  let x = 0;
  let y = 0;
  return function (t: number): [number, number] {
    const sign = t < 0 ? -1 : 1;
    // Move in a rectangular spiral pattern
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:
        x += dx;
        break;
      case 1:
        y += dy;
        break;
      case 2:
        x -= dx;
        break;
      default:
        y -= dy;
        break;
    }
    return [x, y];
  };
}

export interface MeasureFunction {
  (text: string, fontSize: number, fontFamily: string): { width: number; height: number };
}

/**
 * Measure words using Pretext prepare() or a custom measure function.
 * Returns sorted (largest first) measured words ready for placement.
 */
export function measureWords(
  options: CloudOptions,
  measureFn: MeasureFunction
): MeasuredWord[] {
  const {
    words,
    fontFamily = 'sans-serif',
    minFontSize = 12,
    maxFontSize = 64,
  } = options;

  if (words.length === 0) return [];

  const maxWeight = Math.max(...words.map((w) => w.weight));
  const minWeight = Math.min(...words.map((w) => w.weight));
  const weightRange = maxWeight - minWeight || 1;

  const measured: MeasuredWord[] = words.map((word, i) => {
    const normalizedWeight = (word.weight - minWeight) / weightRange;
    const fontSize = Math.round(
      minFontSize + normalizedWeight * (maxFontSize - minFontSize)
    );

    // ~20% of words get rotated 90 degrees (deterministic based on index)
    const rotation = i % 5 === 0 ? 90 : 0;
    const color = word.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

    const metrics = measureFn(word.text, fontSize, fontFamily);

    // If rotated, swap width/height for bounding box
    const width = rotation === 90 ? metrics.height : metrics.width;
    const height = rotation === 90 ? metrics.width : metrics.height;

    return {
      text: word.text,
      fontSize,
      rotation,
      color,
      width,
      height,
      weight: word.weight,
    };
  });

  // Sort by weight descending (largest words placed first)
  measured.sort((a, b) => b.weight - a.weight);

  return measured;
}

/**
 * Place all measured words using spiral placement.
 * Returns placements array — all positions computed in a single pass.
 */
export function placeWords(
  measured: MeasuredWord[],
  options: CloudOptions
): WordPlacement[] {
  const { width, height, spiral = 'archimedean', padding = 2 } = options;
  const bounds = { width, height };
  const placed: BBox[] = [];
  const placements: WordPlacement[] = [];

  const spiralFn =
    spiral === 'rectangular'
      ? rectangularSpiral([width, height])
      : archimedeanSpiral([width, height]);

  for (const word of measured) {
    const paddedWidth = word.width + padding * 2;
    const paddedHeight = word.height + padding * 2;
    let didPlace = false;

    // Spiral outward from center, checking for collisions
    for (let t = 0; t < 10000; t++) {
      const [dx, dy] = spiralFn(t);

      const box: BBox = {
        x: dx - paddedWidth / 2,
        y: dy - paddedHeight / 2,
        width: paddedWidth,
        height: paddedHeight,
      };

      if (!isWithinBounds(box, bounds)) {
        // If we've gone far past bounds, give up on this word
        if (Math.abs(dx) > width && Math.abs(dy) > height) break;
        continue;
      }

      if (!collidesWithAny(box, placed)) {
        placed.push(box);
        placements.push({
          text: word.text,
          x: box.x + padding,
          y: box.y + padding,
          fontSize: word.fontSize,
          rotation: word.rotation,
          color: word.color,
          width: word.width,
          height: word.height,
        });
        didPlace = true;
        break;
      }
    }

    // Words that don't fit are silently dropped
    if (!didPlace) continue;
  }

  return placements;
}
