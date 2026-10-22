'use client';

import { Component, type ReactNode } from 'react';

export function SceneFailure() {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-60 flex flex-col items-center justify-center gap-lg bg-prairie-ink px-xl text-center text-prairie-paper"
    >
      <p className="font-display text-3xl">초원을 불러오지 못했어요</p>
      <p className="max-w-sm text-sm text-prairie-paper/70">
        연결 상태를 확인한 뒤 다시 시도해 주세요. 계속되면 3D 그래픽을 지원하는 다른 브라우저로 열어 주세요.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full border border-prairie-paper/40 px-xl py-md text-sm focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        다시 불러오기
      </button>
    </div>
  );
}

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <SceneFailure /> : this.props.children;
  }
}
