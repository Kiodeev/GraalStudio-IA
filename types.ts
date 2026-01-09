
export type TabType = 'editor' | 'generator' | 'critique' | 'gallery';

export interface PixelData {
  width: number;
  height: number;
  pixels: string[]; // hex colors
}

export interface ArtCritique {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface GeneratedRef {
  imageUrl: string;
  prompt: string;
}
