import { useRef } from "react";

type Callback = () => void;

interface Options {
  delay?: number;
}

export function useLongPress(
  onLongPress: Callback,
  onClick: Callback,
  { delay = 500 }: Options = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = () => {
    isLongPress.current = false;

    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, delay);
  };

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!isLongPress.current) {
      onClick();
    }
  };

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: () => timerRef.current && clearTimeout(timerRef.current),
    onTouchStart: start,
    onTouchEnd: clear,
  };
}