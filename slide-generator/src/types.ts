export interface Slide {
  title: string;
  summary: string;
  bulletPoints: string[];
  speakerNotes: string;
}

export interface GenerateSlideRequest {
  content: string;
  apiKey: string;
}
