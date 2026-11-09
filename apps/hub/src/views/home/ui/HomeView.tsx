import { LabFooter } from '@widgets/lab-footer';
import { ProfileHeader } from '@widgets/profile-header';
import { ProjectGrid } from '@widgets/project-grid';
import { SiteHeader } from '@widgets/site-header';

export function HomeView() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3xl px-lg py-3xl">
        <ProfileHeader />
        <ProjectGrid />
        <LabFooter />
      </main>
    </>
  );
}
