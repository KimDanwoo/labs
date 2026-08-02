type SkeletonProps = {
  className?: string;
};

/** 로딩 자리표시자. 부모가 크기·모양을 className 으로 지정한다. */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-black/5 ${className}`} aria-hidden />;
}
