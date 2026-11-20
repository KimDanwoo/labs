import { MAIN_ID } from '@views/home/config/page';
import { LabFooter } from '@views/home/ui/LabFooter';
import { ProfileHeader } from '@views/home/ui/profile-header/ProfileHeader';
import { ProjectGrid } from '@views/home/ui/project-grid/ProjectGrid';
import { SiteHeader } from '@views/home/ui/SiteHeader';

export function HomeView() {
  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-sm focus:left-sm focus:z-60 focus:rounded-md focus:bg-primary focus:px-md focus:py-sm focus:text-primary-foreground"
      >
        본문으로 건너뛰기
      </a>
      <SiteHeader />
      <main
        id={MAIN_ID}
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2xl px-lg pt-lg pb-3xl focus:outline-hidden sm:gap-3xl sm:pt-2xl"
      >
        <ProfileHeader />
        <ProjectGrid />
      </main>
      <LabFooter />
    </>
  );
}
