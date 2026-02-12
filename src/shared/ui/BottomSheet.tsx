"use client";

import { cn } from "@shared/model/utils";
import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

type Phase = "idle" | "mounted" | "opening" | "open" | "closing";

const CLOSE_THRESHOLD = 0.35;
const VELOCITY_THRESHOLD = 500;
const ANIMATION_MS = 500;
const SPRING = "cubic-bezier(0.32, 0.72, 0, 1)";

export const BottomSheet = memo<BottomSheetProps>(({ isOpen, onClose, children, title, className }) => {
  const [mounted, setMounted] = useState(false);
  const phaseRef = useRef<Phase>("idle");
  const [, rerender] = useState(0);
  const titleId = useId();

  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dragState = useRef({
    isDragging: false,
    startY: 0,
    currentY: 0,
    startTime: 0,
    sheetHeight: 0,
  });

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    rerender((c) => c + 1);
  }, []);

  // ── Close (slide-down then unmount) ──
  const close = useCallback(() => {
    if (phaseRef.current === "closing" || phaseRef.current === "idle") return;
    const el = sheetRef.current;
    if (el) {
      el.style.transition = `transform ${ANIMATION_MS}ms ${SPRING}`;
      el.style.transform = "translateY(100%)";
    }
    setPhase("closing");
  }, [setPhase]);

  // ── Mount / Open ──
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setMounted(true);
      setPhase("mounted");
    } else if (mounted && phaseRef.current !== "closing" && phaseRef.current !== "idle") {
      close();
    }
  }, [isOpen]);

  // mounted → opening (강제 reflow로 초기 위치 확정 후 애니메이션)
  useLayoutEffect(() => {
    if (phaseRef.current !== "mounted") return;
    const el = sheetRef.current;
    if (el) {
      // 브라우저에게 translateY(100%) 위치를 확정시킨다
      el.getBoundingClientRect();
    }
    setPhase("opening");
  }, [phaseRef.current]);

  // opening → open
  useEffect(() => {
    if (phaseRef.current !== "opening") return;
    const id = setTimeout(() => setPhase("open"), ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phaseRef.current]);

  // closing → unmount + restore focus
  useEffect(() => {
    if (phaseRef.current !== "closing") return;
    const id = setTimeout(() => {
      setPhase("idle");
      setMounted(false);
      onCloseRef.current();
      previousFocusRef.current?.focus();
    }, ANIMATION_MS);
    return () => clearTimeout(id);
  }, [phaseRef.current]);

  // Body scroll lock
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  // Escape key + Focus trap
  useEffect(() => {
    if (!mounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab") {
        const el = sheetRef.current;
        if (!el) return;
        const focusable = el.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [mounted, close]);

  // ── Drag Handlers ──
  const onDragStart = useCallback((clientY: number) => {
    const p = phaseRef.current;
    if (p !== "open" && p !== "opening") return;
    const el = sheetRef.current;
    if (!el) return;

    el.style.transition = "none";
    dragState.current = {
      isDragging: true,
      startY: clientY,
      currentY: clientY,
      startTime: Date.now(),
      sheetHeight: el.offsetHeight,
    };
  }, []);

  const onDragMove = useCallback((clientY: number) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;

    ds.currentY = clientY;
    const deltaY = Math.max(0, clientY - ds.startY);
    const el = sheetRef.current;
    if (el) {
      el.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const onDragEnd = useCallback(() => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.isDragging = false;

    const deltaY = Math.max(0, ds.currentY - ds.startY);
    const elapsed = Date.now() - ds.startTime;
    const velocity = (deltaY / elapsed) * 1000;
    const ratio = deltaY / ds.sheetHeight;

    const el = sheetRef.current;
    if (!el) return;

    const shouldClose = ratio > CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (shouldClose) {
      el.style.transition = `transform ${ANIMATION_MS}ms ${SPRING}`;
      el.style.transform = "translateY(100%)";
      setPhase("closing");
    } else {
      el.style.transition = `transform ${ANIMATION_MS}ms ${SPRING}`;
      el.style.transform = "translateY(0)";
    }
  }, [setPhase]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onDragStart(e.clientY);
    },
    [onDragStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      onDragMove(e.clientY);
    },
    [onDragMove],
  );

  const handlePointerUp = useCallback(() => onDragEnd(), [onDragEnd]);

  if (!mounted) return null;

  const phase = phaseRef.current;
  const isVisible = phase !== "idle";
  const isShown = phase === "opening" || phase === "open";

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      style={{
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: isShown ? 1 : 0,
          transition: `opacity ${ANIMATION_MS}ms ${SPRING}`,
        }}
        onClick={close}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "absolute bottom-0 left-0 right-0",
          "bg-[rgb(var(--color-surface-primary))]",
          "rounded-t-2xl shadow-xl",
          "max-h-[85vh]",
          className,
        )}
        style={{
          transform: isShown ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${ANIMATION_MS}ms ${SPRING}`,
          willChange: "transform",
        }}
      >
        {/* Drag handle */}
        <div
          className={cn(
            "flex justify-center pt-3 pb-2",
            "cursor-grab active:cursor-grabbing",
            "touch-none select-none",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className={cn("w-10 h-1.5 rounded-full", "bg-[rgb(var(--color-border-medium))]")} />
        </div>
        {/* Title */}
        {title && (
          <div id={titleId} className={cn("px-6 py-3 text-lg font-bold", "text-[rgb(var(--color-text-primary))]")}>
            {title}
          </div>
        )}
        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 80px)" }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
});

BottomSheet.displayName = "BottomSheet";
