'use client';

import { MusicDock } from '@views/walk/ui/music/MusicDock';
import { Walk } from '@views/walk/ui/walk';

export function WalkView() {
  return (
    <Walk.Root>
      <Walk.Landscape />
      <Walk.Header />
      <Walk.Caption />
      <Walk.ToolBar />

      <Walk.Prompts />
      <Walk.Companion />
      <Walk.Fishing />
      <Walk.Schoolmate />
      <Walk.BallGame />

      <Walk.BottomBar />
      <Walk.Controls />
      <Walk.Toast />
      <Walk.Loading />

      <Walk.Atlas />
      <Walk.Sleep />
      <Walk.Memory />
      <Walk.Chalkboard />
      <Walk.Wardrobe />
      <MusicDock />
    </Walk.Root>
  );
}
