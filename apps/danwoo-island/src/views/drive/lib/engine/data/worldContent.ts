export interface ProjectContent {
  title: string;
  titleSmall: string[];
  url: string;
  attributes: { role: string };
  distinctions: string[];
  images: string[];
}

export interface LabContent {
  title: string;
  url: string;
  image: string;
  imageMini: string;
}

export interface SocialLink {
  name: string;
  url: string;
  align: 'left' | 'right';
}

export interface WorldContent {
  labUrl: string;
  resumeUrl: string;
  projects: ProjectContent[];
  lab: LabContent[];
  social: SocialLink[];
}
