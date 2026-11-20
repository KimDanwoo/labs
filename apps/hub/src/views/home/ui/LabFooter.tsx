import { COPYRIGHT, SITE_NAME } from '@views/home/config/page';

export function LabFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-md px-lg py-lg text-sm text-muted-foreground">
        <span className="font-display font-bold text-foreground">{SITE_NAME}</span>
        <span>{COPYRIGHT}</span>
      </div>
    </footer>
  );
}
