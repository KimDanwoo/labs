import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';

export function WalkToast() {
  const { toast } = useWalkContext();
  return (
    <div className={toast.message ? 'toast visible' : 'toast'} role="status" aria-label="산책 알림">
      {toast.message}
    </div>
  );
}
