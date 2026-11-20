import { HomeCategories } from '@views/home/ui/categories/HomeCategories';
import { HomeHero } from '@views/home/ui/hero/HomeHero';

export function HomeView() {
  return (
    <div className="flex flex-col">
      <HomeHero />
      <HomeCategories />
    </div>
  );
}
