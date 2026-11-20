import { AudioToggleIcons } from '@views/drive/ui/AudioToggleIcons';
import { OptionRow } from '@views/drive/ui/OptionRow';
import { OptionsTable } from '@views/drive/ui/OptionsTable';
import { PaintSelect } from '@views/drive/ui/PaintSelect';
import { TooltipButton } from '@views/drive/ui/TooltipButton';

export function OptionsContent() {
  return (
    <div className="content-inner">
      <div className="title">설정</div>
      <OptionsTable>
        <OptionRow label="소리">
          <TooltipButton
            className="js-audio-toggle audio-toggle button is-small has-tooltip"
            tooltip="소리를 켜고 꺼요"
          >
            <AudioToggleIcons />
          </TooltipButton>
        </OptionRow>
        <OptionRow label="그래픽">
          <TooltipButton
            className="js-quality-toggle quality-toggle button is-small has-tooltip"
            tooltip="일부 효과를 켜고 꺼요"
          >
            <span>낮음</span>
          </TooltipButton>
        </OptionRow>
        <OptionRow label="차가 끼었어요">
          <TooltipButton className="js-respawn button is-small has-tooltip" tooltip="가까운 출발 지점으로 옮겨요">
            복귀
          </TooltipButton>
        </OptionRow>
        <OptionRow label="초기화">
          <TooltipButton className="js-reset button is-small has-tooltip" tooltip="모든 물건을 제자리로 돌려요">
            초기화
          </TooltipButton>
        </OptionRow>
        <OptionRow label="렌더러">
          <TooltipButton
            className="js-renderer button is-small is-disabled is-success has-tooltip"
            tooltip="성능이 가장 좋아요"
            tooltipClassName="js-tooltip tooltip"
          >
            <span>WebGPU</span>
          </TooltipButton>
        </OptionRow>
        <OptionRow label={<label htmlFor="vehicle-paint">차량 도색</label>}>
          <PaintSelect />
        </OptionRow>
      </OptionsTable>
    </div>
  );
}
