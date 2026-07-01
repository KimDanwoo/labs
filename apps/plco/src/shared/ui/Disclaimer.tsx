import { DISCLAIMER_SHORT } from '@shared/constants';

type DisclaimerProps = {
  className?: string;
};

export default function Disclaimer({ className = '' }: DisclaimerProps) {
  return (
    <p
      className={`text-center text-[10px] leading-relaxed text-gray-400 ${className}`}
    >
      {DISCLAIMER_SHORT}
    </p>
  );
}
