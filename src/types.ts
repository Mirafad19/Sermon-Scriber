export interface SocialSlide {
  slideNumber: number;
  title: string;
  subTitle?: string;
  bullets: string[];
  scripture?: string;
  quote: string;
  theme: string; // 'midnight' | 'warm-sunset' | 'royal-gold' | 'olive-branch' | 'ambient-teal'
}

export interface Sermon {
  id: string;
  date: string;
  topic: string;
  keyScripture: string;
  transcript: string;
  summary: string;
  keyTakeaways: string[];
  socialSlides: SocialSlide[];
  audioDuration?: string;
}
