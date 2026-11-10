import { LabFooter } from './LabFooter';
import { ProfileHeader } from './profile-header/ProfileHeader';
import { ProjectGrid } from './project-grid/ProjectGrid';
import { SiteHeader } from './SiteHeader';

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
