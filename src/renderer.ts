import type { WordPlacement, CloudOptions } from './types';

/**
 * Render word placements to a Canvas 2D context.
 * All layout is already computed — this just draws.
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  placements: WordPlacement[],
  options: CloudOptions
): void {
  const { width, height, fontFamily = 'sans-serif' } = options;

  ctx.save();
  // Translate origin to center (placements are center-relative)
  ctx.translate(width / 2, height / 2);

  for (const p of placements) {
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    if (p.rotation !== 0) {
      ctx.rotate((p.rotation * Math.PI) / 180);
    }
    ctx.font = `${p.fontSize}px ${fontFamily}`;
    ctx.fillStyle = p.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Render word placements to an SVG string.
 * Returns a complete SVG document.
 */
export function renderToSVG(
  placements: WordPlacement[],
  options: CloudOptions
): string {
  const { width, height, fontFamily = 'sans-serif' } = options;

  const texts = placements.map((p) => {
    const cx = p.x + p.width / 2 + width / 2;
    const cy = p.y + p.height / 2 + height / 2;
    const transform = p.rotation !== 0
      ? ` transform="rotate(${p.rotation},${cx},${cy})"`
      : '';
    const escapedText = escapeXml(p.text);
    return `  <text x="${cx}" y="${cy}" font-size="${p.fontSize}" font-family="${fontFamily}" fill="${p.color}" text-anchor="middle" dominant-baseline="central"${transform}>${escapedText}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${texts.join('\n')}
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
