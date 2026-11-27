'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

export function useRouteScopedOpen(pathname: string): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  return [isOpen, setIsOpen];
}
