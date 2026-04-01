import type { CloudOptions, WordCloudResult, WordPlacement } from './types';
import { measureWords, placeWords, MeasureFunction } from './layout';
import { renderToCanvas } from './renderer';
import { renderToSVG } from './renderer';

/**
 * Default measure function using canvas.
 * In browser: uses OffscreenCanvas or regular canvas.
 * In Node/test: expects Pretext prepare() or a custom measureFn.
 */
function createCanvasMeasure(): MeasureFunction {
  // Try OffscreenCanvas (modern browsers + workers)
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d')!;
    return (text: string, fontSize: number, fontFamily: string) => {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      return {
        width: metrics.width,
        height: fontSize * 1.2,
      };
    };
  }

  // Try regular canvas (browser)
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    return (text: string, fontSize: number, fontFamily: string) => {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      return {
        width: metrics.width,
        height: fontSize * 1.2,
      };
    };
  }

  // Fallback: estimate based on character count
  return (text: string, fontSize: number, _fontFamily: string) => {
    return {
      width: text.length * fontSize * 0.6,
      height: fontSize * 1.2,
    };
  };
}

/**
 * Create a word cloud with deterministic layout.
 * All bounding boxes pre-measured, then spiral placement as pure geometry.
 * No bitmask, no per-word rerender. Layout computed in one pass.
 */
export function createWordCloud(
  options: CloudOptions,
  measureFn?: MeasureFunction
): WordCloudResult {
  const measure = measureFn || createCanvasMeasure();
  const measured = measureWords(options, measure);
  const placements = placeWords(measured, options);

  // Compute actual bounds from placements
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of placements) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + p.width);
    maxY = Math.max(maxY, p.y + p.height);
  }

  const actualWidth = placements.length > 0 ? maxX - minX : 0;
  const actualHeight = placements.length > 0 ? maxY - minY : 0;

  return {
    placements,
    bounds: { width: actualWidth, height: actualHeight },
    render(ctx: CanvasRenderingContext2D) {
      renderToCanvas(ctx, placements, options);
    },
    renderToSVG() {
      return renderToSVG(placements, options);
    },
  };
}
