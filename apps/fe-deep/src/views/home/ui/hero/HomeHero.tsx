import { HeroActions } from '@views/home/ui/hero/HeroActions';
import { HeroBadge } from '@views/home/ui/hero/HeroBadge';
import { HeroSection } from '@views/home/ui/hero/HeroSection';
import { HeroTitle } from '@views/home/ui/hero/HeroTitle';

export function HomeHero() {
  return (
    <HeroSection>
      <HeroBadge>프론트엔드 학습 플랫폼</HeroBadge>
      <HeroTitle />
      <HeroActions />
    </HeroSection>
  );
}
