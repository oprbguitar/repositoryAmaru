import { useCallback, useEffect, useRef, useState } from "react";

const ITEM_SELECTOR =
  '[role="menuitem"]:not([disabled]),[role="menuitemradio"]:not([disabled]),[role="menuitemcheckbox"]:not([disabled])';

/**
 * Disclosure menu with the keyboard model of the WAI-ARIA menu button:
 * opening focuses the checked (or first) item, arrows/Home/End move, Escape
 * and Tab close, Escape returns focus to the trigger, outside pointer closes.
 */
export function useMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const items = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [],
      );
    const initial =
      menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      items()[0];
    initial?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key === "Tab") {
        setOpen(false);
        return;
      }
      const list = items();
      if (list.length === 0) return;
      const index = list.indexOf(document.activeElement as HTMLElement);
      let next: number | null = null;
      if (event.key === "ArrowDown") next = (index + 1) % list.length;
      else if (event.key === "ArrowUp")
        next = (index - 1 + list.length) % list.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = list.length - 1;
      if (next !== null) {
        event.preventDefault();
        list[next]?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    const menu = menuRef.current;
    menu?.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      menu?.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const onTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  }, []);

  return {
    open,
    setOpen,
    close,
    rootRef,
    triggerRef,
    menuRef,
    onTriggerKeyDown,
  };
}
