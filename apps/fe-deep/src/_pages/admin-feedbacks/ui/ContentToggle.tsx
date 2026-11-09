'use client';
import { useEffect, useRef, useState } from 'react';

export function ContentToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div>
      <p ref={ref} className={`text-sm whitespace-pre-wrap ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      {clamped && (
        <button className="text-xs text-primary hover:underline mt-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  );
}
