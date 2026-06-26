import { LabFooter } from '@widgets/lab-footer/ui';
import { ProfileHeader } from '@widgets/profile-header/ui';
import { ProjectGrid } from '@widgets/project-grid/ui';

export function HomeView() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3xl px-lg py-3xl">
      <ProfileHeader />
      <ProjectGrid />
      <LabFooter />
    </main>
  );
}
