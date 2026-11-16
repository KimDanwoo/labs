export type CspDirective =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'font-src'
  | 'connect-src'
  | 'media-src'
  | 'worker-src'
  | 'frame-src'
  | 'manifest-src';

export type CspSources = Partial<Record<CspDirective, readonly string[]>>;

export type FrameAncestors = 'none' | 'self';

export type HeaderMode = 'production' | 'development';

export interface SecurityHeaderOptions {
  sources?: CspSources;
  frameAncestors?: FrameAncestors;
  mode?: HeaderMode;
}

export interface SecurityHeader {
  key: string;
  value: string;
}

export declare const HSTS: string;
export declare const PERMISSIONS_POLICY: string;

export declare function buildCsp(options?: SecurityHeaderOptions): string;

export declare function createSecurityHeaders(options?: SecurityHeaderOptions): SecurityHeader[];
