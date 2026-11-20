import { isBoardShortcut } from '@entities/sudoku/lib/keyboardTarget';
import { afterEach, describe, expect, it } from 'vitest';

function keydownFrom(target: HTMLElement, init: KeyboardEventInit = {}): KeyboardEvent {
  let captured: KeyboardEvent | null = null;
  target.addEventListener('keydown', (event) => {
    captured = event;
  });
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, ...init }));
  if (!captured) throw new Error('keydown was not dispatched');
  return captured;
}

describe('isBoardShortcut', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('보드 칸이나 본문에서 누른 키는 게임 입력으로 본다', () => {
    const cell = document.body.appendChild(document.createElement('td'));
    expect(isBoardShortcut(keydownFrom(cell))).toBe(true);
    expect(isBoardShortcut(keydownFrom(document.body))).toBe(true);
  });

  it('선택 상자·입력창·대화상자 안에서 누른 키는 그 요소에 맡긴다', () => {
    const select = document.body.appendChild(document.createElement('select'));
    const input = document.body.appendChild(document.createElement('input'));
    const dialog = document.body.appendChild(document.createElement('div'));
    dialog.setAttribute('role', 'dialog');
    const button = dialog.appendChild(document.createElement('button'));

    expect(isBoardShortcut(keydownFrom(select))).toBe(false);
    expect(isBoardShortcut(keydownFrom(input))).toBe(false);
    expect(isBoardShortcut(keydownFrom(button))).toBe(false);
  });

  it('⌘·Ctrl·Alt 조합은 브라우저 단축키로 남긴다', () => {
    const cell = document.body.appendChild(document.createElement('td'));
    expect(isBoardShortcut(keydownFrom(cell, { metaKey: true }))).toBe(false);
    expect(isBoardShortcut(keydownFrom(cell, { ctrlKey: true }))).toBe(false);
    expect(isBoardShortcut(keydownFrom(cell, { altKey: true }))).toBe(false);
  });
});
