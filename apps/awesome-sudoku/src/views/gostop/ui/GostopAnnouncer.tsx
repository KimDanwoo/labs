import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function GostopAnnouncer() {
  const { announcement } = useGostopContext();

  return (
    <p role="status" className="sr-only">
      {announcement}
    </p>
  );
}
