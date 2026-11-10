'use client';
import { Component, type ReactNode } from 'react';

import { SceneFailure } from './SceneFailure';

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <SceneFailure /> : this.props.children;
  }
}
