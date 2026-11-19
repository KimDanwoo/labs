interface ProfileLink {
  label: string;
  href: string;
}

type ProfileSegment = string | ProfileLink;

export type ProfileParagraph = readonly ProfileSegment[];

export function isProfileLink(segment: ProfileSegment): segment is ProfileLink {
  return typeof segment === 'object';
}
