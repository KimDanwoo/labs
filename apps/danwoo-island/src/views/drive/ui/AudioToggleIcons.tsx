import { worldAsset } from '../config/worldAsset';

export function AudioToggleIcons() {
  return (
    <>
      <img className="icon icon-audio audio-on" src={worldAsset('ui/audio/audioOn.svg')} alt="" loading="lazy" />{' '}
      <img className="icon icon-audio audio-off" src={worldAsset('ui/audio/audioOff.svg')} alt="" loading="lazy" />
    </>
  );
}
