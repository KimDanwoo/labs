import { MAIN_ID } from '../config/page';
import { styles } from './HomeView.styles';
import { LabFooter } from './LabFooter';
import { ProfileHeader } from './profile-header/ProfileHeader';
import { ProjectGrid } from './project-grid/ProjectGrid';
import { SiteHeader } from './SiteHeader';

export function HomeView() {
  return (
    <>
      <a href={`#${MAIN_ID}`} className={styles.skipLink}>
        본문으로 건너뛰기
      </a>
      <SiteHeader />
      <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
        <ProfileHeader />
        <ProjectGrid />
      </main>
      <LabFooter />
    </>
  );
}
