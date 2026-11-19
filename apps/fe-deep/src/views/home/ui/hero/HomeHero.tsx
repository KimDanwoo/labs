import { HeroActions } from './HeroActions';
import { HeroBadge } from './HeroBadge';
import { HeroSection } from './HeroSection';
import { HeroTitle } from './HeroTitle';

export function HomeHero() {
  return (
    <HeroSection>
      <HeroBadge>프론트엔드 학습 플랫폼</HeroBadge>
      <HeroTitle />
      <HeroActions />
    </HeroSection>
  );
}
