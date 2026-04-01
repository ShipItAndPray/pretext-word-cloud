export interface WordItem {
  text: string;
  weight: number; // 1-100, determines font size
  color?: string;
}

export interface CloudOptions {
  words: WordItem[];
  width: number;
  height: number;
  fontFamily?: string;
  minFontSize?: number;  // default 12
  maxFontSize?: number;  // default 64
  spiral?: 'archimedean' | 'rectangular';
  padding?: number;       // default 2
}

export interface WordPlacement {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number; // 0 or 90
  color: string;
  width: number;
  height: number;
}

export interface WordCloudResult {
  placements: WordPlacement[];
  render(ctx: CanvasRenderingContext2D): void;
  renderToSVG(): string;
  bounds: { width: number; height: number };
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MeasuredWord {
  text: string;
  fontSize: number;
  rotation: number;
  color: string;
  width: number;
  height: number;
  weight: number;
}
