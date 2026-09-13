import { LoaderCircle, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  onRefresh: () => Promise<unknown> | void;
  disabled?: boolean;
  threshold?: number;
};

const MAX_PULL = 96;

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 68,
}: Props) {
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const refreshingRef = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const reset = useCallback(() => {
    startY.current = null;
    active.current = false;
    setDistance(0);
  }, []);

  const runRefresh = useCallback(async () => {
    if (refreshingRef.current || disabled) return;

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      await onRefresh();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      reset();
    }
  }, [disabled, onRefresh, reset]);

  useEffect(() => {
    if (disabled) {
      reset();
    }
  }, [disabled, reset]);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (
        disabled ||
        refreshingRef.current ||
        window.scrollY > 0 ||
        event.touches.length !== 1
      ) {
        return;
      }

      startY.current = event.touches[0].clientY;
      active.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (
        disabled ||
        refreshingRef.current ||
        !active.current ||
        startY.current === null ||
        event.touches.length !== 1
      ) {
        return;
      }

      if (window.scrollY > 0) {
        reset();
        return;
      }

      const delta = event.touches[0].clientY - startY.current;

      if (delta <= 0) {
        setDistance(0);
        return;
      }

      // Add resistance as the gesture gets longer so this feels like
      // native pull-to-refresh rather than dragging the whole page.
      const resisted = Math.min(
        MAX_PULL,
        delta * (delta < threshold ? 0.55 : 0.38),
      );

      setDistance(resisted);

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!active.current) return;

      const shouldRefresh = distance >= threshold * 0.55;
      reset();

      if (shouldRefresh) {
        void runRefresh();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });
    window.addEventListener("touchcancel", reset, {
      passive: true,
    });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [
    disabled,
    distance,
    reset,
    runRefresh,
    threshold,
  ]);

  const armed = distance >= threshold * 0.55;
  const visible = refreshing || distance > 2;

  return (
    <div
      className="relative"
      style={{
        overscrollBehaviorY: "contain",
      }}
    >
      <div
        aria-hidden={!visible}
        className="
          pointer-events-none absolute inset-x-0 top-0 z-20
          flex justify-center transition-opacity duration-150
        "
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${
            refreshing ? 10 : Math.max(0, distance - 42)
          }px)`,
        }}
      >
        <div
          className="
            inline-flex items-center gap-2 rounded-full border
            px-3 py-1.5 text-xs font-medium shadow-sm
          "
          style={{
            color: "var(--muted)",
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {refreshing ? (
            <LoaderCircle
              size={14}
              className="animate-spin"
            />
          ) : (
            <RotateCcw
              size={14}
              style={{
                transform: `rotate(${Math.min(
                  180,
                  distance * 2.2,
                )}deg)`,
              }}
            />
          )}

          <span>
            {refreshing
              ? "Refreshing…"
              : armed
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>

      <div
        className="transition-transform duration-150"
        style={{
          transform:
            visible && !refreshing
              ? `translateY(${Math.min(distance, 36)}px)`
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
