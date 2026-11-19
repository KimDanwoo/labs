import { HomeCategories } from './categories/HomeCategories';
import { HomeHero } from './hero/HomeHero';

export function HomeView() {
  return (
    <div className="flex flex-col">
      <HomeHero />
      <HomeCategories />
    </div>
  );
}
