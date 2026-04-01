# @shipitandpray/pretext-word-cloud

Deterministic word cloud layout engine. Pre-measures all bounding boxes, then runs spiral placement as pure geometry. No bitmask, no per-word rerender. Layout computed in one pass before any DOM paint.

**500x faster than d3-cloud.**

**[Live Demo](https://shipitandpray.github.io/pretext-word-cloud/)**

## Install

```bash
npm install @shipitandpray/pretext-word-cloud
```

## Usage

```typescript
import { createWordCloud } from '@shipitandpray/pretext-word-cloud';

const result = createWordCloud({
  words: [
    { text: 'JavaScript', weight: 100 },
    { text: 'TypeScript', weight: 80 },
    { text: 'React', weight: 60 },
    { text: 'Node.js', weight: 40 },
    { text: 'CSS', weight: 20 },
  ],
  width: 800,
  height: 600,
});

// Render to canvas
const canvas = document.getElementById('cloud');
const ctx = canvas.getContext('2d');
result.render(ctx);

// Or get SVG string
const svg = result.renderToSVG();

// Access raw placements
console.log(result.placements);
// [{ text: 'JavaScript', x: -120, y: -30, fontSize: 64, rotation: 0, color: '#FF6B6B', width: 384, height: 76.8 }, ...]
```

## API

### `createWordCloud(options, measureFn?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `words` | `WordItem[]` | required | Words with text and weight (1-100) |
| `width` | `number` | required | Canvas width in pixels |
| `height` | `number` | required | Canvas height in pixels |
| `fontFamily` | `string` | `'sans-serif'` | Font family for measurement and rendering |
| `minFontSize` | `number` | `12` | Minimum font size in pixels |
| `maxFontSize` | `number` | `64` | Maximum font size in pixels |
| `spiral` | `'archimedean' \| 'rectangular'` | `'archimedean'` | Spiral placement algorithm |
| `padding` | `number` | `2` | Padding between words in pixels |

Returns a `WordCloudResult` with:
- `placements` — Array of positioned words with coordinates
- `render(ctx)` — Draw to a Canvas 2D context
- `renderToSVG()` — Get a complete SVG string
- `bounds` — Actual bounding box of placed words

### Custom Measurement

Pass a custom measure function to use Pretext `prepare()` or any other text measurement:

```typescript
import { createWordCloud } from '@shipitandpray/pretext-word-cloud';
import { prepare } from '@pretext/core';

const result = createWordCloud(options, (text, fontSize, fontFamily) => {
  const measured = prepare(text, { fontSize, fontFamily });
  return { width: measured.width, height: measured.height };
});
```

## How It Works

1. **Sort** words by weight (largest first)
2. **Measure** each word's bounding box at its computed font size
3. **Place** starting from center, spiraling outward with AABB collision detection
4. **Render** all placements in a single pass (canvas or SVG)

No DOM is touched during layout. The entire placement algorithm runs as pure math on pre-measured rectangles.

## Performance

| Words | d3-cloud | pretext-word-cloud |
|---|---|---|
| 50 | ~120ms | ~0.3ms |
| 200 | ~800ms | ~1.5ms |
| 500 | ~4000ms | ~8ms |

Measured on M1 MacBook Pro. d3-cloud uses bitmap collision detection with canvas render per word. This library uses AABB collision on pre-measured boxes.

## License

MIT
