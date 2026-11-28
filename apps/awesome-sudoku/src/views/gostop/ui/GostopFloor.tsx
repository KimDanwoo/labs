import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { floorByMonth } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { FloorSlot } from '@views/gostop/ui/FloorSlot';
import { GostopDeal } from '@views/gostop/ui/GostopDeal';

export function GostopFloor() {
  const { floor } = useGostopContext();

  return (
    <section aria-label={GOSTOP_COPY.floorLabel} className="relative rounded-[20px] bg-face p-2.5 lg:px-5 lg:py-4">
      <ul className="grid grid-cols-6 gap-x-1.5 gap-y-1 lg:gap-x-4 lg:gap-y-2">
        {floorByMonth(floor).map((ids, index) => (
          <FloorSlot key={index} slot={index} ids={ids} />
        ))}
      </ul>
      <GostopDeal />
    </section>
  );
}
