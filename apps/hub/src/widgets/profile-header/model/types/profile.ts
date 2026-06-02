export type ProfileLink = { label: string; href: string };

export type ProfileSegment = string | ProfileLink;

export type ProfileParagraph = readonly ProfileSegment[];

export function isProfileLink(segment: ProfileSegment): segment is ProfileLink {
  return typeof segment === 'object';
}
