import { PHASE } from '@views/gostop/config/game';
import { MOOD, MOODS, REACTION, RIVAL_NAME } from '@views/gostop/config/rival';
import { bubbleCueOf, isEcho, isNewCue, rivalAlt, rivalImageSrc } from '@views/gostop/lib/rivalView';
import { INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameState } from '@views/gostop/model/types/gostop';
import type { RivalReaction } from '@views/gostop/model/types/rival';
import { describe, expect, it } from 'vitest';

const playing = (): GameState => ({ ...INITIAL_STATE, phase: PHASE.PLAY });
const happy: RivalReaction = { reaction: REACTION.RIVAL_EVENT, mood: MOOD.HAPPY, line: '이 맛에 치지!' };
const quiet: RivalReaction = { reaction: REACTION.QUIET, mood: MOOD.IDLE, line: null };

describe('호 사장 그림', () => {
  it('표정마다 다른 그림 주소를 쓴다', () => {
    const sources = MOODS.map(rivalImageSrc);
    expect(new Set(sources).size).toBe(MOODS.length);
    expect(rivalImageSrc(MOOD.ANGRY)).toBe('/rival/angry.webp');
  });

  it('대체 텍스트는 이름과 표정을 말한다', () => {
    expect(rivalAlt(MOOD.HAPPY)).toBe(`${RIVAL_NAME}, 웃는 표정`);
    expect(new Set(MOODS.map(rivalAlt)).size).toBe(MOODS.length);
  });
});

describe('말풍선 신호', () => {
  it('대사가 없는 반응은 말풍선을 만들지 않는다', () => {
    expect(bubbleCueOf(playing(), quiet)).toBeNull();
  });

  it('대사가 있으면 판·반응·표정·대사를 담는다', () => {
    const game = playing();
    expect(bubbleCueOf(game, happy)).toEqual({
      game,
      reaction: REACTION.RIVAL_EVENT,
      mood: MOOD.HAPPY,
      line: '이 맛에 치지!',
    });
  });

  it('처음 오는 대사는 새 말풍선이다', () => {
    expect(isNewCue(bubbleCueOf(playing(), happy), null)).toBe(true);
  });

  it('같은 판 상태의 같은 반응은 조용한 단계를 사이에 두고 다시 와도 새로 띄우지 않는다', () => {
    const game = playing();
    const shown = bubbleCueOf(game, happy);
    expect(isNewCue(bubbleCueOf(game, quiet), shown)).toBe(false);
    expect(isNewCue(bubbleCueOf(game, happy), shown)).toBe(false);
  });

  it('같은 판 상태라도 반응이 바뀌면 바로 새 말풍선이다', () => {
    const game = playing();
    const deciding: RivalReaction = { reaction: REACTION.MY_DECIDING, mood: MOOD.SHOCKED, line: '스톱하지? 응?' };
    expect(isNewCue(bubbleCueOf(game, deciding), bubbleCueOf(game, happy))).toBe(true);
  });

  it('다음 차례로 판 상태가 바뀌면 같은 반응도 새 말풍선이다', () => {
    expect(isNewCue(bubbleCueOf(playing(), happy), bubbleCueOf(playing(), happy))).toBe(true);
  });
});

describe('같은 대사 되풀이', () => {
  const cue = { game: playing(), reaction: REACTION.RIVAL_EVENT, mood: MOOD.HAPPY, line: '이 맛에 치지!' };

  it('같은 대사가 떠 있는 동안 다시 오면 메아리로 보고 다시 띄우지 않는다', () => {
    expect(isEcho(cue, { id: 1, mood: MOOD.HAPPY, line: '이 맛에 치지!' })).toBe(true);
  });

  it('말풍선이 없거나 다른 대사가 떠 있으면 새로 띄운다', () => {
    expect(isEcho(cue, null)).toBe(false);
    expect(isEcho(cue, { id: 1, mood: MOOD.SHOCKED, line: '스톱하지? 응?' })).toBe(false);
  });
});
