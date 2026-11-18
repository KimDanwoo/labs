interface ShareNoticeProps {
  notice: string;
  fallbackUrl: string;
  onClose: () => void;
}

export function ShareNotice({ notice, fallbackUrl, onClose }: ShareNoticeProps) {
  return (
    <div className="absolute top-full right-0 mt-sm w-64 rounded-md border border-hairline bg-void p-md text-sm text-paper">
      <p role="status">{notice}</p>
      {fallbackUrl ? (
        <>
          <input
            aria-label="직접 복사할 공유 링크"
            readOnly
            value={fallbackUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-sm w-full rounded-sm border border-hairline bg-void p-xs text-xs"
          />
          <button type="button" onClick={onClose} className="mt-sm text-brass">
            닫기
          </button>
        </>
      ) : null}
    </div>
  );
}
